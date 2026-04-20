#!/usr/bin/env node
// 残り3本を補完するスクリプト
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const outputPath = path.join(ROOT, 'data', 'titles.json');
const data = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
let allNotes = [...data.notes];
let currentId = allNotes.length + 1;

const additions = [
  { title: '副業で月収20万を突破した僕の全戦略を大公開', genre: 'fukugyou', angle: '方法論', emotion: '好奇心', target_length: 5000, price: 980 },
  { title: '毎日ポジティブでいられる人の7つの思考パターン', genre: 'mindset', angle: '方法論', emotion: '希望', target_length: 4000, price: 480 },
  '自分の人生の主人公になるためのマインドセット改革',
];

for (let i = 0; i < additions.length; i++) {
  const item = additions[i];
  if (typeof item === 'string') {
    allNotes.push({ id: currentId++, title: item, genre: 'mindset', angle: '体験談', emotion: '共感', target_length: 4000, price: 480 });
  } else {
    allNotes.push({ id: currentId++, ...item });
  }
}

fs.writeFileSync(outputPath, JSON.stringify({ notes: allNotes }, null, 2), 'utf-8');

const summary = {};
for (const n of allNotes) {
  summary[n.genre] = (summary[n.genre] || 0) + 1;
}
console.log(`titles.json 更新完了。合計: ${allNotes.length}本`);
for (const [genre, count] of Object.entries(summary)) {
  console.log(`  ${genre}: ${count}本`);
}
