#!/usr/bin/env node
/**
 * カバー画像生成スクリプト
 * nanobanana-pro スキル（Gemini）を使ってnote記事のカバー画像を生成する
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT, 'output');
const COVERS_DIR = path.join(ROOT, 'covers');
const NANOBANANA = '/Users/apple/.claude/skills/nanobanana-pro';

// ジャンル別プロンプトテンプレート
const GENRE_PROMPTS = {
  fukugyou: 'modern Japanese lifestyle illustration, person working on laptop at cafe, earning money concept, warm orange and green tones, flat design, professional note.com cover image, 1280x670px, no text',
  mindset: 'minimalist Japanese self-improvement concept, person standing on mountain top, sunrise, motivational atmosphere, soft blue and gold gradient, flat illustration style, note.com cover, 1280x670px, no text',
  renai:   'romantic Japanese couple illustration, soft pink and purple tones, cherry blossom background, warm cozy atmosphere, modern flat design, note.com cover image, 1280x670px, no text',
  business:'professional Japanese business concept, clean office setting, growth chart, modern corporate illustration, navy blue and white tones, flat design style, note.com cover, 1280x670px, no text',
  health:  'healthy lifestyle Japanese illustration, person exercising or eating healthy food, fresh green and blue tones, energetic atmosphere, flat modern design, note.com cover image, 1280x670px, no text',
};

function parseTitle(content) {
  return content.split('\n')[0].replace(/^#\s*/, '').trim();
}

function parseGenre(filename) {
  return filename.replace('.md', '').split('_')[1] || 'fukugyou';
}

function coverExists(filename) {
  const coverName = filename.replace('.md', '.png');
  return fs.existsSync(path.join(COVERS_DIR, coverName));
}

function buildPrompt(title, genre) {
  const base = GENRE_PROMPTS[genre] || GENRE_PROMPTS.fukugyou;
  // タイトルのキーワードをプロンプトに自然に組み込む
  const keywords = title.replace(/[【】「」『』。、！？]/g, ' ').trim().slice(0, 30);
  return `${base}, inspired by theme: ${keywords}`;
}

async function generateCover(filename, title, genre, retryCount = 0) {
  const coverName = filename.replace('.md', '.png');
  const outputPath = path.join(COVERS_DIR, coverName);
  const prompt = buildPrompt(title, genre);

  try {
    execSync(
      `python3 scripts/run.py image_generator.py --prompt "${prompt.replace(/"/g, "'")}" --output "${outputPath}"`,
      { cwd: NANOBANANA, stdio: 'pipe', timeout: 240000 }
    );
    return fs.existsSync(outputPath);
  } catch (err) {
    if (retryCount < 2) {
      // リトライ前に少し長めに待機
      await new Promise(r => setTimeout(r, 10000));
      return generateCover(filename, title, genre, retryCount + 1);
    }
    return false;
  }
}

async function main() {
  fs.mkdirSync(COVERS_DIR, { recursive: true });

  if (!fs.existsSync(OUTPUT_DIR)) {
    console.error('❌ output/ が見つかりません。先に npm run generate を実行してください。');
    process.exit(1);
  }

  const formattedOnly = process.argv.includes('--formatted-only');
  const allFiles = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.md'));
  const files = formattedOnly
    ? allFiles.filter(f => {
        const content = fs.readFileSync(path.join(OUTPUT_DIR, f), 'utf-8');
        return content.includes('<!-- formatted -->');
      })
    : allFiles;
  const pending = files.filter(f => !coverExists(f));

  console.log(`🖼️  カバー画像生成: ${pending.length}本 (生成済み: ${files.length - pending.length}本 / 対象: ${files.length}本)\n`);

  if (pending.length === 0) {
    console.log('✅ すべてのカバー画像が生成済みです。');
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

    process.stdout.write(`[${i + 1}/${targets.length}] ${title.slice(0, 35)}... `);

    const ok = await generateCover(file, title, genre);
    if (ok) {
      console.log('✅');
      successCount++;
    } else {
      console.log('❌ 失敗');
      errorCount++;
    }

    // Gemini への連続アクセスを避けるため待機（成功: 8秒 / 失敗: 15秒）
    if (i < targets.length - 1) {
      await new Promise(r => setTimeout(r, ok ? 8000 : 15000));
    }
  }

  console.log(`\n✨ 完了: 成功${successCount}枚 / エラー${errorCount}枚`);
  console.log(`📁 保存先: covers/`);
}

main().catch(console.error);
