import initSqlJs, { Database as SqlJsDatabase } from "sql.js";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "kaitori.db");

let db: SqlJsDatabase | null = null;
let SQL: Awaited<ReturnType<typeof initSqlJs>> | null = null;

export async function getDb(): Promise<SqlJsDatabase> {
  if (db) return db;

  if (!SQL) {
    SQL = await initSqlJs();
  }

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run("PRAGMA foreign_keys = ON");
  return db;
}

export function saveDb(): void {
  if (!db) return;
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

export interface Product {
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
}

export interface BuybackPrice {
  id: number;
  product_id: number;
  shop_name: string;
  price: number;
  source_url: string;
  scraped_at: string;
}

export interface ProductWithPrice extends Product {
  buyback_price: number | null;
  price_rate: number | null;
}

function rowsToObjects<T>(stmt: ReturnType<SqlJsDatabase["prepare"]>): T[] {
  const results: T[] = [];
  const cols = stmt.getColumnNames();
  while (stmt.step()) {
    const values = stmt.get();
    const obj: Record<string, unknown> = {};
    cols.forEach((col, i) => {
      obj[col] = values[i];
    });
    results.push(obj as T);
  }
  stmt.free();
  return results;
}

export async function getAllProducts(
  category?: string,
  sort?: string,
  limit = 50,
  offset = 0
): Promise<ProductWithPrice[]> {
  const db = await getDb();

  let where = "";
  const params: Record<string, string | number> = {};

  if (category) {
    where = "WHERE p.category = $category";
    params.$category = category;
  }

  let orderBy = "ORDER BY bp_price DESC";
  if (sort === "rate") {
    orderBy = "ORDER BY price_rate DESC";
  } else if (sort === "name") {
    orderBy = "ORDER BY p.name ASC";
  }

  const sql = `
    SELECT p.*,
      (SELECT price FROM buyback_prices WHERE product_id = p.id ORDER BY scraped_at DESC LIMIT 1) as buyback_price,
      CASE WHEN p.retail_price > 0
        THEN ROUND(CAST((SELECT price FROM buyback_prices WHERE product_id = p.id ORDER BY scraped_at DESC LIMIT 1) AS REAL) / p.retail_price * 100, 1)
        ELSE NULL
      END as price_rate,
      (SELECT price FROM buyback_prices WHERE product_id = p.id ORDER BY scraped_at DESC LIMIT 1) as bp_price
    FROM products p
    ${where}
    ${orderBy}
    LIMIT $limit OFFSET $offset
  `;

  params.$limit = limit;
  params.$offset = offset;

  const stmt = db.prepare(sql);
  stmt.bind(params);
  return rowsToObjects<ProductWithPrice>(stmt);
}

export async function getProductBySlug(
  slug: string
): Promise<ProductWithPrice | undefined> {
  const db = await getDb();

  const sql = `
    SELECT p.*,
      (SELECT price FROM buyback_prices WHERE product_id = p.id ORDER BY scraped_at DESC LIMIT 1) as buyback_price,
      CASE WHEN p.retail_price > 0
        THEN ROUND(CAST((SELECT price FROM buyback_prices WHERE product_id = p.id ORDER BY scraped_at DESC LIMIT 1) AS REAL) / p.retail_price * 100, 1)
        ELSE NULL
      END as price_rate
    FROM products p
    WHERE p.slug = $slug
  `;

  const stmt = db.prepare(sql);
  stmt.bind({ $slug: slug });
  const results = rowsToObjects<ProductWithPrice>(stmt);
  return results[0];
}

export async function getPriceHistory(
  productId: number
): Promise<BuybackPrice[]> {
  const db = await getDb();

  const stmt = db.prepare(
    `SELECT * FROM buyback_prices WHERE product_id = $pid ORDER BY scraped_at DESC LIMIT 30`
  );
  stmt.bind({ $pid: productId });
  return rowsToObjects<BuybackPrice>(stmt);
}

export async function searchProducts(
  query: string,
  limit = 20
): Promise<ProductWithPrice[]> {
  const db = await getDb();
  const like = `%${query}%`;

  const sql = `
    SELECT p.*,
      (SELECT price FROM buyback_prices WHERE product_id = p.id ORDER BY scraped_at DESC LIMIT 1) as buyback_price,
      CASE WHEN p.retail_price > 0
        THEN ROUND(CAST((SELECT price FROM buyback_prices WHERE product_id = p.id ORDER BY scraped_at DESC LIMIT 1) AS REAL) / p.retail_price * 100, 1)
        ELSE NULL
      END as price_rate
    FROM products p
    WHERE p.name LIKE $q OR p.jan_code LIKE $q OR p.brand LIKE $q
    ORDER BY (SELECT price FROM buyback_prices WHERE product_id = p.id ORDER BY scraped_at DESC LIMIT 1) DESC
    LIMIT $limit
  `;

  const stmt = db.prepare(sql);
  stmt.bind({ $q: like, $limit: limit });
  return rowsToObjects<ProductWithPrice>(stmt);
}

export async function getCategories(): Promise<string[]> {
  const db = await getDb();
  const stmt = db.prepare(
    "SELECT DISTINCT category FROM products WHERE category != '' ORDER BY category"
  );
  const rows = rowsToObjects<{ category: string }>(stmt);
  return rows.map((r) => r.category);
}

export async function getProductCount(category?: string): Promise<number> {
  const db = await getDb();
  let sql = "SELECT COUNT(*) as count FROM products";
  const params: Record<string, string> = {};
  if (category) {
    sql += " WHERE category = $category";
    params.$category = category;
  }
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = rowsToObjects<{ count: number }>(stmt);
  return rows[0]?.count || 0;
}
