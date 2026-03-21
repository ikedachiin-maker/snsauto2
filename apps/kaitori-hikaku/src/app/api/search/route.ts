import { NextRequest, NextResponse } from "next/server";
import { searchProducts } from "@/lib/db";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || "";

  if (q.length < 2) {
    return NextResponse.json({ products: [] });
  }

  try {
    const products = await searchProducts(q, 10);
    return NextResponse.json({ products });
  } catch {
    return NextResponse.json({ products: [], error: "DB error" }, { status: 500 });
  }
}
