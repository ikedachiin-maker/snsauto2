#!/usr/bin/env node
/**
 * Download missing product images from gamekaitori.jp
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const PRODUCTS_JSON = path.join(__dirname, '..', 'data', 'json', 'products.json');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const BASE_URL = 'https://gamekaitori.jp';
const DELAY_MS = 500;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(destPath);
    fs.mkdirSync(dir, { recursive: true });

    const client = url.startsWith('https') ? https : http;
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': BASE_URL + '/',
      },
      rejectUnauthorized: false,
    };

    client.get(url, options, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        const redirectUrl = res.headers.location;
        if (redirectUrl) {
          downloadFile(redirectUrl, destPath).then(resolve).catch(reject);
          return;
        }
      }

      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      const fileStream = fs.createWriteStream(destPath);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve(true);
      });
      fileStream.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  const products = JSON.parse(fs.readFileSync(PRODUCTS_JSON, 'utf-8'));

  // Find products with missing local images
  const missing = [];
  for (const p of products) {
    if (!p.image_url || !p.image_url.startsWith('/')) continue;
    const localPath = path.join(PUBLIC_DIR, p.image_url);
    if (!fs.existsSync(localPath)) {
      missing.push(p);
    }
  }

  // Deduplicate by image_url
  const uniqueUrls = new Map();
  for (const p of missing) {
    if (!uniqueUrls.has(p.image_url)) {
      uniqueUrls.set(p.image_url, p);
    }
  }

  console.log('========================================');
  console.log('  画像ダウンロード');
  console.log('========================================');
  console.log(`  欠落商品数: ${missing.length}`);
  console.log(`  ユニーク画像: ${uniqueUrls.size}`);
  console.log('');

  let downloaded = 0;
  let failed = 0;
  const failures = [];

  for (const [imgUrl, product] of uniqueUrls) {
    const fullUrl = BASE_URL + encodeURI(imgUrl).replace(/%20/g, '%20');
    const localPath = path.join(PUBLIC_DIR, imgUrl);

    process.stdout.write(`[${downloaded + failed + 1}/${uniqueUrls.size}] ${path.basename(imgUrl).substring(0, 40)}... `);

    try {
      await downloadFile(fullUrl, localPath);
      const stat = fs.statSync(localPath);
      if (stat.size < 100) {
        fs.unlinkSync(localPath);
        throw new Error('File too small (likely error page)');
      }
      console.log(`OK (${Math.round(stat.size / 1024)}KB)`);
      downloaded++;
    } catch (err) {
      console.log(`FAIL: ${err.message}`);
      failed++;
      failures.push({ url: imgUrl, name: product.name.substring(0, 40), error: err.message });
    }

    await sleep(DELAY_MS);
  }

  console.log('\n========================================');
  console.log(`✅ 完了: ${downloaded}件ダウンロード, ${failed}件失敗`);
  console.log('========================================');

  if (failures.length > 0) {
    console.log('\n--- 失敗一覧 ---');
    failures.forEach(f => console.log(`  ${f.name} | ${f.url} | ${f.error}`));
  }
}

main().catch(console.error);
