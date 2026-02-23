import * as cheerio from "cheerio";
import initSqlJs from "sql.js";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "kaitori.db");
const BASE_URL = "https://gamekaitori.jp";
const SHOP_NAME = "買取wiki";
const DELAY_MS = 2000;

interface ScrapedProduct {
  name: string;
  brand: string;
  jan_code: string;
  price: number;
  image_url: string;
  source_url: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function slugify(name: string, jan: string): string {
  const base = name
    .replace(/[^\w\s\u3000-\u9FFF-]/g, "")
    .replace(/[\s\u3000]+/g, "-")
    .toLowerCase()
    .slice(0, 80);
  return jan ? `${base}-${jan}` : base;
}

function categorize(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("switch") || lower.includes("nintendo")) return "Nintendo Switch";
  if (lower.includes("ps5") || lower.includes("playstation 5") || lower.includes("プレイステーション5")) return "PS5";
  if (lower.includes("ps4") || lower.includes("playstation 4") || lower.includes("プレイステーション4")) return "PS4";
  if (lower.includes("ps3") || lower.includes("playstation 3")) return "PS3";
  if (lower.includes("xbox")) return "Xbox";
  if (lower.includes("wii")) return "Wii";
  if (lower.includes("3ds")) return "3DS";
  if (lower.includes("vita") || lower.includes("psp")) return "PSP/Vita";
  if (lower.includes("ファミコン") || lower.includes("スーパーファミコン")) return "レトロゲーム";
  if (lower.includes("セガ") || lower.includes("sega") || lower.includes("ゲームボーイ")) return "レトロゲーム";
  if (lower.includes("pc") || lower.includes("steam") || lower.includes("gpu") || lower.includes("グラフィックボード")) return "PC";
  return "その他";
}

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "ja,en;q=0.9",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function parseProductsFromPage(html: string): ScrapedProduct[] {
  const $ = cheerio.load(html);
  const products: ScrapedProduct[] = [];

  // Each product is inside .pro_list
  $(".pro_list").each((_, el) => {
    const block = $(el);

    // Product name & URL from the purchase link (the one with img alt text)
    const img = block.find("img.img-responsive").first();
    const name = (img.attr("alt") || "").trim();
    const imageUrl = img.attr("src") || "";

    // Purchase link for source URL
    const purchaseLink = block.find('a[href*="/purchase/"]').first().attr("href") || "";
    const sourceUrl = purchaseLink.startsWith("http")
      ? purchaseLink
      : `${BASE_URL}${purchaseLink}`;

    // JAN code from .sub-pro-name containing "JAN"
    let janCode = "";
    block.find(".sub-pro-name").each((_, li) => {
      const text = $(li).text();
      const janMatch = text.match(/JAN[：:]\s*(\d{13})/);
      if (janMatch) {
        janCode = janMatch[1];
      }
    });

    // Price from .sub-pro-jia
    let price = 0;
    const priceEl = block.find(".sub-pro-jia");
    if (priceEl.length) {
      const priceText = priceEl.text();
      const priceMatch = priceText.match(/([\d,]+)\s*円/);
      if (priceMatch) {
        price = parseInt(priceMatch[1].replace(/,/g, ""), 10);
      }
    }

    // Brand from .sub-pro-brand or first sub-pro link
    let brand = "";
    const brandEl = block.find(".sub-pro-brand a, .sub-pro li a").first();
    if (brandEl.length) {
      const brandText = brandEl.text().trim();
      if (brandText.length < 40 && !brandText.includes("買取") && !brandText.includes("免税")) {
        brand = brandText;
      }
    }

    if (name && janCode && price > 0) {
      products.push({
        name,
        brand,
        jan_code: janCode,
        price,
        image_url: imageUrl,
        source_url: sourceUrl,
      });
    }
  });

  return products;
}

export async function scrapeAllProducts(): Promise<void> {
  if (!fs.existsSync(DB_PATH)) {
    throw new Error("Database not found. Run `npm run db:init` first.");
  }

  const SQL = await initSqlJs();
  const buffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(buffer);
  db.run("PRAGMA foreign_keys = ON");

  let totalProducts = 0;
  let page = 1;
  const maxPages = 15;

  console.log("Starting scrape of gamekaitori.jp...");

  while (page <= maxPages) {
    const url =
      page === 1
        ? `${BASE_URL}/all-goods`
        : `${BASE_URL}/all-goods/${page}/name/all`;

    console.log(`Fetching page ${page}: ${url}`);

    try {
      const html = await fetchPage(url);
      const products = parseProductsFromPage(html);

      if (products.length === 0) {
        console.log(`No products found on page ${page}. Stopping.`);
        break;
      }

      for (const p of products) {
        const category = categorize(p.name);
        const slug = slugify(p.name, p.jan_code);

        try {
          // Check if product exists
          const existing = db.exec(
            "SELECT id FROM products WHERE jan_code = ?",
            [p.jan_code]
          );

          let productId: number;

          if (existing.length > 0 && existing[0].values.length > 0) {
            productId = existing[0].values[0][0] as number;
            db.run(
              `UPDATE products SET name=?, brand=?, image_url=?, category=?, updated_at=datetime('now') WHERE id=?`,
              [p.name, p.brand, p.image_url, category, productId]
            );
          } else {
            db.run(
              `INSERT INTO products (name, brand, jan_code, image_url, category, slug)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [p.name, p.brand, p.jan_code, p.image_url, category, slug]
            );
            const idResult = db.exec(
              "SELECT id FROM products WHERE jan_code = ?",
              [p.jan_code]
            );
            productId = idResult[0].values[0][0] as number;
          }

          // Insert price record
          db.run(
            `INSERT INTO buyback_prices (product_id, shop_name, price, source_url)
             VALUES (?, ?, ?, ?)`,
            [productId, SHOP_NAME, p.price, p.source_url]
          );
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          if (!msg.includes("UNIQUE")) {
            console.error(`  Error: ${p.name}: ${msg}`);
          }
        }
      }

      totalProducts += products.length;
      console.log(`  Found ${products.length} products (total: ${totalProducts})`);

      // Save periodically
      const data = db.export();
      fs.writeFileSync(DB_PATH, Buffer.from(data));

      page++;
      if (page <= maxPages) {
        await sleep(DELAY_MS);
      }
    } catch (err) {
      console.error(`Error on page ${page}:`, err);
      break;
    }
  }

  // Final save
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
  db.close();

  console.log(`\nScrape complete. Total products: ${totalProducts}`);
}
