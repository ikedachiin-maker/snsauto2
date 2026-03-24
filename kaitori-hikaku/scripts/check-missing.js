const data = require('../data/json/products.json');
const noPrice = data.filter(p => p.retail_price == null || p.retail_price === 0);
const hasPrice = data.filter(p => p.retail_price > 0);

console.log('総商品数:', data.length);
console.log('定価あり:', hasPrice.length);
console.log('定価なし:', noPrice.length);
console.log('');
console.log('--- 定価なし商品サンプル (最初30件) ---');
noPrice.slice(0, 30).forEach((p, i) => {
  console.log((i+1) + '. ' + p.name + ' | 買取価格: ' + (p.buyback_price || p.price) + ' | JAN: ' + (p.jan_code || 'なし'));
});
console.log('');

// カテゴリ別集計
const cats = {};
noPrice.forEach(p => {
  const cat = p.category || 'unknown';
  cats[cat] = (cats[cat] || 0) + 1;
});
console.log('--- 定価なしカテゴリ別 ---');
Object.entries(cats).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => {
  console.log(k + ': ' + v + '件');
});
