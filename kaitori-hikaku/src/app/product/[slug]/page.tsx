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
  const retailPrice = product.retail_price || 0;
  const buybackPrice = product.buyback_price || 0;
  const priceDiff = retailPrice > 0 ? retailPrice - buybackPrice : 0;
  const priceRate = product.price_rate || 0;

  return (
    <div>
      <Link
        href="/products"
        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mb-6 font-medium hover:underline"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        商品一覧に戻る
      </Link>

      <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-lg">
        <div className="lg:flex">
          {/* Image */}
          <div className="lg:w-2/5 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-12">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="max-w-full max-h-96 object-contain"
              />
            ) : (
              <div className="text-gray-400 text-4xl">📦</div>
            )}
          </div>

          {/* Info */}
          <div className="lg:w-3/5 p-8">
            {/* Category & Brand */}
            <div className="flex items-center gap-2 mb-3">
              {product.category && (
                <Link
                  href={`/products?category=${encodeURIComponent(product.category)}`}
                  className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold hover:bg-blue-200 transition-colors"
                >
                  {product.category}
                </Link>
              )}
              {product.brand && (
                <span className="text-gray-500 text-sm font-medium">
                  {product.brand}
                </span>
              )}
            </div>

            {/* Product name */}
            <h1 className="text-3xl font-bold mb-4 text-gray-800 leading-tight">
              {product.name}
            </h1>

            {/* JAN code */}
            {product.jan_code && (
              <div className="text-sm text-gray-500 mb-6">
                JAN: <span className="font-mono">{product.jan_code}</span>
              </div>
            )}

            {/* Price comparison card */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 mb-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Buyback price */}
                <div>
                  <div className="text-sm text-green-700 font-semibold mb-2 flex items-center gap-2">
                    <span className="text-xl">💰</span>
                    買取価格
                  </div>
                  <div className="text-4xl font-bold text-green-600">
                    {buybackPrice > 0
                      ? `¥${buybackPrice.toLocaleString()}`
                      : "価格情報なし"}
                  </div>
                  <div className="text-xs text-green-700 mt-2">
                    （買取wiki / 家電買取wiki）
                  </div>
                </div>

                {/* Retail price & diff */}
                {retailPrice > 0 && (
                  <div>
                    <div className="text-sm text-gray-700 font-semibold mb-2 flex items-center gap-2">
                      <span className="text-xl">🏷️</span>
                      定価（参考）
                    </div>
                    <div className="text-3xl font-bold text-gray-700">
                      ¥{retailPrice.toLocaleString()}
                    </div>
                    {priceDiff > 0 && (
                      <div className="mt-2 text-red-600 font-bold text-lg">
                        差額: -¥{priceDiff.toLocaleString()}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Return rate */}
              {priceRate > 0 && (
                <div className="mt-6 pt-6 border-t-2 border-green-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-green-800">
                      還元率（買取価格÷定価）
                    </span>
                    <div
                      className={`text-3xl font-bold px-6 py-3 rounded-xl ${
                        priceRate >= 80
                          ? "bg-red-100 text-red-700 ring-4 ring-red-300"
                          : priceRate >= 60
                            ? "bg-orange-100 text-orange-700 ring-2 ring-orange-300"
                            : priceRate >= 40
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {priceRate}%
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* CTA Button */}
            <a
              href="https://gamekaitori.jp/all-goods"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all text-lg font-bold shadow-lg hover:shadow-xl"
            >
              買取店で詳細を見る →
            </a>
          </div>
        </div>
      </div>

      {/* Price History */}
      {history.length > 1 && (
        <div className="mt-8 bg-white rounded-2xl border-2 border-gray-200 p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
            <span className="text-3xl">📊</span>
            買取価格の推移
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-300 bg-gray-50">
                  <th className="text-left py-3 px-4 font-bold text-gray-700">日時</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-700">買取店</th>
                  <th className="text-right py-3 px-4 font-bold text-gray-700">買取価格</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-100 hover:bg-blue-50 transition-colors"
                  >
                    <td className="py-3 px-4 text-gray-600 font-mono text-xs">
                      {new Date(h.scraped_at).toLocaleString("ja-JP", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-700">{h.shop_name}</td>
                    <td className="py-3 px-4 text-right font-bold text-green-600 text-lg">
                      ¥{h.price.toLocaleString()}
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
