import initSqlJs from "sql.js";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "kaitori.db");
const OUT_DIR = path.join(process.cwd(), "data", "json");

interface ProductRow {
  id: number;
  name: string;
  brand: string;
  jan_code: string;
  retail_price: number | null;
  image_url: string;
  category: string;
  slug: string;
  created_at: string;
  updated_at: string;
  buyback_price: number | null;
  price_rate: number | null;
}

async function main() {
  if (!fs.existsSync(DB_PATH)) {
    console.error("DB not found. Run npm run db:init && npm run scrape first.");
    process.exit(1);
  }

  const SQL = await initSqlJs();
  const buffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(buffer);

  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  // Export all products with latest price
  const results = db.exec(`
    SELECT p.*,
      (SELECT price FROM buyback_prices WHERE product_id = p.id ORDER BY scraped_at DESC LIMIT 1) as buyback_price,
      CASE WHEN p.retail_price > 0
        THEN ROUND(CAST((SELECT price FROM buyback_prices WHERE product_id = p.id ORDER BY scraped_at DESC LIMIT 1) AS REAL) / p.retail_price * 100, 1)
        ELSE NULL
      END as price_rate
    FROM products p
    ORDER BY buyback_price DESC
  `);

  const cols = results[0]?.columns || [];
  const products: ProductRow[] = (results[0]?.values || []).map((row) => {
    const obj: Record<string, unknown> = {};
    cols.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj as ProductRow;
  });

  // Export price history for each product
  const historyResults = db.exec(`
    SELECT product_id, shop_name, price, scraped_at
    FROM buyback_prices
    ORDER BY product_id, scraped_at DESC
  `);

  const historyMap: Record<number, { shop_name: string; price: number; scraped_at: string }[]> = {};
  if (historyResults.length > 0) {
    for (const row of historyResults[0].values) {
      const pid = row[0] as number;
      if (!historyMap[pid]) historyMap[pid] = [];
      historyMap[pid].push({
        shop_name: row[1] as string,
        price: row[2] as number,
        scraped_at: row[3] as string,
      });
    }
  }

  // Get categories
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))].sort();

  // Write main data
  fs.writeFileSync(path.join(OUT_DIR, "products.json"), JSON.stringify(products));
  fs.writeFileSync(path.join(OUT_DIR, "categories.json"), JSON.stringify(categories));
  fs.writeFileSync(path.join(OUT_DIR, "history.json"), JSON.stringify(historyMap));

  db.close();
  console.log(`Exported ${products.length} products, ${categories.length} categories to ${OUT_DIR}`);
}

main().catch(console.error);
