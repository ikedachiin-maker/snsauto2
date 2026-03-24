#!/usr/bin/env node
/**
 * Fix broken image URLs: convert local /upload/... paths to full iphonekaitori.tokyo URLs
 * Then verify each URL actually returns 200
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const PRODUCTS_JSON = path.join(__dirname, '..', 'data', 'json', 'products.json');
const BASE = 'https://iphonekaitori.tokyo';

function checkUrl(url) {
  return new Promise((resolve) => {
    const options = {
      method: 'HEAD',
      headers: { 'User-Agent': 'Mozilla/5.0' },
      rejectUnauthorized: false,
      timeout: 8000,
    };
    const req = https.request(url, options, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.end();
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const products = JSON.parse(fs.readFileSync(PRODUCTS_JSON, 'utf-8'));

  const broken = products.filter(p => p.image_url && !p.image_url.startsWith('http'));
  console.log('========================================');
  console.log('  画像URL修正');
  console.log('========================================');
  console.log(`  対象: ${broken.length}商品\n`);

  let fixed = 0;
  let stillBroken = 0;

  for (let i = 0; i < broken.length; i++) {
    const p = broken[i];
    const fullUrl = BASE + encodeURI(p.image_url);

    process.stdout.write(`[${i + 1}/${broken.length}] ${p.name.substring(0, 40)}... `);

    const ok = await checkUrl(fullUrl);
    if (ok) {
      p.image_url = BASE + p.image_url;
      fixed++;
      console.log('OK');
    } else {
      stillBroken++;
      console.log('STILL 404');
    }
    await sleep(200);
  }

  fs.writeFileSync(PRODUCTS_JSON, JSON.stringify(products, null, 2), 'utf-8');

  console.log('\n========================================');
  console.log(`✅ 修正完了`);
  console.log(`   URL修正: ${fixed}件`);
  console.log(`   404のまま: ${stillBroken}件`);
  console.log('========================================');
}

main().catch(console.error);
