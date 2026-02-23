"use client";

import Link from "next/link";
import SearchBar from "./SearchBar";

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
        <Link href="/" className="text-xl font-bold text-blue-600 shrink-0">
          買取比較くん
        </Link>
        <SearchBar />
      </div>
    </header>
  );
}
