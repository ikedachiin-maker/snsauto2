"use client";

import Link from "next/link";
import SearchBar from "./SearchBar";

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="shrink-0">
            <div className="flex items-center gap-2">
              <div className="text-3xl">💰</div>
              <div>
                <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  買取比較くん
                </div>
                <div className="text-xs text-gray-500 -mt-1">
                  最高値で売るなら
                </div>
              </div>
            </div>
          </Link>
          <SearchBar />
        </div>
      </div>
    </header>
  );
}
