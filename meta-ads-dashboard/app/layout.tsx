import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meta広告自動化ダッシュボード",
  description: "AI駆動のMeta（Facebook/Instagram）広告自動化ツール",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
