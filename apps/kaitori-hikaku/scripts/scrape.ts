import { scrapeAllProducts } from "../src/lib/scraper";

async function main() {
  console.log("=== 買取価格スクレイピング開始 ===");
  console.log(new Date().toLocaleString("ja-JP"));
  console.log("");

  try {
    await scrapeAllProducts();
  } catch (err) {
    console.error("Fatal error:", err);
    process.exit(1);
  }

  console.log("\n=== 完了 ===");
}

main();
