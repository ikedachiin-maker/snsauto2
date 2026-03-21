import path from "path";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), "data", "json");

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
  id?: number;
  product_id?: number;
  shop_name: string;
  price: number;
  source_url?: string;
  scraped_at: string;
}

export interface ProductWithPrice extends Product {
  buyback_price: number | null;
  price_rate: number | null;
}

let productsCache: ProductWithPrice[] | null = null;
let categoriesCache: string[] | null = null;
let historyCache: Record<string, BuybackPrice[]> | null = null;

function loadProducts(): ProductWithPrice[] {
  if (productsCache) return productsCache;
  const filePath = path.join(DATA_DIR, "products.json");
  if (!fs.existsSync(filePath)) return [];
  productsCache = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return productsCache!;
}

function loadCategories(): string[] {
  if (categoriesCache) return categoriesCache;
  const filePath = path.join(DATA_DIR, "categories.json");
  if (!fs.existsSync(filePath)) return [];
  categoriesCache = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return categoriesCache!;
}

function loadHistory(): Record<string, BuybackPrice[]> {
  if (historyCache) return historyCache;
  const filePath = path.join(DATA_DIR, "history.json");
  if (!fs.existsSync(filePath)) return {};
  historyCache = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return historyCache!;
}

export async function getAllProducts(
  category?: string,
  sort?: string,
  limit = 50,
  offset = 0
): Promise<ProductWithPrice[]> {
  let products = loadProducts();

  if (category) {
    products = products.filter((p) => p.category === category);
  }

  if (sort === "rate") {
    products = [...products].sort((a, b) => (b.price_rate ?? 0) - (a.price_rate ?? 0));
  } else if (sort === "name") {
    products = [...products].sort((a, b) => a.name.localeCompare(b.name, "ja"));
  }
  // default is already sorted by price DESC from export

  return products.slice(offset, offset + limit);
}

export async function getProductBySlug(
  slug: string
): Promise<ProductWithPrice | undefined> {
  const products = loadProducts();
  return products.find((p) => p.slug === slug);
}

export async function getPriceHistory(
  productId: number
): Promise<BuybackPrice[]> {
  const history = loadHistory();
  return history[String(productId)] || [];
}

export async function searchProducts(
  query: string,
  limit = 20
): Promise<ProductWithPrice[]> {
  const products = loadProducts();
  const q = query.toLowerCase();
  return products
    .filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.jan_code && p.jan_code.includes(q)) ||
        p.brand.toLowerCase().includes(q)
    )
    .slice(0, limit);
}

export async function getCategories(): Promise<string[]> {
  return loadCategories();
}

export async function getProductCount(category?: string): Promise<number> {
  const products = loadProducts();
  if (category) {
    return products.filter((p) => p.category === category).length;
  }
  return products.length;
}
