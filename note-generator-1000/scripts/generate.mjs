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

const CLAUDE_MD = fs.readFileSync(path.join(ROOT, 'CLAUDE.md'), 'utf-8');

function loadTemplate(genre) {
  const tplPath = path.join(ROOT, 'templates', `${genre}.md`);
  if (!fs.existsSync(tplPath)) throw new Error(`テンプレートが見つかりません: ${tplPath}`);
  return fs.readFileSync(tplPath, 'utf-8');
}

function outputExists(id, genre) {
  return fs.existsSync(path.join(ROOT, 'output', `${id}_${genre}.md`));
}

// note-marketingスキルのガイドライン
const NOTE_MARKETING = `
## マーケティング戦略（note-marketingスキル）

### ファネル設計
- 無料パート：価値提供 → 読者の信頼を獲得 → 有料パートへ自然に誘導
- 有料パート：具体的なノウハウ・手順・テンプレートを提供

### 記事タイプ別アプローチ
- 副業・ビジネス系：自動化マーケティング・収益化の具体手順
- マインドセット系：ファネル基礎・コンテンツSEO
- 恋愛・健康系：リードマグネット設計（LINE誘導含む）

### 必須要素
- 具体的な数値・事例を必ず含める（「月収38万」「3ヶ月で○件」など）
- CTAを明確に：無料パート末尾で有料パートの価値を端的に伝える
- LINE誘導：有料記事の最後にLINE登録や次のアクションを促す
- 読者が「今すぐ行動できる」具体的なステップを入れる
`;

async function generateNote(note, template, retryCount = 0) {
  const systemPrompt = `あなたはnoteで月100万以上稼ぐプロのライターです。
以下のルールに従って記事を書いてください：
${CLAUDE_MD}
${NOTE_MARKETING}`;

  const userPrompt = `【ジャンル】${note.genre}
【タイトル】${note.title}
【切り口】${note.angle}
【感情トリガー】${note.emotion}
【目標文字数】${note.target_length}字
【テンプレート】
${template}

上記に従って、noteの本文を生成してください。

【構成ルール（note-marketingスキル準拠）】
記事は以下の構成で生成してください：

# タイトル（30文字以内）

**ジャンル:** ${note.genre} | **価格:** ¥${note.price}

<!-- formatted -->

{リード文：読者の悩みに刺さる導入 3〜5行}

## {見出し1}

{本文1 300〜500文字}

## {見出し2}

{本文2 300〜500文字}

[BODY_IMAGE]

## {見出し3}

{本文3 300〜500文字}

## まとめ

{まとめ：行動を促す締め 3〜5行}

---ここから有料---

{有料パートの詳細ノウハウ・手順・テンプレート}

---
タグ: #タグ1 #タグ2 #タグ3 #タグ4 #タグ5

【追加ルール】
1. タイトルは30文字以内に収めること
2. <!-- formatted --> タグは必ず含めること
3. [BODY_IMAGE] は見出し2の直後に必ず入れること
4. 無料パート：読者の悩みに共感 → 問題の本質を解説 → 解決策の概要を提示 → 有料パートへのCTAで締める
5. 有料パート：具体的な手順・数値・事例・テンプレートを惜しみなく提供
6. 末尾CTA：次のアクション（LINE登録・他記事誘導など）を自然に促す`;


  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    return response.content[0].text;
  } catch (err) {
    if (err.status === 529 && retryCount < 3) {
      const wait = (retryCount + 1) * 30000;
      console.log(`  API混雑。${wait / 1000}秒後にリトライ（${retryCount + 1}/3）...`);
      await new Promise(r => setTimeout(r, wait));
      return generateNote(note, template, retryCount + 1);
    }
    throw err;
  }
}

async function main() {
  const titlesPath = path.join(ROOT, 'data', 'titles.json');
  if (!fs.existsSync(titlesPath)) {
    console.error('data/titles.json が見つかりません。先に npm run gen-titles を実行してください。');
    process.exit(1);
  }

  const { notes } = JSON.parse(fs.readFileSync(titlesPath, 'utf-8'));
  const outputDir = path.join(ROOT, 'output');
  fs.mkdirSync(outputDir, { recursive: true });

  const pending = notes.filter(n => !outputExists(n.id, n.genre));
  const total = notes.length;
  const done = total - pending.length;

  console.log(`状況: ${done}/${total}本完了 / 残り${pending.length}本`);

  if (pending.length === 0) {
    console.log('すべて生成済みです！');
    return;
  }

  console.log(`生成を開始します...\n`);

  let successCount = 0;
  let errorCount = 0;
  let consecutiveErrors = 0;

  for (const note of pending) {
    if (consecutiveErrors >= 5) {
      console.error('\n連続エラーが5回に達しました。処理を停止します。');
      break;
    }

    const progress = done + successCount + errorCount + 1;
    process.stdout.write(`[${progress}/${total}] ${note.title.slice(0, 30)}... `);

    try {
      const template = loadTemplate(note.genre);
      const content = await generateNote(note, template);

      const outputPath = path.join(outputDir, `${note.id}_${note.genre}.md`);
      // Claude が新構成（# タイトル〜タグまで）を完全に出力するのでそのまま保存
      fs.writeFileSync(outputPath, content, 'utf-8');
      const charCount = content.length;
      console.log(`完了 ${charCount.toLocaleString()}字`);

      successCount++;
      consecutiveErrors = 0;

      // レート制限対策：1リクエストごとに1秒待つ
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.log(`エラー: ${err.message}`);
      errorCount++;
      consecutiveErrors++;
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  // サマリー表示
  const genreSummary = {};
  for (const note of notes) {
    if (!genreSummary[note.genre]) genreSummary[note.genre] = { total: 0, done: 0 };
    genreSummary[note.genre].total++;
    if (outputExists(note.id, note.genre)) genreSummary[note.genre].done++;
  }

  console.log('\n完了サマリー:');
  for (const [genre, stat] of Object.entries(genreSummary)) {
    console.log(`  ${genre}: ${stat.done}/${stat.total}本`);
  }

  const avgLength = (() => {
    const files = fs.readdirSync(outputDir);
    if (!files.length) return 0;
    const total = files.reduce((sum, f) => {
      const content = fs.readFileSync(path.join(outputDir, f), 'utf-8');
      return sum + content.length;
    }, 0);
    return Math.round(total / files.length);
  })();

  console.log(`\n生成完了: 成功${successCount}本 / エラー${errorCount}本`);
  console.log(`平均文字数: ${avgLength.toLocaleString()}字`);
}

main().catch(console.error);
