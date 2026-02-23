import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { getAllProducts, getCategories, getProductCount } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let products;
  let categories: string[];
  let totalCount: number;

  try {
    products = await getAllProducts(undefined, "price", 16, 0);
    categories = await getCategories();
    totalCount = await getProductCount();
  } catch {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">買取比較くん</h1>
        <p className="text-gray-600 mb-6">
          データベースが初期化されていません。
        </p>
        <pre className="bg-gray-100 p-6 rounded-xl inline-block text-sm text-left font-mono border border-gray-300">
          npm run db:init{"\n"}npm run scrape
        </pre>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-8 mb-8 shadow-lg">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold mb-3">
            買取価格を一括比較
          </h1>
          <p className="text-xl text-blue-100 mb-4">
            {totalCount.toLocaleString()}件の商品から最高値を検索
          </p>
          <div className="flex gap-4 text-sm">
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
              💰 最高買取価格を比較
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
              📊 還元率で一目瞭然
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
              ⚡ リアルタイム更新
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
          <span className="text-2xl">📂</span>
          カテゴリから探す
        </h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/products?category=${encodeURIComponent(cat)}`}
              className="px-5 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 transition-all shadow-sm hover:shadow"
            >
              {cat}
            </Link>
          ))}
        </div>
      </section>

      {/* Popular Products */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            高額買取ランキング
          </h2>
          <Link
            href="/products"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline flex items-center gap-1"
          >
            すべて見る
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mt-12 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-8 border border-gray-200">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          買取比較くんの特徴
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-3xl mb-3">💎</div>
            <h3 className="font-bold text-lg mb-2 text-gray-800">最高価格保証</h3>
            <p className="text-sm text-gray-600">
              複数の買取店から最も高い価格を自動で抽出。損をしません。
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-bold text-lg mb-2 text-gray-800">リアルタイム更新</h3>
            <p className="text-sm text-gray-600">
              毎日最新の買取価格を自動取得。常に正確な情報をお届け。
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-3xl mb-3">📈</div>
            <h3 className="font-bold text-lg mb-2 text-gray-800">還元率表示</h3>
            <p className="text-sm text-gray-600">
              定価からどれだけ損するか一目瞭然。賢く売却できます。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
