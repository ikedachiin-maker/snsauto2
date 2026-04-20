#!/usr/bin/env node
/**
 * 記事プレビューサーバー
 * ブラウザで生成済みnote記事を確認できる
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT, 'output');
const COVERS_DIR = path.join(ROOT, 'covers');
const IMAGES_DIR = path.join(ROOT, 'images');
const PORT = 3457;

const GENRE_LABELS = {
  fukugyou: '副業・稼ぎ方',
  mindset:  'マインドセット',
  renai:    '恋愛・モテ',
  business: 'ビジネススキル',
  health:   '健康・美容',
};

const GENRE_COLORS = {
  fukugyou: '#f59e0b',
  mindset:  '#6366f1',
  renai:    '#ec4899',
  business: '#0ea5e9',
  health:   '#10b981',
};

function simpleMarkdownToHtml(md) {
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^---ここから有料---$/gm, '<div class="paid-border">💰 ここから有料パート</div>')
    .replace(/^---$/gm, '<hr>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hul]|<hr|<div|<p)(.+)$/gm, '<p>$1</p>');
}

function getArticles() {
  if (!fs.existsSync(OUTPUT_DIR)) return [];
  return fs.readdirSync(OUTPUT_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const [id, genreRaw] = f.replace('.md', '').split('_');
      const genre = genreRaw || 'fukugyou';
      const content = fs.readFileSync(path.join(OUTPUT_DIR, f), 'utf-8');
      const title = content.split('\n')[0].replace(/^#\s*/, '');
      const metaLine = content.split('\n').find(l => l.includes('**価格:**')) || '';
      const price = metaLine.match(/¥(\d+)/)?.[1] || '0';
      const charCount = content.length;
      const hasCover = fs.existsSync(path.join(COVERS_DIR, f.replace('.md', '.png')));
      const isFormatted = content.includes('<!-- formatted -->');
      return { id: parseInt(id), genre, title, price, charCount, file: f, hasCover, isFormatted };
    })
    .sort((a, b) => a.id - b.id);
}

