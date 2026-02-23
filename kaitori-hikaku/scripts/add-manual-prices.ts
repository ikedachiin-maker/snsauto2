import initSqlJs from "sql.js";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "kaitori.db");

// 主要商品の定価データベース（メーカー公式価格や一般的な実売価格）
const manualPrices: Record<string, number> = {
  // === ゲーム機 ===
  // PS5
  "4948872415934": 66980, // PS5 Slim CFI-2000A01 (ディスク)
  "4948872415910": 59980, // PS5 Slim CFI-2000B01 (デジタル)
  "4948872415941": 60478, // PS5 Digital Edition
  "4948872415620": 60478, // PS5 CFI-1200B01
  "4948872415613": 66980, // PS5 CFI-1200A01
  "4948872416320": 119980, // PS5 Pro

  // Nintendo Switch
  "4902370548495": 37980, // Nintendo Switch (有機EL) ホワイト
  "4902370548501": 37980, // Nintendo Switch (有機EL) ネオン
  "4902370542905": 32978, // Nintendo Switch
  "4902370535709": 21978, // Nintendo Switch Lite
  "4902370542936": 21978, // Switch Lite イエロー
  "4902370542929": 21978, // Switch Lite グレー
  "4902370542943": 21978, // Switch Lite ターコイズ
  "4902370545302": 21978, // Switch Lite コーラル
  "4902370547672": 21978, // Switch Lite ブルー

  // === 炊飯器 ===
  // Tiger
  "4904710437681": 86184, // TIGER JPI-X100-KX
  "4904710437698": 86184, // TIGER JPI-X100-WX

  // 象印
  "4974305224149": 56000, // ZOJIRUSHI NW-PV10-BZ
  "4974305224163": 56000, // ZOJIRUSHI NW-PV10-TZ
  "4974305224101": 43000, // ZOJIRUSHI NW-FB10-BZ
  "4974305224125": 43000, // ZOJIRUSHI NW-FB10-WZ
  "4974305224224": 65000, // ZOJIRUSHI NW-YA10-BA
  "4974305224248": 65000, // ZOJIRUSHI NW-YA10-WA

  // === 掃除機 ===
  // Dyson
  "5025155070857": 75900, // Dyson Cyclone V10 Fluffy

  // === コーヒーメーカー ===
  // DeLonghi
  "4988371024756": 78000, // ECAM22020B
  "4988371024763": 78000, // ECAM22020W

  // === 美容家電 ===
  // Panasonic
  "4549980433997": 50000, // EH-SA0B-N ナノケア

  // === その他 ===
  // BALMUDA
  "4560330119378": 14850, // The Lantern L02A-BK
  "4560330118234": 38500, // The Speaker M01A-BK
};

async function main() {
  if (!fs.existsSync(DB_PATH)) {
    console.error("Database not found.");
    process.exit(1);
  }

  const SQL = await initSqlJs();
  const buffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(buffer);

  let updated = 0;

  console.log("Adding manual retail prices...\n");

  for (const [janCode, price] of Object.entries(manualPrices)) {
    // Check if product exists
    const results = db.exec(
      "SELECT id, name FROM products WHERE jan_code = ?",
      [janCode]
    );

    if (results.length > 0 && results[0].values.length > 0) {
      const productId = results[0].values[0][0] as number;
      const productName = results[0].values[0][1] as string;

      // Update retail price
      db.run("UPDATE products SET retail_price = ? WHERE id = ?", [price, productId]);
      updated++;
      console.log(`✓ [${updated}] ${productName.substring(0, 60)}`);
      console.log(`   JAN: ${janCode}, Price: ¥${price.toLocaleString()}\n`);
    }
  }

  // Save database
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
  db.close();

  console.log(`Completed. Updated ${updated} products with manual retail prices.`);
  console.log("Run 'npm run export-json' to export the updated data.");
}

main().catch(console.error);
