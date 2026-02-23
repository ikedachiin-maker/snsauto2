import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "買取比較くん - ゲーム機買取価格を比較",
  description:
    "ゲーム機・ゲームソフトの買取価格を一括比較。最も高く売れるお店がすぐわかる。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <Header />
        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
        <footer className="border-t border-gray-200 mt-12 py-6 text-center text-sm text-gray-500">
          <p>
            買取比較くん - 掲載価格は参考価格です。実際の買取価格とは異なる場合があります。
          </p>
        </footer>
      </body>
    </html>
  );
}
