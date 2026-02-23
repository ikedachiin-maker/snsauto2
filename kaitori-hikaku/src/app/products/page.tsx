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
      <h1 className="text-2xl font-bold mb-4">
        {category || "すべての商品"}
        <span className="text-sm font-normal text-gray-500 ml-2">
          ({totalCount}件)
        </span>
      </h1>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Link
          href="/products"
          className={`px-3 py-1 rounded-full text-sm border ${
            !category
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white border-gray-200 hover:bg-gray-50"
          }`}
        >
          すべて
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat}
            href={`/products?category=${encodeURIComponent(cat)}${sort ? `&sort=${sort}` : ""}`}
            className={`px-3 py-1 rounded-full text-sm border ${
              category === cat
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white border-gray-200 hover:bg-gray-50"
            }`}
          >
            {cat}
          </Link>
        ))}
      </div>

      {/* Sort */}
      <div className="flex gap-2 mb-4 text-sm">
        <span className="text-gray-500">並び替え:</span>
        {[
          { key: "price", label: "買取価格順" },
          { key: "rate", label: "還元率順" },
          { key: "name", label: "名前順" },
        ].map((s) => (
          <Link
            key={s.key}
            href={`/products?${category ? `category=${encodeURIComponent(category)}&` : ""}sort=${s.key}`}
            className={`px-2 py-0.5 rounded ${
              sort === s.key
                ? "bg-blue-100 text-blue-700 font-medium"
                : "text-gray-600 hover:text-blue-600"
            }`}
          >
            {s.label}
          </Link>
        ))}
      </div>

      {/* Product Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          商品が見つかりませんでした
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {page > 1 && (
            <Link
              href={`/products?${category ? `category=${encodeURIComponent(category)}&` : ""}sort=${sort}&page=${page - 1}`}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              前へ
            </Link>
          )}
          <span className="px-4 py-2 text-sm text-gray-600">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/products?${category ? `category=${encodeURIComponent(category)}&` : ""}sort=${sort}&page=${page + 1}`}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              次へ
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
