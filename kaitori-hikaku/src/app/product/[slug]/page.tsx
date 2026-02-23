import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getPriceHistory } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(decodeURIComponent(slug));

  if (!product) {
    notFound();
  }

  const history = await getPriceHistory(product.id);

  return (
    <div>
      <Link
        href="/products"
        className="text-sm text-blue-600 hover:underline mb-4 inline-block"
      >
        ← 商品一覧に戻る
      </Link>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="md:flex">
          {/* Image */}
          <div className="md:w-1/3 bg-gray-100 flex items-center justify-center p-8">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="max-w-full max-h-64 object-contain"
              />
            ) : (
              <div className="text-gray-400">No Image</div>
            )}
          </div>

          {/* Info */}
          <div className="md:w-2/3 p-6">
            <div className="text-sm text-gray-500 mb-1">{product.brand}</div>
            <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
            <div className="text-sm text-gray-500 mb-4">
              カテゴリ:{" "}
              <Link
                href={`/products?category=${encodeURIComponent(product.category)}`}
                className="text-blue-600 hover:underline"
              >
                {product.category}
              </Link>
              {product.jan_code && (
                <span className="ml-4">JAN: {product.jan_code}</span>
              )}
            </div>

            {/* Price Card */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="text-sm text-green-700 mb-1">
                買取価格（買取wiki）
              </div>
              <div className="text-3xl font-bold text-green-600">
                {product.buyback_price
                  ? `${product.buyback_price.toLocaleString()}円`
                  : "価格情報なし"}
              </div>
              {product.retail_price && (
                <div className="mt-2 text-sm text-gray-600">
                  定価: {product.retail_price.toLocaleString()}円
                  {product.price_rate && (
                    <span
                      className={`ml-2 font-bold ${
                        product.price_rate >= 70
                          ? "text-red-500"
                          : product.price_rate >= 50
                            ? "text-orange-500"
                            : "text-gray-600"
                      }`}
                    >
                      （還元率 {product.price_rate}%）
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* External Link */}
            <a
              href="https://gamekaitori.jp/all-goods"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              買取wikiで詳細を見る →
            </a>
          </div>
        </div>
      </div>

      {/* Price History */}
      {history.length > 1 && (
        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold mb-4">買取価格の推移</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3">日時</th>
                  <th className="text-left py-2 px-3">買取店</th>
                  <th className="text-right py-2 px-3">買取価格</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr
                    key={h.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-2 px-3 text-gray-600">
                      {new Date(h.scraped_at).toLocaleString("ja-JP")}
                    </td>
                    <td className="py-2 px-3">{h.shop_name}</td>
                    <td className="py-2 px-3 text-right font-medium text-green-600">
                      {h.price.toLocaleString()}円
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
