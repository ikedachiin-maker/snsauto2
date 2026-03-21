#!/usr/bin/env node
/**
 * Merge retail_prices_found.json into products.json
 */

const fs = require('fs');
const path = require('path');

const PRODUCTS_JSON = path.join(__dirname, '..', 'data', 'json', 'products.json');
const RETAIL_PRICES_JSON = path.join(__dirname, '..', 'data', 'json', 'retail_prices_found.json');
const BACKUP_JSON = path.join(__dirname, '..', 'data', 'json', 'products.backup.json');

console.log('========================================');
console.log('  定価データのマージ');
console.log('========================================\n');

// Load products
if (!fs.existsSync(PRODUCTS_JSON)) {
  console.error('❌ products.json が見つかりません');
  process.exit(1);
}

const products = JSON.parse(fs.readFileSync(PRODUCTS_JSON, 'utf-8'));
console.log(`📦 商品数: ${products.length}`);

// Load retail prices
if (!fs.existsSync(RETAIL_PRICES_JSON)) {
  console.error('❌ retail_prices_found.json が見つかりません');
  console.error('   先に fetch-retail-prices-bulk.py を実行してください');
  process.exit(1);
}

const retailPrices = JSON.parse(fs.readFileSync(RETAIL_PRICES_JSON, 'utf-8'));
console.log(`💰 取得した定価: ${Object.keys(retailPrices).length}件\n`);

// Backup
fs.writeFileSync(BACKUP_JSON, JSON.stringify(products, null, 2), 'utf-8');
console.log(`💾 バックアップ作成: products.backup.json\n`);

// Merge
let updated = 0;
let skipped = 0;

for (const product of products) {
  const janCode = product.jan_code;
  if (!janCode || !retailPrices[janCode]) {
    continue;
  }

  const priceData = retailPrices[janCode];

  // Update retail price
  product.retail_price = priceData.retail_price;

  // Recalculate diff and return_rate
  if (product.buyback_price && product.retail_price) {
    product.diff = product.retail_price - product.buyback_price;
    product.return_rate = Math.round((product.buyback_price / product.retail_price) * 1000) / 10;
  }

  updated++;

  console.log(`✓ [${updated}] ${product.name.substring(0, 50)}`);
  console.log(`   定価: ¥${product.retail_price.toLocaleString()} (ソース: ${priceData.source})`);
  console.log(`   差額: ¥${product.diff.toLocaleString()}, 還元率: ${product.return_rate}%\n`);
}

// Save
fs.writeFileSync(PRODUCTS_JSON, JSON.stringify(products, null, 2), 'utf-8');

console.log('========================================');
console.log(`✅ マージ完了`);
console.log(`   更新: ${updated}商品`);
console.log(`   定価あり: ${products.filter(p => p.retail_price).length}/${products.length}商品`);
console.log(`   定価なし: ${products.filter(p => !p.retail_price).length}商品`);
console.log('========================================\n');

console.log('次のステップ:');
console.log('  npm run dev');
console.log('  → http://localhost:3000 で確認\n');
