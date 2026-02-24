#!/usr/bin/env node
/**
 * Clean bad retail prices from products.json and retail_prices_found.json
 * Removes entries where return_rate > 95% (buyback > retail = clearly wrong)
 */

const fs = require('fs');
const path = require('path');

const PRODUCTS_JSON = path.join(__dirname, '..', 'data', 'json', 'products.json');
const RETAIL_PRICES_JSON = path.join(__dirname, '..', 'data', 'json', 'retail_prices_found.json');
const BACKUP_JSON = path.join(__dirname, '..', 'data', 'json', 'products.pre-clean.backup.json');

console.log('========================================');
console.log('  エラー定価データのクリーンアップ');
console.log('========================================\n');

// Load products
const products = JSON.parse(fs.readFileSync(PRODUCTS_JSON, 'utf-8'));
console.log(`📦 商品数: ${products.length}`);

// Backup
fs.writeFileSync(BACKUP_JSON, JSON.stringify(products, null, 2), 'utf-8');
console.log(`💾 バックアップ: products.pre-clean.backup.json\n`);

// Find and clean bad prices
let cleaned = 0;
const badJans = new Set();

for (const product of products) {
  if (!product.retail_price || !product.buyback_price) continue;

  const returnRate = product.buyback_price / product.retail_price;

  // Return rate > 95% means buyback price is close to or exceeds retail = bad data
  // Return rate < 10% means retail is way too high = suspicious
  if (returnRate > 0.95 || returnRate < 0.10) {
    console.log(`❌ [${product.name.substring(0, 50)}]`);
    console.log(`   買取: ¥${product.buyback_price.toLocaleString()}, 定価: ¥${product.retail_price.toLocaleString()}, 還元率: ${(returnRate * 100).toFixed(1)}%`);

    badJans.add(product.jan_code);
    product.retail_price = null;
    product.diff = null;
    product.return_rate = null;
    cleaned++;
  }
}

// Save cleaned products
fs.writeFileSync(PRODUCTS_JSON, JSON.stringify(products, null, 2), 'utf-8');

// Clean retail_prices_found.json
let retailCleaned = 0;
if (fs.existsSync(RETAIL_PRICES_JSON)) {
  const retailPrices = JSON.parse(fs.readFileSync(RETAIL_PRICES_JSON, 'utf-8'));
  for (const jan of badJans) {
    if (retailPrices[jan]) {
      delete retailPrices[jan];
      retailCleaned++;
    }
  }
  fs.writeFileSync(RETAIL_PRICES_JSON, JSON.stringify(retailPrices, null, 2), 'utf-8');
}

// Summary
const withPrice = products.filter(p => p.retail_price).length;
const withoutPrice = products.filter(p => !p.retail_price).length;

console.log('\n========================================');
console.log(`✅ クリーンアップ完了`);
console.log(`   除去: ${cleaned}商品 (products.json)`);
console.log(`   除去: ${retailCleaned}件 (retail_prices_found.json)`);
console.log(`   定価あり: ${withPrice}/${products.length}商品`);
console.log(`   定価なし: ${withoutPrice}商品`);
console.log('========================================\n');