function renderList(articles, filter = '', page = 1) {
  const perPage = 50;
  const filtered = filter === 'formatted'
    ? articles.filter(a => a.isFormatted)
    : filter
    ? articles.filter(a => a.genre === filter || a.title.includes(filter))
    : articles;
  const total = filtered.length;
  const totalPages = Math.ceil(total / perPage);
  const items = filtered.slice((page - 1) * perPage, page * perPage);

  const genreCounts = {};
  articles.forEach(a => { genreCounts[a.genre] = (genreCounts[a.genre] || 0) + 1; });

  const formattedCount = articles.filter(a => a.isFormatted).length;
  const filterButtons = [
    `<a href="/?genre=formatted" style="text-decoration:none;padding:4px 10px;border-radius:20px;margin:2px;font-size:13px;background:#10b981;color:white">✅ 整形済み（${formattedCount}）</a>`,
    ...Object.entries(GENRE_LABELS).map(([k, v]) =>
      `<a href="/?genre=${k}" class="badge" style="background:${GENRE_COLORS[k]};color:white;text-decoration:none;padding:4px 10px;border-radius:20px;margin:2px;font-size:13px">${v}（${genreCounts[k] || 0}）</a>`
    )
  ].join('');

  const rows = items.map(a =>
    `<tr onclick="location.href='/article/${a.file}'" style="cursor:pointer">
      <td style="color:#888;width:50px">${a.id}</td>
      <td><span class="badge" style="background:${GENRE_COLORS[a.genre]};color:white;padding:2px 8px;border-radius:10px;font-size:11px">${GENRE_LABELS[a.genre]}</span></td>
      <td>${a.title}</td>
      <td style="color:#888;width:80px">¥${a.price}</td>
      <td style="color:#888;width:80px">${a.charCount.toLocaleString()}字</td>
      <td style="width:60px">${a.isFormatted ? '<span style="color:#10b981;font-size:12px">✅整形済</span>' : ''}</td>
      <td style="width:40px">${a.hasCover ? '🖼️' : ''}</td>
    </tr>`
  ).join('');

  const pagination = Array.from({ length: totalPages }, (_, i) =>
    `<a href="/?genre=${filter}&page=${i + 1}" style="margin:2px;padding:4px 10px;background:${i + 1 === page ? '#6366f1' : '#e5e7eb'};color:${i + 1 === page ? 'white' : '#333'};border-radius:6px;text-decoration:none">${i + 1}</a>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>note記事プレビュー</title>
<style>
  body{font-family:-apple-system,sans-serif;margin:0;background:#f9fafb}
  .header{background:#6366f1;color:white;padding:16px 24px;display:flex;align-items:center;gap:16px}
  .header h1{margin:0;font-size:20px}
  .header .stats{font-size:13px;opacity:0.8}
  .container{max-width:1100px;margin:24px auto;padding:0 16px}
  .filters{margin-bottom:16px}
  table{width:100%;border-collapse:collapse;background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)}
  th{background:#f3f4f6;padding:10px 12px;text-align:left;font-size:13px;color:#6b7280}
  td{padding:10px 12px;border-top:1px solid #f3f4f6;font-size:14px}
  tr:hover td{background:#f0f9ff}
  .pagination{margin-top:16px;text-align:center}
</style>
</head>
<body>
<div class="header">
  <h1>📝 note記事プレビュー</h1>
  <div class="stats">生成済み ${articles.length}本 / 1000本</div>
</div>
<div class="container">
  <div class="filters">
    <a href="/" style="text-decoration:none;padding:4px 10px;border-radius:20px;margin:2px;font-size:13px;background:#e5e7eb;color:#333">すべて（${articles.length}）</a>
    ${filterButtons}
  </div>
  <table>
    <thead><tr><th>#</th><th>ジャンル</th><th>タイトル</th><th>価格</th><th>文字数</th><th>状態</th><th></th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="pagination">${pagination}</div>
</div>
</body>
</html>`;
}

function renderArticle(file) {
  const filePath = path.join(OUTPUT_DIR, file);
  if (!fs.existsSync(filePath)) return null;

  const content = fs.readFileSync(filePath, 'utf-8');
  const [id, genreRaw] = file.replace('.md', '').split('_');
  const genre = genreRaw || 'fukugyou';
  const title = content.split('\n')[0].replace(/^#\s*/, '');
  const hasCover = fs.existsSync(path.join(COVERS_DIR, file.replace('.md', '.png')));

  const bodyImageFile = file.replace('.md', '_body.png');
  const hasBodyImage = fs.existsSync(path.join(IMAGES_DIR, bodyImageFile));
  const bodyImgTag = hasBodyImage
    ? `<img src="/body-image/${bodyImageFile}" class="body-image" alt="ボディ画像">`
    : hasCover
    ? `<img src="/cover/${file.replace('.md', '.png')}" class="body-image" alt="アイキャッチ画像">`
    : '';
  const bodyMd = content.split('\n').slice(3).join('\n')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\[BODY_IMAGE\]/g, bodyImgTag);
  const body = simpleMarkdownToHtml(bodyMd);

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
  body{font-family:-apple-system,sans-serif;margin:0;background:#f9fafb;color:#1a1a1a}
  .header{background:#6366f1;color:white;padding:12px 24px}
  .header a{color:white;text-decoration:none;font-size:14px}
  .container{max-width:760px;margin:32px auto;padding:0 16px}
  .cover{width:100%;border-radius:12px;margin-bottom:24px;object-fit:cover;max-height:400px}
  .genre-badge{display:inline-block;background:${GENRE_COLORS[genre]};color:white;padding:3px 12px;border-radius:20px;font-size:12px;margin-bottom:12px}
  h1{font-size:28px;line-height:1.4;margin:0 0 16px}
  .meta{color:#888;font-size:13px;margin-bottom:32px;padding-bottom:16px;border-bottom:1px solid #e5e7eb}
  .body{line-height:1.9;font-size:16px}
  .body h2{font-size:20px;margin-top:40px;padding-left:12px;border-left:4px solid ${GENRE_COLORS[genre]}}
  .body h3{font-size:17px;margin-top:28px}
  .body ul{padding-left:24px}
  .body li{margin:6px 0}
  .paid-border{background:#fff7ed;border:2px dashed #f59e0b;padding:16px;border-radius:8px;text-align:center;font-weight:bold;color:#d97706;margin:32px 0;font-size:18px}
  hr{border:none;border-top:1px solid #e5e7eb;margin:24px 0}
  .body-image{width:100%;border-radius:12px;margin:24px 0;object-fit:cover;max-height:360px;display:block}
</style>
</head>
<body>
<div class="header"><a href="/">← 一覧に戻る</a></div>
<div class="container">
  ${hasCover ? `<img src="/cover/${file.replace('.md', '.png')}" class="cover" alt="cover">` : ''}
  <span class="genre-badge">${GENRE_LABELS[genre]}</span>
  <h1>${title}</h1>
  <div class="body">${body}</div>
</div>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  if (pathname.startsWith('/cover/')) {
    const filename = pathname.replace('/cover/', '');
    const coverPath = path.join(COVERS_DIR, filename);
    if (fs.existsSync(coverPath)) {
      res.writeHead(200, { 'Content-Type': 'image/png' });
      fs.createReadStream(coverPath).pipe(res);
    } else {
      res.writeHead(404); res.end();
    }
    return;
  }

  if (pathname.startsWith('/body-image/')) {
    const filename = pathname.replace('/body-image/', '');
    const imgPath = path.join(IMAGES_DIR, filename);
    if (fs.existsSync(imgPath)) {
      res.writeHead(200, { 'Content-Type': 'image/png' });
      fs.createReadStream(imgPath).pipe(res);
    } else {
      res.writeHead(404); res.end();
    }
    return;
  }

  if (pathname.startsWith('/article/')) {
    const file = pathname.replace('/article/', '');
    const html = renderArticle(file);
    if (html) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } else {
      res.writeHead(404); res.end('Not found');
    }
    return;
  }

  // 一覧ページ
  const genre = url.searchParams.get('genre') || '';
  const page = parseInt(url.searchParams.get('page') || '1');
  const articles = getArticles();
  const html = renderList(articles, genre, page);
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
});

server.listen(PORT, () => {
  console.log(`\n✅ プレビューサーバー起動中`);
  console.log(`👉 ブラウザで開く: http://localhost:${PORT}`);
  console.log(`\nCtrl+C で停止\n`);
});
