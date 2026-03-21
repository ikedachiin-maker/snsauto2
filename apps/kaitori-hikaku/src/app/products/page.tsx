import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { getAllProducts, getCategories, getProductCount } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string; page?: string }>;
}) {
  const params = await searchParams;
  const category = params.category;
  const sort = params.sort || "price";
  const page = parseInt(params.page || "1", 10);
  const perPage = 24;
  const offset = (page - 1) * perPage;

  const products = await getAllProducts(category, sort, perPage, offset);
  const categories = await getCategories();
  const totalCount = await getProductCount(category);
  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <div>
      {/* Page header */}
      <div className="bg-white rounded-2xl p-6 mb-6 border-2 border-gray-200 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {category || "すべての商品"}
        </h1>
        <p className="text-gray-600">
          {totalCount.toLocaleString()}件の商品から検索
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <span>🏷️</span>
          カテゴリフィルタ
        </h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/products"
            className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
              !category
                ? "bg-blue-600 text-white border-blue-600 shadow-md"
                : "bg-white border-gray-200 hover:border-blue-400 hover:bg-blue-50"
            }`}
          >
            すべて
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/products?category=${encodeURIComponent(cat)}${sort ? `&sort=${sort}` : ""}`}
              className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                category === cat
                  ? "bg-blue-600 text-white border-blue-600 shadow-md"
                  : "bg-white border-gray-200 hover:border-blue-400 hover:bg-blue-50"
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div className="flex items-center gap-3 mb-6 bg-white rounded-xl p-4 border-2 border-gray-200">
        <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <span>🔄</span>
          並び替え:
        </span>
        <div className="flex gap-2">
          {[
            { key: "price", label: "買取価格が高い順" },
            { key: "rate", label: "還元率が高い順" },
            { key: "name", label: "名前順" },
          ].map((s) => (
            <Link
              key={s.key}
              href={`/products?${category ? `category=${encodeURIComponent(category)}&` : ""}sort=${s.key}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                sort === s.key
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-gray-200">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-gray-500 text-lg">商品が見つかりませんでした</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {page > 1 && (
            <Link
              href={`/products?${category ? `category=${encodeURIComponent(category)}&` : ""}sort=${sort}&page=${page - 1}`}
              className="px-5 py-2.5 bg-white border-2 border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-400 font-medium transition-all shadow-sm"
            >
              ← 前へ
            </Link>
          )}
          <span className="px-5 py-2.5 text-sm text-gray-600 font-medium">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/products?${category ? `category=${encodeURIComponent(category)}&` : ""}sort=${sort}&page=${page + 1}`}
              className="px-5 py-2.5 bg-white border-2 border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-400 font-medium transition-all shadow-sm"
            >
              次へ →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
