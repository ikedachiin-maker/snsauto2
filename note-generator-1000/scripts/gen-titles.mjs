#!/usr/bin/env node
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Load env
const envPath = path.join(ROOT, '.env');
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf-8');
  env.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length) process.env[key.trim()] = vals.join('=').trim();
  });
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const GENRES = [
  { id: 'fukugyou', name: '副業・稼ぎ方系', count: 300 },
  { id: 'mindset', name: 'マインドセット系', count: 200 },
  { id: 'renai', name: '恋愛・モテ系', count: 200 },
  { id: 'business', name: 'ビジネススキル系', count: 150 },
  { id: 'health', name: '健康・美容系', count: 150 },
];

async function generateTitlesForGenre(genre, startId, existingTitles) {
  const prompt = `以下のジャンルについて、noteで売れる記事タイトルを${genre.count}本生成してください。
ジャンル: ${genre.name}

【タイトル設計ルール】
各タイトルは以下の3要素を掛け合わせて作る:
1. ジャンルKW（テンプレートの刺さるKWから）
2. 切り口（方法論/失敗談/比較/ランキング/体験談/最新トレンド）
3. 感情トリガー（焦り/好奇心/怒り/希望/共感）

【タイトルの型】
- 「○○人が知らない○○の真実」
- 「【体験談】○○してみたら、人生変わった話」
- 「○○万の人がやっている○○...全員損してます」
- 「年収○万の人がやってること○選」
- 「○○を始めたら○○になった件」

重複するタイトルは絶対に作らないでください。

【既存タイトル（重複禁止）】
${existingTitles.slice(-50).map(t => t.title).join('\n')}

以下のJSON形式で返してください（他のテキストは不要）:
[
  {
    "title": "タイトル",
    "angle": "方法論",
    "emotion": "好奇心",
    "target_length": 5000,
    "price": 980
  }
]

angleは: 方法論, 失敗談, 比較, ランキング, 体験談, 最新トレンド のいずれか
emotionは: 好奇心, 焦り, 希望, 怒り, 共感 のいずれか
priceは: 480, 980, 1980 のいずれか
target_lengthは: 3000〜8000の整数`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].text;
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('JSON not found in response');

  const items = JSON.parse(jsonMatch[0]);
  return items.map((item, i) => ({
    id: startId + i,
    title: item.title,
    genre: genre.id,
    angle: item.angle,
    emotion: item.emotion,
    target_length: item.target_length,
    price: item.price,
  }));
}

async function main() {
  console.log('1000本のタイトルを生成します...\n');

  const outputPath = path.join(ROOT, 'data', 'titles.json');
  let existing = { notes: [] };
  if (fs.existsSync(outputPath)) {
    existing = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
    console.log(`既存タイトル: ${existing.notes.length}本\n`);
  }

  let allNotes = [...existing.notes];
  let currentId = allNotes.length + 1;

  for (const genre of GENRES) {
    const existingForGenre = allNotes.filter(n => n.genre === genre.id);
    const needed = genre.count - existingForGenre.length;

    if (needed <= 0) {
      console.log(`${genre.name}: ${existingForGenre.length}本（完了）`);
      continue;
    }

    console.log(`${genre.name}: ${needed}本を生成中...`);

    try {
      const BATCH = 50;
      let generated = 0;

      while (generated < needed) {
        const batchSize = Math.min(BATCH, needed - generated);
        const tempGenre = { ...genre, count: batchSize };

        const notes = await generateTitlesForGenre(tempGenre, currentId, allNotes);
        allNotes.push(...notes);
        currentId += notes.length;
        generated += notes.length;

        fs.writeFileSync(outputPath, JSON.stringify({ notes: allNotes }, null, 2), 'utf-8');
        console.log(`  -> ${generated}/${needed}本完了`);

        await new Promise(r => setTimeout(r, 2000));
      }

      console.log(`${genre.name}: 完了\n`);
    } catch (err) {
      console.error(`${genre.name}でエラー: ${err.message}`);
    }
  }

  console.log(`\n完了: 合計${allNotes.length}本のタイトルを data/titles.json に保存しました`);
}

main().catch(console.error);
