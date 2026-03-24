#!/usr/bin/env node
/**
 * Fix: copy return_rate to price_rate for all products
 */
const fs = require('fs');
const path = require('path');

const PRODUCTS_JSON = path.join(__dirname, '..', 'data', 'json', 'products.json');
const products = JSON.parse(fs.readFileSync(PRODUCTS_JSON, 'utf-8'));

let fixed = 0;
for (const p of products) {
  // Calculate price_rate from retail_price and buyback_price
  if (p.retail_price && p.buyback_price) {
    const rate = Math.round((p.buyback_price / p.retail_price) * 1000) / 10;
    p.price_rate = rate;
    p.return_rate = rate;
    p.diff = p.retail_price - p.buyback_price;
    fixed++;
  }
}

fs.writeFileSync(PRODUCTS_JSON, JSON.stringify(products, null, 2), 'utf-8');

const hasRate = products.filter(p => p.price_rate > 0).length;
console.log(`✅ 修正完了: ${fixed}商品のprice_rateを設定`);
console.log(`   price_rateあり: ${hasRate}/${products.length}商品`);
