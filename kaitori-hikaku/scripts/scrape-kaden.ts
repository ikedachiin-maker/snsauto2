import * as cheerio from "cheerio";
import initSqlJs from "sql.js";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "kaitori.db");
const BASE_URL = "https://kadenkaitori.tokyo";
const SHOP_NAME = "家電買取wiki";
const DELAY_MS = 2000;

interface ScrapedProduct {
  name: string;
  brand: string;
  jan_code: string;
  price: number;
  image_url: string;
  source_url: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function slugify(name: string, jan: string): string {
  const base = name
    .replace(/[^\w\s\u3000-\u9FFF-]/g, "")
    .replace(/[\s\u3000]+/g, "-")
    .toLowerCase()
    .slice(0, 80);
  return jan ? `${base}-${jan}` : `kaden-${base}`;
}

function categorize(name: string): string {
  const lower = name.toLowerCase();
  // 掃除機
  if (lower.includes("掃除機") || lower.includes("クリーナー") || lower.includes("roomba") || lower.includes("ルンバ") || lower.includes("cyclone") || lower.includes("dyson") || lower.includes("ダイソン")) return "掃除機";
  // レコーダー・テレビ
  if (lower.includes("ブルーレイ") || lower.includes("dvd") || lower.includes("レコーダー") || lower.includes("bdz") || lower.includes("dmr") || lower.includes("regza") || lower.includes("aquos") || lower.includes("diga")) return "レコーダー/テレビ";
  // ドライヤー・美容
  if (lower.includes("ドライヤー") || lower.includes("ヘアアイロン") || lower.includes("hair") || lower.includes("リュミエリーナ") || lower.includes("repronizer") || lower.includes("kinujo") || lower.includes("ナノケア") || lower.includes("eh-") || lower.includes("美顔") || lower.includes("脱毛") || lower.includes("ke-non") || lower.includes("ケノン") || lower.includes("ya-man") || lower.includes("ヤーマン") || lower.includes("美容")) return "美容家電";
  // 調理家電
  if (lower.includes("炊飯") || lower.includes("rice") || lower.includes("圧力") || lower.includes("ih") || lower.includes("オーブン") || lower.includes("レンジ") || lower.includes("oven") || lower.includes("tiger") || lower.includes("タイガー") || lower.includes("zojirushi") || lower.includes("象印") || lower.includes("コーヒー") || lower.includes("coffee") || lower.includes("delonghi") || lower.includes("デロンギ") || lower.includes("ミキサー") || lower.includes("ブレンダー") || lower.includes("balmuda") || lower.includes("バルミューダ") || lower.includes("トースター") || lower.includes("ホットプレート")) return "調理家電";
  // オーディオ・スピーカー
  if (lower.includes("ヘッドホン") || lower.includes("イヤホン") || lower.includes("headphone") || lower.includes("earphone") || lower.includes("speaker") || lower.includes("スピーカー") || lower.includes("sony wf-") || lower.includes("sony wh-") || lower.includes("bose") || lower.includes("beats") || lower.includes("airpods") || lower.includes("audio") || lower.includes("オーディオ") || lower.includes("walkman") || lower.includes("ウォークマン") || lower.includes("sennheiser") || lower.includes("shure")) return "オーディオ";
  // 腕時計・スマートウォッチ
  if (lower.includes("watch") || lower.includes("ウォッチ") || lower.includes("時計") || lower.includes("seiko") || lower.includes("casio") || lower.includes("g-shock") || lower.includes("apple watch") || lower.includes("garmin") || lower.includes("suunto") || lower.includes("fitbit")) return "時計";
  // シェーバー
  if (lower.includes("シェーバー") || lower.includes("shaver") || lower.includes("braun") || lower.includes("ブラウン") || lower.includes("philips") || lower.includes("フィリップス") || lower.includes("ラムダッシュ")) return "シェーバー";
  // 空調・季節
  if (lower.includes("エアコン") || lower.includes("加湿") || lower.includes("除湿") || lower.includes("空気清浄") || lower.includes("ファンヒーター") || lower.includes("暖房") || lower.includes("扇風機") || lower.includes("サーキュレーター") || lower.includes("hot+cool") || lower.includes("pure")) return "季節・空調家電";
  // ゴルフ
  if (lower.includes("ゴルフ") || lower.includes("golf") || lower.includes("ドライバー") || lower.includes("アイアン") || lower.includes("パター") || lower.includes("距離計") || lower.includes("callaway") || lower.includes("titleist") || lower.includes("taylor")) return "ゴルフ";
  // アウトドア
  if (lower.includes("テント") || lower.includes("キャンプ") || lower.includes("ランタン") || lower.includes("焚き火") || lower.includes("snow peak") || lower.includes("スノーピーク") || lower.includes("coleman") || lower.includes("コールマン") || lower.includes("outdoor") || lower.includes("アウトドア")) return "アウトドア";
  // 電動歯ブラシ
  if (lower.includes("電動歯ブラシ") || lower.includes("oral-b") || lower.includes("ドルツ") || lower.includes("sonicare") || lower.includes("ソニッケアー")) return "電動歯ブラシ";
  // PC周辺
  if (lower.includes("gpu") || lower.includes("グラフィック") || lower.includes("ssd") || lower.includes("電源") || lower.includes("ルーター") || lower.includes("router") || lower.includes("マウス") || lower.includes("キーボード")) return "PC周辺機器";
  // 生活家電
  if (lower.includes("ミシン") || lower.includes("アイロン") || lower.includes("食洗") || lower.includes("乾燥機") || lower.includes("洗濯") || lower.includes("冷蔵庫") || lower.includes("電子辞書")) return "生活家電";
  // スポーツ用品
  if (lower.includes("テニス") || lower.includes("ラケット") || lower.includes("自転車") || lower.includes("スキー") || lower.includes("スポーツ") || lower.includes("プロテイン") || lower.includes("トレーニング") || lower.includes("ランニング") || lower.includes("フィットネス")) return "スポーツ用品";
  // カー用品
  if (lower.includes("カーナビ") || lower.includes("ドライブレコーダー") || lower.includes("ドラレコ") || lower.includes("レーダー探知") || lower.includes("car ") || lower.includes("チャイルドシート") || lower.includes("タイヤ")) return "カー用品";
  // 住宅設備
  if (lower.includes("給湯") || lower.includes("ガスコンロ") || lower.includes("ビルトイン") || lower.includes("食器洗い") || lower.includes("換気扇") || lower.includes("浄水") || lower.includes("ウォシュレット") || lower.includes("便座") || lower.includes("パロマ") || lower.includes("リンナイ") || lower.includes("ノーリツ")) return "住宅設備";
  // ホビー
  if (lower.includes("ラジコン") || lower.includes("ドローン") || lower.includes("プラモ") || lower.includes("フィギュア") || lower.includes("ミニカー") || lower.includes("トイ") || lower.includes("レゴ") || lower.includes("lego")) return "ホビー";
  // 情報家電（プリンター、FAX、電子辞書等）
  if (lower.includes("プリンター") || lower.includes("printer") || lower.includes("fax") || lower.includes("シュレッダー") || lower.includes("ラベル") || lower.includes("テプラ") || lower.includes("スキャナ")) return "情報家電";
  // プロジェクター
  if (lower.includes("プロジェクター") || lower.includes("projector")) return "プロジェクター";
  return "その他家電";
}

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "ja,en;q=0.9",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function parseProductsFromPage(html: string): ScrapedProduct[] {
  const $ = cheerio.load(html);
  const products: ScrapedProduct[] = [];

  $(".pro_list").each((_, el) => {
    const block = $(el);

    const img = block.find("img.img-responsive").first();
    const name = (img.attr("alt") || "").trim();
    const imageUrl = img.attr("src") || "";

    const purchaseLink = block.find('a[href*="/purchase/"]').first().attr("href") || "";
    const sourceUrl = purchaseLink.startsWith("http")
      ? purchaseLink
      : `${BASE_URL}${purchaseLink}`;

    let janCode = "";
    block.find(".sub-pro-name").each((_, li) => {
      const text = $(li).text();
      const janMatch = text.match(/JAN[：:]\s*(\d{13})/);
      if (janMatch) {
        janCode = janMatch[1];
      }
    });

    let price = 0;
    const priceEl = block.find(".sub-pro-jia");
    if (priceEl.length) {
      const priceText = priceEl.text();
      const priceMatch = priceText.match(/([\d,]+)\s*円/);
      if (priceMatch) {
        price = parseInt(priceMatch[1].replace(/,/g, ""), 10);
      }
    }

    let brand = "";
    const brandEl = block.find("li a").first();
    if (brandEl.length) {
      const brandText = brandEl.text().trim();
      if (brandText.length < 40 && !brandText.includes("買取") && !brandText.includes("免税") && !brandText.includes("JAN")) {
        brand = brandText;
      }
    }

    if (name && janCode && price > 0) {
      products.push({
        name,
        brand,
        jan_code: janCode,
        price,
        image_url: imageUrl,
        source_url: sourceUrl,
      });
    }
  });

  return products;
}

async function main() {
  if (!fs.existsSync(DB_PATH)) {
    console.error("Database not found. Run npm run db:init first.");
    process.exit(1);
  }

  const SQL = await initSqlJs();
  const buffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(buffer);
  db.run("PRAGMA foreign_keys = ON");

  let totalProducts = 0;
  let newCount = 0;
  let updatedCount = 0;
  let page = 1;
  const maxPages = 250; // 家電は商品数が多い（全223ページ）

  console.log("========================================");
  console.log("  kadenkaitori.tokyo 全カテゴリスクレイピング");
  console.log("========================================\n");

  while (page <= maxPages) {
    const url =
      page === 1
        ? `${BASE_URL}/all-goods`
        : `${BASE_URL}/all-goods/${page}/name/all`;

    console.log(`Fetching page ${page}: ${url}`);

    try {
      const html = await fetchPage(url);
      const products = parseProductsFromPage(html);

      if (products.length === 0) {
        console.log(`No products found on page ${page}. Stopping.`);
        break;
      }

      for (const p of products) {
        const category = categorize(p.name);
        const slug = slugify(p.name, p.jan_code);

        try {
          const existing = db.exec(
            "SELECT id FROM products WHERE jan_code = ?",
            [p.jan_code]
          );

          let productId: number;

          if (existing.length > 0 && existing[0].values.length > 0) {
            productId = existing[0].values[0][0] as number;
            updatedCount++;
          } else {
            db.run(
              `INSERT INTO products (name, brand, jan_code, image_url, category, slug)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [p.name, p.brand, p.jan_code, p.image_url, category, slug]
            );
            const idResult = db.exec(
              "SELECT id FROM products WHERE jan_code = ?",
              [p.jan_code]
            );
            productId = idResult[0].values[0][0] as number;
            newCount++;
            console.log(`    + 新規: ${p.name.substring(0, 55)} [${category}]`);
          }

          // Insert price record for this shop
          db.run(
            `INSERT INTO buyback_prices (product_id, shop_name, price, source_url)
             VALUES (?, ?, ?, ?)`,
            [productId, SHOP_NAME, p.price, p.source_url]
          );
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          if (!msg.includes("UNIQUE")) {
            console.error(`  Error: ${p.name}: ${msg}`);
          }
        }
      }

      totalProducts += products.length;
      console.log(`  ${products.length}商品 (計: ${totalProducts}, 新規: ${newCount}, 既存: ${updatedCount})`);

      // Save every 5 pages
      if (page % 5 === 0) {
        const data = db.export();
        fs.writeFileSync(DB_PATH, Buffer.from(data));
        console.log("  [DB saved]");
      }

      page++;
      if (page <= maxPages) {
        await sleep(DELAY_MS);
      }
    } catch (err) {
      console.error(`Error on page ${page}:`, err);
      break;
    }
  }

  // Final save
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
  db.close();

  console.log("\n========================================");
  console.log("  結果サマリー");
  console.log("========================================");
  console.log(`  総取得: ${totalProducts}商品`);
  console.log(`  新規追加: ${newCount}商品`);
  console.log(`  既存更新: ${updatedCount}商品`);
  console.log("========================================\n");
  console.log("次のステップ:");
  console.log("  npm run export-json");
}

main().catch(console.error);
