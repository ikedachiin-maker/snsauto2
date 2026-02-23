import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "買取比較くん - ゲーム・家電の買取価格を一括比較",
  description:
    "ゲーム機・家電の買取価格を複数の買取店から一括比較。定価との差額・還元率が一目でわかる。最も高く売れるお店がすぐ見つかります。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-gradient-to-br from-gray-50 to-blue-50/30 text-gray-900 min-h-screen">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
        <footer className="border-t border-gray-200 mt-16 py-8 bg-white/50 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center text-sm text-gray-600 space-y-2">
              <p className="font-semibold text-gray-800">
                買取比較くん - あなたの商品を最高値で売るお手伝い
              </p>
              <p>
                掲載されている買取価格は参考価格です。実際の買取価格は商品の状態により異なる場合があります。
              </p>
              <p className="text-xs text-gray-500">
                ※ 買取価格は各買取店のWebサイトから自動取得しています
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
