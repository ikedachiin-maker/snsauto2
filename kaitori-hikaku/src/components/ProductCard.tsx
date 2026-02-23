import Link from "next/link";
import type { ProductWithPrice } from "@/lib/db";

export default function ProductCard({
  product,
}: {
  product: ProductWithPrice;
}) {
  return (
    <Link
      href={`/product/${product.slug}`}
      className="block bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
    >
      <div className="aspect-square bg-gray-100 flex items-center justify-center p-2">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="max-w-full max-h-full object-contain"
            loading="lazy"
          />
        ) : (
          <div className="text-gray-400 text-sm">No Image</div>
        )}
      </div>
      <div className="p-3">
        <div className="text-xs text-gray-500 mb-1">{product.brand}</div>
        <h3 className="text-sm font-medium line-clamp-2 mb-2">
          {product.name}
        </h3>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs text-gray-500">買取価格</div>
            <div className="text-lg font-bold text-green-600">
              {product.buyback_price
                ? `${product.buyback_price.toLocaleString()}円`
                : "-"}
            </div>
          </div>
          {product.retail_price && product.price_rate && (
            <div className="text-right">
              <div className="text-xs text-gray-500">
                定価 {product.retail_price.toLocaleString()}円
              </div>
              <div
                className={`text-sm font-bold ${
                  product.price_rate >= 70
                    ? "text-red-500"
                    : product.price_rate >= 50
                      ? "text-orange-500"
                      : "text-gray-600"
                }`}
              >
                還元率 {product.price_rate}%
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
