const fs = require('fs');
const path = require('path');
const d = require('../data/json/products.json');

const publicDir = path.join(__dirname, '..', 'public');

let noImg = 0;
let brokenImg = 0;
let okImg = 0;
const brokenCats = {};
const brokenSamples = [];

for (const p of d) {
  if (!p.image_url || p.image_url === '') {
    noImg++;
    const c = p.category || 'unknown';
    brokenCats[c] = (brokenCats[c] || 0) + 1;
    if (brokenSamples.length < 5) brokenSamples.push(p);
    continue;
  }

  // Check if local file exists
  if (p.image_url.startsWith('/')) {
    const filePath = path.join(publicDir, p.image_url);
    if (!fs.existsSync(filePath)) {
      brokenImg++;
      const c = p.category || 'unknown';
      brokenCats[c] = (brokenCats[c] || 0) + 1;
      if (brokenSamples.length < 10) brokenSamples.push(p);
    } else {
      okImg++;
    }
  } else if (p.image_url.startsWith('http')) {
    okImg++; // external URLs - assume ok for now
  } else {
    brokenImg++;
  }
}

console.log('=== 画像状況 ===');
console.log('総商品:', d.length);
console.log('画像OK:', okImg);
console.log('画像なし:', noImg);
console.log('画像パス不正:', brokenImg);
console.log('');
console.log('--- 画像なし/不正 カテゴリ別 ---');
Object.entries(brokenCats).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => {
  console.log('  ' + k + ': ' + v + '件');
});
console.log('');
console.log('--- サンプル ---');
brokenSamples.forEach((p, i) => {
  console.log((i+1) + '. [' + p.category + '] ' + p.name.substring(0, 50));
  console.log('   img: ' + (p.image_url || 'なし'));
});

// Check Motorola specifically
const moto = d.filter(p => p.category === 'Motorola');
console.log('\n=== Motorola詳細 ===');
console.log('商品数:', moto.length);
moto.forEach((p, i) => {
  const imgPath = p.image_url ? path.join(publicDir, p.image_url) : '';
  const exists = imgPath ? fs.existsSync(imgPath) : false;
  console.log((i+1) + '. ' + p.name.substring(0, 50));
  console.log('   img: ' + (p.image_url || 'なし') + ' | exists: ' + exists);
});
