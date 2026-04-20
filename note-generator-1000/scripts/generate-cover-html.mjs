#!/usr/bin/env node
/**
 * Playwrightを使ってHTMLからカバー画像・ボディ画像を生成するスクリプト
 * nanobanana-pro不要・APIコストゼロ
 *
 * --formatted-only : <!-- formatted --> タグある記事のみ対象
 * --limit=N        : N枚だけ生成
 * --body           : ボディ画像（images/）を生成（デフォルト: カバー画像 covers/）
 * --all            : カバー＋ボディ両方を生成
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT, 'output');
const COVERS_DIR = path.join(ROOT, 'covers');
const IMAGES_DIR = path.join(ROOT, 'images');

const GENRE_CONFIG = {
  fukugyou: {
    bg:       'linear-gradient(135deg,#f59e0b,#ef4444)',
    bodyBg:   '#fffbeb',
    accent:   '#f59e0b',
    icon:     '💰',
    label:    '副業・稼ぎ方',
    bodyIcon: '📈',
  },
  mindset: {
    bg:       'linear-gradient(135deg,#6366f1,#8b5cf6)',
    bodyBg:   '#f5f3ff',
    accent:   '#6366f1',
    icon:     '🧠',
    label:    'マインドセット',
    bodyIcon: '⚡',
  },
  renai: {
    bg:       'linear-gradient(135deg,#ec4899,#f43f5e)',
    bodyBg:   '#fdf2f8',
    accent:   '#ec4899',
    icon:     '💕',
    label:    '恋愛・モテ',
    bodyIcon: '✨',
  },
  business: {
    bg:       'linear-gradient(135deg,#0ea5e9,#2563eb)',
    bodyBg:   '#eff6ff',
    accent:   '#2563eb',
    icon:     '📊',
    label:    'ビジネス',
    bodyIcon: '🚀',
  },
  health: {
    bg:       'linear-gradient(135deg,#10b981,#059669)',
    bodyBg:   '#f0fdf4',
    accent:   '#10b981',
    icon:     '🌿',
    label:    '健康・美容',
    bodyIcon: '💪',
  },
};

// ヘッダーカバー画像 HTML
function buildCoverHtml(title, genre, price) {
  const cfg = GENRE_CONFIG[genre] || GENRE_CONFIG.fukugyou;
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1280px; height: 670px; overflow: hidden;
    font-family: "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif;
    background: ${cfg.bg};
    display: flex; align-items: center; justify-content: center;
  }
  .card {
    background: rgba(255,255,255,0.12);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.25);
    border-radius: 24px;
    padding: 60px 72px;
    max-width: 1100px; width: 100%;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  }
  .icon { font-size: 72px; margin-bottom: 20px; line-height: 1; }
  .label {
    display: inline-block;
    background: rgba(255,255,255,0.25); color: white;
    font-size: 18px; padding: 6px 20px; border-radius: 40px;
    margin-bottom: 28px; letter-spacing: 0.05em;
  }
  .title {
    color: white;
    font-size: ${title.length > 22 ? '40px' : '48px'};
    font-weight: 800; line-height: 1.5;
    text-shadow: 0 2px 12px rgba(0,0,0,0.2);
    margin-bottom: 28px; word-break: break-all;
  }
  .price { color: rgba(255,255,255,0.85); font-size: 22px; font-weight: 600; }
  .accent {
    display: inline-block; background: rgba(255,255,255,0.2);
    padding: 6px 24px; border-radius: 40px;
  }
</style>
</head>
<body>
<div class="card">
  <div class="icon">${cfg.icon}</div>
  <div class="label">${cfg.label}</div>
  <div class="title">${title}</div>
  <div class="price"><span class="accent">¥${price} 有料記事</span></div>
</div>
</body>
</html>`;
}

// ボディ画像 HTML（インフォカード風・白ベース）
function buildBodyHtml(title, genre, keyStats) {
  const cfg = GENRE_CONFIG[genre] || GENRE_CONFIG.fukugyou;
  const points = keyStats.slice(0, 3);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1280px; height: 480px; overflow: hidden;
    font-family: "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif;
    background: ${cfg.bodyBg};
    display: flex; align-items: center; justify-content: center;
    padding: 40px;
  }
  .wrapper {
    width: 100%;
    border: 3px solid ${cfg.accent};
    border-radius: 20px;
    overflow: hidden;
    display: flex;
    box-shadow: 0 8px 32px rgba(0,0,0,0.08);
  }
  .sidebar {
    background: ${cfg.accent};
    width: 180px; min-width: 180px;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 24px 16px; gap: 12px;
  }
  .sidebar-icon { font-size: 52px; line-height: 1; }
  .sidebar-label {
    color: white; font-size: 15px; font-weight: 700;
    text-align: center; line-height: 1.4;
  }
  .content {
    flex: 1; padding: 32px 40px;
    display: flex; flex-direction: column; gap: 16px;
  }
  .headline {
    font-size: ${title.length > 24 ? '24px' : '28px'};
    font-weight: 800; color: #1a1a1a; line-height: 1.4;
    border-bottom: 3px solid ${cfg.accent};
    padding-bottom: 14px; margin-bottom: 4px;
  }
  .points { display: flex; flex-direction: column; gap: 12px; }
  .point {
    display: flex; align-items: flex-start; gap: 12px;
    font-size: 20px; color: #333; line-height: 1.5;
  }
  .point-num {
    background: ${cfg.accent}; color: white;
    font-size: 16px; font-weight: 800;
    width: 32px; height: 32px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; margin-top: 2px;
  }
</style>
</head>
<body>
<div class="wrapper">
  <div class="sidebar">
    <div class="sidebar-icon">${cfg.bodyIcon}</div>
    <div class="sidebar-label">この記事の<br>ポイント</div>
  </div>
  <div class="content">
    <div class="headline">${title}</div>
    <div class="points">
      ${points.map((p, i) => `
      <div class="point">
        <span class="point-num">${i + 1}</span>
        <span>${p}</span>
      </div>`).join('')}
    </div>
  </div>
</div>
</body>
</html>`;
}

// 記事から見出し（##）を抽出してキーポイントにする
function extractKeyPoints(content) {
  const lines = content.split('\n');
  const headings = lines
    .filter(l => /^## /.test(l) && !l.includes('まとめ') && !l.includes('有料'))
    .map(l => l.replace(/^## /, '').trim())
    .filter(h => h.length > 0 && h.length < 30)
    .slice(0, 3);

  if (headings.length >= 2) return headings;

  // 見出しが足りない場合はデフォルト
  const title = content.split('\n')[0].replace(/^#\s*/, '').trim();
  const num = title.match(/月収[\d万円]+|月[\d万]+|[\d]+万/)?.[0] || '';
  return [
    `${num ? num + 'を実現する' : ''}具体的なステップを完全公開`,
    '失敗しないための実践チェックリスト',
    'すぐ使えるテンプレートと事例',
  ];
}

