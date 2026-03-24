const d = require('../data/json/products.json');

const types = { local: 0, external: 0, none: 0 };
const externalSamples = [];
const localSamples = [];

for (const p of d) {
  if (!p.image_url) {
    types.none++;
  } else if (p.image_url.startsWith('http')) {
    types.external++;
    if (externalSamples.length < 3) externalSamples.push(p.image_url);
  } else {
    types.local++;
    if (localSamples.length < 3) localSamples.push(p.image_url);
  }
}

console.log('=== 画像URL種類 ===');
console.log('外部URL (http):', types.external);
console.log('ローカルパス (/):', types.local);
console.log('画像なし:', types.none);
console.log('');
console.log('外部URLサンプル:', externalSamples);
console.log('ローカルパスサンプル:', localSamples);

// Check how the working images are served
const localPaths = d.filter(p => p.image_url && !p.image_url.startsWith('http'));
const brokenLocal = localPaths.filter(p => p.image_url.startsWith('/upload/'));
console.log('');
console.log('/upload/で始まるローカルパス:', brokenLocal.length);
console.log('サンプル:', brokenLocal.slice(0, 5).map(p => p.image_url));
