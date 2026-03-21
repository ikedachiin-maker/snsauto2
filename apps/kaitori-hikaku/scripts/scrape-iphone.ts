import * as cheerio from "cheerio";
import initSqlJs from "sql.js";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "kaitori.db");
const BASE_URL = "https://iphonekaitori.tokyo";
const SHOP_NAME = "スマホ買取wiki";
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
  return jan ? `${base}-${jan}` : `iphone-${base}`;
}

function categorize(name: string): string {
  const lower = name.toLowerCase();

  // Apple products
  if (lower.includes("iphone")) return "iPhone";
  if (lower.includes("ipad")) return "iPad";
  if (lower.includes("macbook") || lower.includes("imac") || lower.includes("mac mini") || lower.includes("mac pro") || lower.includes("mac studio")) return "Mac";
  if (lower.includes("apple watch")) return "Apple Watch";
  if (lower.includes("airpods") || lower.includes("airpod")) return "AirPods";

  // Android smartphones
  if (lower.includes("xperia")) return "Xperia";
  if (lower.includes("galaxy")) return "Galaxy";
  if (lower.includes("pixel") && !lower.includes("buds")) return "Google Pixel";
  if (lower.includes("aquos")) return "AQUOS";
  if (lower.includes("arrows")) return "arrows";
  if (lower.includes("oppo") || lower.includes("reno")) return "OPPO";
  if (lower.includes("xiaomi") || lower.includes("redmi") || lower.includes("poco")) return "Xiaomi";
  if (lower.includes("huawei") || lower.includes("ファーウェイ")) return "HUAWEI";
  if (lower.includes("motorola") || lower.includes("moto ")) return "Motorola";
  if (lower.includes("asus") || lower.includes("zenfone") || lower.includes("rog phone")) return "ASUS";
  if (lower.includes("kyocera") || lower.includes("京セラ") || lower.includes("torque") || lower.includes("digno") || lower.includes("basio")) return "Kyocera";
  if (lower.includes("fujitsu") || lower.includes("富士通") || lower.includes("らくらくスマートフォン")) return "Fujitsu";

  // Game consoles (reuse existing categories)
  if (lower.includes("switch") || lower.includes("nintendo")) return "Nintendo Switch";
  if (lower.includes("ps5") || lower.includes("playstation 5")) return "PS5";
  if (lower.includes("xbox")) return "Xbox";

  // Camera
  if (lower.includes("カメラ") || lower.includes("一眼") || lower.includes("レンズ") || lower.includes("canon eos") || lower.includes("nikon") || lower.includes("sony α") || lower.includes("fujifilm") || lower.includes("gopro")) return "カメラ";

  // PC
  if (lower.includes("パソコン") || lower.includes("ノートpc") || lower.includes("laptop") || lower.includes("thinkpad") || lower.includes("surface") || lower.includes("dynabook")) return "パソコン";

  // Cosmetics
  if (lower.includes("化粧") || lower.includes("コスメ") || lower.includes("美容液") || lower.includes("ファンデ") || lower.includes("香水")) return "化粧品";

  // Audio (existing category)
  if (lower.includes("ヘッドホン") || lower.includes("イヤホン") || lower.includes("スピーカー") || lower.includes("sony wf-") || lower.includes("sony wh-") || lower.includes("bose") || lower.includes("beats") || lower.includes("pixel buds")) return "オーディオ";

  // Watches (existing category)
  if (lower.includes("watch") || lower.includes("ウォッチ") || lower.includes("時計") || lower.includes("garmin")) return "時計";

  // Appliances (existing categories)
  if (lower.includes("掃除機") || lower.includes("クリーナー") || lower.includes("dyson") || lower.includes("ダイソン")) return "掃除機";
  if (lower.includes("ドライヤー") || lower.includes("ヘアアイロン") || lower.includes("美顔") || lower.includes("脱毛")) return "美容家電";
  if (lower.includes("炊飯") || lower.includes("オーブン") || lower.includes("レンジ") || lower.includes("コーヒー")) return "調理家電";

  return "その他スマホ";
}

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
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

  $(".pro_list").each((_, el) => {
    const block = $(el);

    const img = block.find("img.img-responsive").first();
    const imageUrl = img.attr("src") || "";

    // Product name: use .sub-pro-name a text (not img alt which is generic "iPhoneX")
    const nameEl = block.find(".sub-pro-name a").first();
    const name = (nameEl.text() || img.attr("alt") || "").trim();

    const purchaseLink = block.find('a[href*="/purchase/"]').first().attr("href") || "";
    const sourceUrl = purchaseLink.startsWith("http")
      ? purchaseLink
      : `${BASE_URL}${purchaseLink}`;

    let janCode = "";
    block.find(".sub-pro-name").each((_, li) => {
      const text = $(li).text();
      const janMatch = text.match(/JAN[：:]\s*(\d{13})/);
      if (janMatch) {
        janCode = janMatch[1];
      }
    });

    let price = 0;
    const priceEl = block.find(".sub-pro-jia");
    if (priceEl.length) {
      const priceText = priceEl.text();
      const priceMatch = priceText.match(/([\d,]+)\s*円/);
      if (priceMatch) {
        price = parseInt(priceMatch[1].replace(/,/g, ""), 10);
      }
    }

    let brand = "";
    const brandEl = block.find("li a").first();
    if (brandEl.length) {
      const brandText = brandEl.text().trim();
      if (brandText.length < 40 && !brandText.includes("買取") && !brandText.includes("免税") && !brandText.includes("JAN")) {
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

// Brand pages to scrape (in addition to /all-goods)
const BRAND_PAGES = [
  "samsung",
  "google",
  "Xiaomi",
  "OPPO",
  "huawei",
  "asus",
  "fujitsu",
  "kyocera",
  "motorola",
];

async function scrapePages(
  db: InstanceType<Awaited<ReturnType<typeof initSqlJs>>["Database"]>,
  basePath: string,
  label: string,
  maxPages: number
): Promise<{ total: number; newCount: number; updated: number }> {
  let total = 0;
  let newCount = 0;
  let updated = 0;

  for (let page = 1; page <= maxPages; page++) {
    const url =
      page === 1
        ? `${BASE_URL}${basePath}`
        : `${BASE_URL}${basePath}${basePath.endsWith("/") ? "" : "/"}${page}/name/all`;

    console.log(`  [${label}] page ${page}: ${url}`);

    try {
      const html = await fetchPage(url);
      const products = parseProductsFromPage(html);

      if (products.length === 0) {
        console.log(`  [${label}] No products on page ${page}. Done.`);
        break;
      }

      for (const p of products) {
        const category = categorize(p.name);
        const slug = slugify(p.name, p.jan_code);

        try {
          const existing = db.exec(
            "SELECT id FROM products WHERE jan_code = ?",
            [p.jan_code]
          );

          let productId: number;

          if (existing.length > 0 && existing[0].values.length > 0) {
            productId = existing[0].values[0][0] as number;
            updated++;
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
            newCount++;
            console.log(`    + 新規: ${p.name.substring(0, 55)} [${category}]`);
          }

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

      total += products.length;
      console.log(`  [${label}] ${products.length} products (total: ${total}, new: ${newCount})`);

      if (page <= maxPages) {
        await sleep(DELAY_MS);
      }
    } catch (err) {
      console.error(`  [${label}] Error on page ${page}:`, err);
      break;
    }
  }

  return { total, newCount, updated };
}

async function main() {
  if (!fs.existsSync(DB_PATH)) {
    console.error("Database not found. Run npm run db:init first.");
    process.exit(1);
  }

  const SQL = await initSqlJs();
  const buffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(buffer);
  db.run("PRAGMA foreign_keys = ON");

  console.log("========================================");
  console.log("  iphonekaitori.tokyo スクレイピング");
  console.log("========================================\n");

  let grandTotal = 0;
  let grandNew = 0;
  let grandUpdated = 0;

  // 1. Scrape /all-goods (iPhones + featured)
  console.log("--- /all-goods (買取強化商品) ---");
  const allGoods = await scrapePages(db, "/all-goods", "all-goods", 20);
  grandTotal += allGoods.total;
  grandNew += allGoods.newCount;
  grandUpdated += allGoods.updated;

  // Save after all-goods
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));

  // 2. Scrape each brand page
  for (const brand of BRAND_PAGES) {
    console.log(`\n--- /brand/${brand}/ ---`);
    const result = await scrapePages(db, `/brand/${brand}/`, brand, 20);
    grandTotal += result.total;
    grandNew += result.newCount;
    grandUpdated += result.updated;

    // Save after each brand
    fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
  }

  db.close();

  console.log("\n========================================");
  console.log("  結果サマリー");
  console.log("========================================");
  console.log(`  総取得: ${grandTotal}商品`);
  console.log(`  新規追加: ${grandNew}商品`);
  console.log(`  既存更新: ${grandUpdated}商品`);
  console.log("========================================\n");
  console.log("次のステップ:");
  console.log("  npm run export-json");
}

main().catch(console.error);
