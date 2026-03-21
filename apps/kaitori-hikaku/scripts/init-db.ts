import initSqlJs from "sql.js";
import path from "path";
import fs from "fs";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "kaitori.db");

async function main() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const SQL = await initSqlJs();
  const db = new SQL.Database();

  db.run("PRAGMA foreign_keys = ON");

  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      brand TEXT DEFAULT '',
      jan_code TEXT UNIQUE,
      retail_price INTEGER,
      image_url TEXT DEFAULT '',
      category TEXT DEFAULT '',
      slug TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS buyback_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      shop_name TEXT NOT NULL,
      price INTEGER NOT NULL,
      source_url TEXT DEFAULT '',
      scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  db.run("CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug)");
  db.run("CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)");
  db.run("CREATE INDEX IF NOT EXISTS idx_products_jan ON products(jan_code)");
  db.run("CREATE INDEX IF NOT EXISTS idx_buyback_product ON buyback_prices(product_id)");
  db.run("CREATE INDEX IF NOT EXISTS idx_buyback_scraped ON buyback_prices(scraped_at)");

  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
  db.close();

  console.log("Database initialized at:", DB_PATH);
}

main().catch(console.error);
