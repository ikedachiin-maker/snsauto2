import initSqlJs from "sql.js";
import path from "path";
import fs from "fs";
import * as cheerio from "cheerio";

const DB_PATH = path.join(process.cwd(), "data", "kaitori.db");
const DELAY_MS = 3000; // Longer delay to avoid rate limiting

interface Product {
  id: number;
  name: string;
  jan_code: string;
  retail_price: number | null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Try to fetch retail price from Amazon using JAN code
async function fetchRetailPriceFromAmazon(janCode: string, productName: string): Promise<number | null> {
  try {
    // Search Amazon Japan by JAN code
    const searchUrl = `https://www.amazon.co.jp/s?k=${janCode}`;
    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "ja,en;q=0.9",
      },
    });

    if (!res.ok) return null;

    const html = await res.text();
    const $ = cheerio.load(html);

    // Try to find price in search results
    // Amazon has multiple price selectors
    const priceSelectors = [
      ".a-price-whole",
      ".a-price .a-offscreen",
      ".a-color-price",
    ];

    for (const selector of priceSelectors) {
      const priceEl = $(selector).first();
      if (priceEl.length) {
        const priceText = priceEl.text();
        const priceMatch = priceText.match(/[\d,]+/);
        if (priceMatch) {
          const price = parseInt(priceMatch[0].replace(/,/g, ""), 10);
          if (price > 0 && price < 10000000) {
            console.log(`  Found Amazon price: ¥${price.toLocaleString()}`);
            return price;
          }
        }
      }
    }

    return null;
  } catch (err) {
    console.error(`  Amazon fetch error: ${err}`);
    return null;
  }
}

// Fallback: Try to extract price from product name
function extractPriceFromName(name: string): number | null {
  // Some product names include the price
  const patterns = [
    /定価[：:]\s*[¥￥]?([\d,]+)円?/,
    /参考価格[：:]\s*[¥￥]?([\d,]+)円?/,
    /\(¥([\d,]+)\)/,
  ];

  for (const pattern of patterns) {
    const match = name.match(pattern);
    if (match) {
      const price = parseInt(match[1].replace(/,/g, ""), 10);
      if (price > 0 && price < 10000000) {
        return price;
      }
    }
  }

  return null;
}

// Manual retail prices for popular products (as fallback)
const knownPrices: Record<string, number> = {
  // PS5
  "4948872415934": 66980, // PS5 Slim CFI-2000A01
  "4948872415941": 60478, // PS5 Digital Edition
  "4948872415620": 60478, // PS5 CFI-1200B01
  "4948872415613": 66980, // PS5 CFI-1200A01

  // Nintendo Switch
  "4902370548495": 32978, // Nintendo Switch (有機EL)
  "4902370542905": 29980, // Nintendo Switch
  "4902370535709": 21978, // Nintendo Switch Lite

  //炊飯器 (Tiger)
  "4904710437681": 86184, // TIGER JPI-X100-KX
  "4904710437698": 86184, // TIGER JPI-X100-WX

  // 象印
  "4974305224149": 56000, // ZOJIRUSHI NW-PV10-BZ
  "4974305224163": 56000, // ZOJIRUSHI NW-PV10-TZ
  "4974305224101": 43000, // ZOJIRUSHI NW-FB10-BZ
  "4974305224125": 43000, // ZOJIRUSHI NW-FB10-WZ
  "4974305224224": 65000, // ZOJIRUSHI NW-YA10-BA
  "4974305224248": 65000, // ZOJIRUSHI NW-YA10-WA

  // Dyson
  "5025155070857": 75900, // Dyson Cyclone V10 Fluffy

  // DeLonghi
  "4988371024756": 78000, // ECAM22020B
  "4988371024763": 78000, // ECAM22020W

  // Panasonic
  "4549980433997": 50000, // EH-SA0B-N

  // BALMUDA
  "4560330119378": 14850, // The Lantern L02A-BK
  "4560330118234": 38500, // The Speaker M01A-BK
};

async function main() {
  if (!fs.existsSync(DB_PATH)) {
    console.error("Database not found.");
    process.exit(1);
  }

  const SQL = await initSqlJs();
  const buffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(buffer);

  // Get all products without retail price
  const results = db.exec(
    "SELECT id, name, jan_code, retail_price FROM products WHERE retail_price IS NULL OR retail_price = 0"
  );

  if (results.length === 0 || results[0].values.length === 0) {
    console.log("No products need retail price updates.");
    db.close();
    return;
  }

  const products: Product[] = results[0].values.map((row) => ({
    id: row[0] as number,
    name: row[1] as string,
    jan_code: row[2] as string,
    retail_price: row[3] as number | null,
  }));

  console.log(`Found ${products.length} products without retail prices.`);
  console.log("Starting price fetch (this may take a while)...\n");

  let updated = 0;
  const maxToFetch = 100; // Limit to avoid excessive API calls

  for (let i = 0; i < Math.min(products.length, maxToFetch); i++) {
    const p = products[i];
    console.log(`[${i + 1}/${Math.min(products.length, maxToFetch)}] ${p.name.substring(0, 60)}...`);

    let price: number | null = null;

    // 1. Check known prices
    if (knownPrices[p.jan_code]) {
      price = knownPrices[p.jan_code];
      console.log(`  Using known price: ¥${price.toLocaleString()}`);
    }

    // 2. Extract from product name
    if (!price) {
      price = extractPriceFromName(p.name);
      if (price) {
        console.log(`  Extracted from name: ¥${price.toLocaleString()}`);
      }
    }

    // 3. Try Amazon (only for first 20 to avoid rate limiting)
    if (!price && i < 20) {
      console.log(`  Fetching from Amazon...`);
      price = await fetchRetailPriceFromAmazon(p.jan_code, p.name);
      await sleep(DELAY_MS);
    }

    // Update if we found a price
    if (price) {
      db.run("UPDATE products SET retail_price = ? WHERE id = ?", [price, p.id]);
      updated++;
      console.log(`  ✓ Updated retail price: ¥${price.toLocaleString()}\n`);
    } else {
      console.log(`  ✗ No price found\n`);
    }
  }

  // Save database
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
  db.close();

  console.log(`\nCompleted. Updated ${updated} products with retail prices.`);
  console.log("Run 'npm run export-json' to export the updated data.");
}

main().catch(console.error);
