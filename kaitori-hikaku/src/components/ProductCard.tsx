import Link from "next/link";
import type { ProductWithPrice } from "@/lib/db";

export default function ProductCard({
  product,
}: {
  product: ProductWithPrice;
}) {
  const retailPrice = product.retail_price || 0;
  const buybackPrice = product.buyback_price || 0;
  const priceDiff = retailPrice > 0 ? retailPrice - buybackPrice : 0;
  const priceRate = product.price_rate || 0;

  return (
    <Link
      href={`/product/${product.slug}`}
      className="block bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-blue-400 transition-all overflow-hidden group"
    >
      {/* Image */}
      <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 relative">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform"
            loading="lazy"
          />
        ) : (
          <div className="text-gray-400 text-sm">No Image</div>
        )}
        {/* Category badge */}
        {product.category && (
          <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
            {product.category}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        {/* Brand */}
        {product.brand && (
          <div className="text-xs text-gray-500 mb-1 font-medium">
            {product.brand}
          </div>
        )}

        {/* Name */}
        <h3 className="text-sm font-bold line-clamp-2 mb-3 min-h-[2.5rem] text-gray-800">
          {product.name}
        </h3>

        {/* Price info */}
        <div className="space-y-2">
          {/* Buyback price (main highlight) */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
            <div className="text-xs text-green-700 font-medium mb-1">
              買取価格
            </div>
            <div className="text-2xl font-bold text-green-600">
              {buybackPrice > 0 ? `¥${buybackPrice.toLocaleString()}` : "—"}
            </div>
          </div>

          {/* Retail price & diff */}
          {retailPrice > 0 && (
            <div className="flex items-center justify-between text-xs">
              <div className="text-gray-500">
                定価: <span className="font-semibold text-gray-700">¥{retailPrice.toLocaleString()}</span>
              </div>
              {priceDiff > 0 && (
                <div className="text-red-600 font-bold">
                  -¥{priceDiff.toLocaleString()}
                </div>
              )}
            </div>
          )}

          {/* Return rate badge */}
          {priceRate > 0 && (
            <div className="flex items-center justify-between">
              <div
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold ${
                  priceRate >= 80
                    ? "bg-red-100 text-red-700 ring-2 ring-red-300"
                    : priceRate >= 60
                      ? "bg-orange-100 text-orange-700 ring-1 ring-orange-300"
                      : priceRate >= 40
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-600"
                }`}
              >
                還元率 {priceRate}%
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
