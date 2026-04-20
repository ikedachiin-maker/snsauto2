#!/usr/bin/env node
/**
 * 既存のnote記事を7パーツ構成に再整形するスクリプト
 * - output/ の全.mdファイルを対象
 * - Claude API（claude-sonnet-4-20250514）を使って再整形
 * - 元ファイルを上書き保存
 * - レジューム対応：先頭に <!-- formatted --> がある場合はスキップ
 */
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

const OUTPUT_DIR = path.join(ROOT, 'output');

function isFormatted(content) {
  return content.includes('<!-- formatted -->');
}

function parseGenre(filename) {
  return filename.replace('.md', '').split('_')[1] || 'fukugyou';
}

function parsePrice(content) {
  const match = content.match(/\*\*価格:\*\*\s*¥(\d+)/);
  return match ? match[1] : '500';
}

async function reformatArticle(content, genre, price, retryCount = 0) {
  const userPrompt = `以下のnote記事を指定の構成に再整形してください。

【現在の記事】
${content}

【新しい構成】
1. タイトル（30文字以内）
2. リード文（読者の悩みに刺さる 3〜5行）
3. ## 見出し1（本文 300〜500文字）
4. ## 見出し2（本文 300〜500文字）
5. ## 見出し3（本文 300〜500文字）
6. まとめ（行動を促す締め 3〜5行）
7. タグ: #タグ1 #タグ2 #タグ3 #タグ4 #タグ5

出力形式（マークダウン）:
# {タイトル}

**ジャンル:** ${genre} | **価格:** ¥${price}

<!-- formatted -->

{リード文}

## {見出し1}

{本文1 300〜500文字}

## {見出し2}

{本文2 300〜500文字}

[BODY_IMAGE]

## {見出し3}

{本文3 300〜500文字}

## まとめ

{まとめ 3〜5行}

---ここから有料---

{有料パートの内容（元記事から流用）}

---
タグ: #タグ1 #タグ2 #タグ3 #タグ4 #タグ5

【注意】
- タイトルは30文字以内に収めること
- <!-- formatted --> タグは必ず含めること
- [BODY_IMAGE] は見出し2の直後に必ず入れること
- 有料パートは元記事の内容を活かすこと
- 出力はマークダウン形式のみ（余計な説明文は不要）`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      temperature: 0.7,
      system: 'あなたはnoteで月100万以上稼ぐプロのライターです。指定された構成に忠実に記事を再整形してください。',
      messages: [{ role: 'user', content: userPrompt }],
    });

    return response.content[0].text;
  } catch (err) {
    if (err.status === 529 && retryCount < 3) {
      const wait = (retryCount + 1) * 30000;
      console.log(`  API混雑。${wait / 1000}秒後にリトライ（${retryCount + 1}/3）...`);
      await new Promise(r => setTimeout(r, wait));
      return reformatArticle(content, genre, price, retryCount + 1);
    }
    throw err;
  }
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    console.error('output/ が見つかりません。先に npm run generate を実行してください。');
    process.exit(1);
  }

  const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.md'));

  if (files.length === 0) {
    console.log('output/ に.mdファイルがありません。');
    return;
  }

  const pending = files.filter(f => {
    const content = fs.readFileSync(path.join(OUTPUT_DIR, f), 'utf-8');
    return !isFormatted(content);
  });

  const done = files.length - pending.length;
  console.log(`状況: ${done}/${files.length}本完了 / 残り${pending.length}本\n`);

  if (pending.length === 0) {
    console.log('すべて再整形済みです。');
    return;
  }

  console.log('再整形を開始します...\n');

  let successCount = 0;
  let errorCount = 0;
  let consecutiveErrors = 0;

  for (let i = 0; i < pending.length; i++) {
    if (consecutiveErrors >= 5) {
      console.error('\n連続エラーが5回に達しました。処理を停止します。');
      break;
    }

    const file = pending[i];
    const filePath = path.join(OUTPUT_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const genre = parseGenre(file);
    const price = parsePrice(content);

    const titleLine = content.split('\n')[0].replace(/^#\s*/, '').trim();
    const progress = done + successCount + errorCount + 1;

    process.stdout.write(`[${progress}/${files.length}] ${titleLine.slice(0, 30)}... `);

    try {
      const reformatted = await reformatArticle(content, genre, price);

      fs.writeFileSync(filePath, reformatted, 'utf-8');
      console.log('✅');

      successCount++;
      consecutiveErrors = 0;

      // レート制限対策：1ファイルごとに1秒待機
      if (i < pending.length - 1) {
        await new Promise(r => setTimeout(r, 1000));
      }
    } catch (err) {
      console.log(`❌ エラー: ${err.message}`);
      errorCount++;
      consecutiveErrors++;
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  console.log(`\n再整形完了: 成功${successCount}本 / エラー${errorCount}本`);
}

main().catch(console.error);
