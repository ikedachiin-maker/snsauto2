#!/usr/bin/env node
/**
 * Fill missing retail prices using category-based estimation.
 * Calculates estimated retail_price, diff, and return_rate for all products
 * that don't have a retail_price yet.
 */

const fs = require('fs');
const path = require('path');

const PRODUCTS_JSON = path.join(__dirname, '..', 'data', 'json', 'products.json');
const BACKUP_JSON = path.join(__dirname, '..', 'data', 'json', 'products.backup-fill.json');

// Category-based buyback ratios (buyback_price / retail_price)
const RATIOS = {
  "PS5": 0.65,
  "Nintendo Switch": 0.60,
  "Xbox": 0.55,
  "PC": 0.45,
  "PC周辺機器": 0.40,
  "オーディオ": 0.45,
  "レコーダー/テレビ": 0.50,
  "美容家電": 0.50,
  "調理家電": 0.50,
  "掃除機": 0.45,
  "時計": 0.50,
  "シェーバー": 0.50,
  "季節・空調家電": 0.45,
  "ゴルフ": 0.50,
  "アウトドア": 0.45,
  "電動歯ブラシ": 0.50,
  "住宅設備": 0.45,
  "生活家電": 0.45,
  "情報家電": 0.45,
  "プロジェクター": 0.50,
  "スポーツ用品": 0.45,
  "その他家電": 0.45,
  "その他": 0.45,
};

console.log('========================================');
console.log('  定価なし商品への推定定価付与');
console.log('========================================\n');

// Load products
const products = JSON.parse(fs.readFileSync(PRODUCTS_JSON, 'utf-8'));
console.log(`📦 総商品数: ${products.length}`);

const missing = products.filter(p => !p.retail_price);
console.log(`❓ 定価なし: ${missing.length}商品\n`);

if (missing.length === 0) {
  console.log('✅ 全商品に定価があります。処理不要です。');
  process.exit(0);
}

// Backup
fs.writeFileSync(BACKUP_JSON, JSON.stringify(products, null, 2), 'utf-8');
console.log(`💾 バックアップ: products.backup-fill.json\n`);

// Fill missing prices
let filled = 0;
const catStats = {};

for (const product of products) {
  if (product.retail_price) continue;

  const bp = product.buyback_price || product.price || 0;
  if (bp <= 0) continue;

  const category = product.category || 'その他';
  const ratio = RATIOS[category] || 0.45;

  // Estimate retail price and round to nearest 100
  const estimated = Math.round(bp / ratio / 100) * 100;

  product.retail_price = estimated;
  product.retail_price_source = 'estimated';
  product.diff = estimated - bp;
  product.return_rate = Math.round((bp / estimated) * 1000) / 10;

  filled++;
  catStats[category] = (catStats[category] || 0) + 1;
}

// Save
fs.writeFileSync(PRODUCTS_JSON, JSON.stringify(products, null, 2), 'utf-8');

// Summary
const stillMissing = products.filter(p => !p.retail_price).length;
const totalWithPrice = products.filter(p => !!p.retail_price).length;

console.log('--- カテゴリ別推定数 ---');
Object.entries(catStats)
  .sort((a, b) => b[1] - a[1])
  .forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}件`);
  });

console.log('\n========================================');
console.log(`✅ 推定完了`);
console.log(`   追加: ${filled}商品`);
console.log(`   定価あり: ${totalWithPrice}/${products.length}商品`);
console.log(`   定価なし: ${stillMissing}商品`);
console.log('========================================\n');
