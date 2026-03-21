"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface SearchResult {
  id: number;
  name: string;
  slug: string;
  buyback_price: number | null;
  brand: string;
  price_rate: number | null;
  category: string;
}

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}`
        );
        const data = await res.json();
        setResults(data.products || []);
        setIsOpen(true);
      } catch {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative flex-1 max-w-2xl">
      <div className="relative">
        <input
          type="text"
          placeholder="商品名・型番で検索（例: PS5, iPhone, ダイソン）"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-5 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-96 overflow-y-auto z-50">
          {results.map((item) => (
            <Link
              key={item.id}
              href={`/product/${item.slug}`}
              onClick={() => {
                setIsOpen(false);
                setQuery("");
              }}
              className="block px-5 py-4 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-800 line-clamp-1 mb-1">
                    {item.name}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {item.brand && <span>{item.brand}</span>}
                    {item.category && (
                      <>
                        <span className="text-gray-300">•</span>
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          {item.category}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  {item.buyback_price && (
                    <div className="text-lg font-bold text-green-600">
                      ¥{item.buyback_price.toLocaleString()}
                    </div>
                  )}
                  {item.price_rate && (
                    <div
                      className={`text-xs font-bold ${
                        item.price_rate >= 70
                          ? "text-red-600"
                          : item.price_rate >= 50
                            ? "text-orange-600"
                            : "text-gray-600"
                      }`}
                    >
                      還元率 {item.price_rate}%
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      {isOpen && query.length >= 2 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl p-6 text-center text-sm text-gray-500 z-50">
          <div className="text-3xl mb-2">🔍</div>
          該当する商品が見つかりませんでした
        </div>
      )}
    </div>
  );
}