function parseArticle(content) {
  const title = content.split('\n')[0].replace(/^#\s*/, '').trim();
  const metaLine = content.split('\n').find(l => l.includes('**価格:**')) || '';
  const price = metaLine.match(/¥(\d+)/)?.[1] || '500';
  return { title, price };
}

function coverExists(file) {
  return fs.existsSync(path.join(COVERS_DIR, file.replace('.md', '.png')));
}

function bodyExists(file) {
  return fs.existsSync(path.join(IMAGES_DIR, file.replace('.md', '_body.png')));
}

async function main() {
  const isBody    = process.argv.includes('--body');
  const isAll     = process.argv.includes('--all');
  const formattedOnly = process.argv.includes('--formatted-only');
  const limitArg  = process.argv.find(a => a.startsWith('--limit='));
  const limit     = limitArg ? parseInt(limitArg.split('=')[1]) : Infinity;

  const doCovers = !isBody || isAll;
  const doBody   = isBody || isAll;

  fs.mkdirSync(COVERS_DIR, { recursive: true });
  if (doBody) fs.mkdirSync(IMAGES_DIR, { recursive: true });

  const allFiles = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.md'));
  const files = formattedOnly
    ? allFiles.filter(f => fs.readFileSync(path.join(OUTPUT_DIR, f), 'utf-8').includes('<!-- formatted -->'))
    : allFiles;

  const pendingCovers = doCovers ? files.filter(f => !coverExists(f)) : [];
  const pendingBody   = doBody   ? files.filter(f => !bodyExists(f))  : [];

  const pending = [...new Set([...pendingCovers, ...pendingBody])].slice(0, limit);

  if (pending.length === 0) {
    console.log('✅ すべての画像が生成済みです。');
    return;
  }

  console.log(`🖼️  生成対象: ${pending.length}本 [${doCovers ? 'カバー' : ''}${isAll ? '＋' : ''}${doBody ? 'ボディ' : ''}]\n`);

  const browser = await chromium.launch({ headless: true });
  const coverPage = doCovers ? await browser.newPage() : null;
  const bodyPage  = doBody   ? await browser.newPage() : null;

  if (coverPage) await coverPage.setViewportSize({ width: 1280, height: 670 });
  if (bodyPage)  await bodyPage.setViewportSize({ width: 1280, height: 480 });

  let success = 0, errors = 0;

  for (let i = 0; i < pending.length; i++) {
    const file = pending[i];
    const content = fs.readFileSync(path.join(OUTPUT_DIR, file), 'utf-8');
    const genre = file.replace('.md', '').split('_')[1] || 'fukugyou';
    const { title, price } = parseArticle(content);
    const keyPoints = extractKeyPoints(content);

    process.stdout.write(`[${i + 1}/${pending.length}] ${title.slice(0, 28)}... `);

    let ok = true;

    try {
      // カバー画像
      if (doCovers && !coverExists(file)) {
        const html = buildCoverHtml(title, genre, price);
        const out  = path.join(COVERS_DIR, file.replace('.md', '.png'));
        await coverPage.setContent(html, { waitUntil: 'networkidle' });
        await coverPage.screenshot({ path: out, type: 'png' });
      }

      // ボディ画像
      if (doBody && !bodyExists(file)) {
        const html = buildBodyHtml(title, genre, keyPoints);
        const out  = path.join(IMAGES_DIR, file.replace('.md', '_body.png'));
        await bodyPage.setContent(html, { waitUntil: 'networkidle' });
        await bodyPage.screenshot({ path: out, type: 'png' });
      }

      console.log('✅');
      success++;
    } catch (err) {
      console.log(`❌ ${err.message}`);
      errors++;
      ok = false;
    }
  }

  await browser.close();
  console.log(`\n✨ 完了: 成功${success}本 / エラー${errors}本`);
}

main().catch(console.error);
