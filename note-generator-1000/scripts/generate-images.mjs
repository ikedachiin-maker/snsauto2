#!/usr/bin/env node
/**
 * note記事に2枚の画像を生成するスクリプト
 * - アイキャッチ画像: {id}_{genre}_eyecatch.png
 * - 本文挿入画像:     {id}_{genre}_body.png
 * - nanobanana-pro（Gemini）を使用
 * - レジューム対応：両ファイルが存在する場合はスキップ
 * - --limit=N オプション対応
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT, 'output');
const IMAGES_DIR = path.join(ROOT, 'images');
const NANOBANANA = '/Users/apple/.claude/skills/nanobanana-pro';

// ジャンル別ベースプロンプト
const GENRE_THEMES = {
  fukugyou: 'Japanese person working from home, laptop, coffee, modern interior, warm lighting',
  mindset:  'Japanese person meditating on mountain top, sunrise, peaceful atmosphere, minimalist',
  renai:    'romantic Japanese couple, cherry blossoms, soft pink tones, warm and cozy',
  business: 'professional Japanese business meeting, modern office, growth charts, navy blue',
  health:   'healthy Japanese person exercising or cooking healthy food, fresh green tones',
};

function parseTitle(content) {
  return content.split('\n')[0].replace(/^#\s*/, '').trim();
}

function parseGenre(filename) {
  return filename.replace('.md', '').split('_')[1] || 'fukugyou';
}

function parseId(filename) {
  return filename.replace('.md', '').split('_')[0];
}

function imagesExist(id, genre) {
  const eyecatch = path.join(IMAGES_DIR, `${id}_${genre}_eyecatch.png`);
  const body = path.join(IMAGES_DIR, `${id}_${genre}_body.png`);
  return fs.existsSync(eyecatch) && fs.existsSync(body);
}

function buildImagePrompts(title, genre) {
  const base = GENRE_THEMES[genre] || GENRE_THEMES.fukugyou;
  const keywords = title.replace(/[【】「」。、！？]/g, ' ').trim().slice(0, 20);

  return {
    eyecatch: `${base}, eye-catching thumbnail for blog article, inspired by: ${keywords}, professional photography style, 1280x670px, no text, no watermark`,
    body: `${base}, supporting illustration for article section, soft colors, clean design, inspired by: ${keywords}, 800x500px, no text, no watermark`,
  };
}

async function generateImage(prompt, outputPath, retryCount = 0) {
  try {
    execSync(
      `python3 scripts/run.py image_generator.py --prompt "${prompt.replace(/"/g, "'")}" --output "${outputPath}"`,
      { cwd: NANOBANANA, stdio: 'pipe', timeout: 240000 }
    );
    return fs.existsSync(outputPath);
  } catch (err) {
    if (retryCount < 2) {
      await new Promise(r => setTimeout(r, 15000));
      return generateImage(prompt, outputPath, retryCount + 1);
    }
    return false;
  }
}

async function generateImages(id, genre, title) {
  const prompts = buildImagePrompts(title, genre);
  const eyecatchPath = path.join(IMAGES_DIR, `${id}_${genre}_eyecatch.png`);
  const bodyPath = path.join(IMAGES_DIR, `${id}_${genre}_body.png`);

  const eyecatchOk = await generateImage(prompts.eyecatch, eyecatchPath);
  if (!eyecatchOk) return { eyecatch: false, body: false };

  // アイキャッチ成功後8秒待機（Gemini連続アクセス対策）
  await new Promise(r => setTimeout(r, 8000));

  const bodyOk = await generateImage(prompts.body, bodyPath);
  return { eyecatch: eyecatchOk, body: bodyOk };
}

async function main() {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });

  if (!fs.existsSync(OUTPUT_DIR)) {
    console.error('output/ が見つかりません。先に npm run generate を実行してください。');
    process.exit(1);
  }

  const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.md'));

  const pending = files.filter(f => {
    const id = parseId(f);
    const genre = parseGenre(f);
    return !imagesExist(id, genre);
  });

  console.log(`画像生成: ${pending.length}本 (生成済み: ${files.length - pending.length}本)\n`);

  if (pending.length === 0) {
    console.log('すべての画像が生成済みです。');
    return;
  }

  // --limit オプション対応
  const limitArg = process.argv.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : pending.length;
  const targets = pending.slice(0, limit);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < targets.length; i++) {
    const file = targets[i];
    const content = fs.readFileSync(path.join(OUTPUT_DIR, file), 'utf-8');
    const title = parseTitle(content);
    const genre = parseGenre(file);
    const id = parseId(file);

    process.stdout.write(`[${i + 1}/${targets.length}] ${title.slice(0, 30)}... `);

    const result = await generateImages(id, genre, title);

    if (result.eyecatch && result.body) {
      console.log('✅');
      successCount++;
    } else if (result.eyecatch && !result.body) {
      console.log('⚠️  アイキャッチのみ成功');
      errorCount++;
    } else {
      console.log('❌ 失敗');
      errorCount++;
    }

    // 次のファイルへ移る前に待機（成功: 8秒 / 失敗: 15秒）
    if (i < targets.length - 1) {
      const ok = result.eyecatch && result.body;
      await new Promise(r => setTimeout(r, ok ? 8000 : 15000));
    }
  }

  console.log(`\n完了: 成功${successCount}本 / エラー${errorCount}本`);
  console.log(`保存先: images/`);
}

main().catch(console.error);
