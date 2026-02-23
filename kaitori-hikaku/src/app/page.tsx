import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { getAllProducts, getCategories, getProductCount } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let products;
  let categories: string[];
  let totalCount: number;

  try {
    products = await getAllProducts(undefined, "price", 12, 0);
    categories = await getCategories();
    totalCount = await getProductCount();
  } catch {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold mb-4">買取比較くん</h1>
        <p className="text-gray-500 mb-4">
          データベースが初期化されていません。
        </p>
        <pre className="bg-gray-100 p-4 rounded-lg inline-block text-sm text-left">
          npm run db:init{"\n"}npm run scrape
        </pre>
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <section className="text-center py-8">
        <h1 className="text-3xl font-bold mb-2">
          ゲーム機の買取価格をかんたん比較
        </h1>
        <p className="text-gray-600">
          {totalCount}件の商品の買取価格をチェック
        </p>
      </section>

      {/* Categories */}
      <section className="mb-8">
        <h2 className="text-lg font-bold mb-3">カテゴリ</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/products?category=${encodeURIComponent(cat)}`}
              className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              {cat}
            </Link>
          ))}
        </div>
      </section>

      {/* Popular Products */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">買取価格ランキング</h2>
          <Link
            href="/products"
            className="text-sm text-blue-600 hover:underline"
          >
            すべて見る →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
