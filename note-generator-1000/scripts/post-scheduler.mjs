#!/usr/bin/env node
/**
 * スケジュール自動投稿スクリプト
 *
 * 投稿時刻（各時刻に1本ずつ）:
 *   朝  07:00  08:00  09:00          3本
 *   昼  12:00  13:00                 2本
 *   夜  19:00  20:00  21:00  22:00  23:00  5本
 *   計  1日10本
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// .env 読み込み
const envPath = path.join(ROOT, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length) process.env[key.trim()] = vals.join('=').trim();
  });
}

const CONFIG = {
  email:    process.env.NOTE_EMAIL || '',
  password: process.env.NOTE_PASSWORD || '',
};

// 投稿時刻（時のみ指定・各時刻ちょうどに1本）
const SCHEDULE_HOURS = [7, 8, 9, 12, 13, 19, 20, 21, 22, 23];

const STATE_PATH   = path.join(ROOT, 'data', 'post-state.json');
const SESSION_PATH = path.join(ROOT, 'data', 'session.json'); // ブラウザセッション保存
const OUTPUT_DIR   = path.join(ROOT, 'output');
const COVERS_DIR   = path.join(ROOT, 'covers');

// セッションが有効か確認（24時間以内）
function isSessionValid() {
  if (!fs.existsSync(SESSION_PATH)) return false;
  const stat = fs.statSync(SESSION_PATH);
  const ageHours = (Date.now() - stat.mtimeMs) / 3600000;
  return ageHours < 20; // 20時間以内なら有効
}

function saveSession(storageState) {
  fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
  fs.writeFileSync(SESSION_PATH, JSON.stringify(storageState), 'utf-8');
}

// ───── state ─────
function loadState() {
  if (!fs.existsSync(STATE_PATH)) return { posted: [], postedHours: {} };
  const s = JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8'));
  if (!s.postedHours) s.postedHours = {};
  return s;
}

function saveState(s) {
  fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
  fs.writeFileSync(STATE_PATH, JSON.stringify(s, null, 2), 'utf-8');
}

function todayKey() {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

function hourKey(date = new Date()) {
  return `${todayKey()}_${date.getHours()}`;
}

// ───── markdown parser ─────
function parseMarkdown(content, file = '') {
  const lines = content.split('\n');
  const title = lines[0].replace(/^#\s*/, '').trim();
  const metaLine = lines.find(l => l.includes('**価格:**'));
  const price = metaLine?.match(/¥(\d+)/) ? parseInt(metaLine.match(/¥(\d+)/)[1]) : 0;

  let body;
  const formattedIdx = content.indexOf('<!-- formatted -->');
  const hrIdx = content.indexOf('\n---\n');
  if (formattedIdx !== -1) {
    body = content.slice(content.indexOf('\n', formattedIdx) + 1);
  } else if (hrIdx !== -1) {
    body = content.slice(hrIdx + 5);
  } else {
    body = content.slice(content.indexOf('\n\n') + 2);
  }

  body = body.replace(/<!--[\s\S]*?-->/g, '');
  body = body.replace(/\[BODY_IMAGE\]/g, '');
  body = body.replace(/\n---\n[^\n]*タグ[：:][\s\S]*$/m, '').replace(/\nタグ[：:][\s\S]*$/m, '');
  body = body.replace(/\n{3,}/g, '\n\n').trim();

  const sepIdx = body.indexOf('---ここから有料---');
  let freePart, paidPart;
  if (sepIdx !== -1) {
    freePart = body.slice(0, sepIdx).trim();
    paidPart = body.slice(sepIdx + '---ここから有料---'.length).trim();
  } else {
    freePart = body.trim();
    paidPart = '';
  }

  const coverPath = path.join(COVERS_DIR, file.replace('.md', '.png'));
  return { title, price, freePart, paidPart, coverPath };
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ───── note.com 操作 ─────
async function login(page) {
  console.log('  ログイン中...');
  await page.goto('https://note.com/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(2000);

  await page.click('input#email');
  await page.type('input#email', CONFIG.email, { delay: 50 });
  await page.click('input#password');
  await page.type('input#password', CONFIG.password, { delay: 50 });
  await sleep(1000);

  // フォームバリデーションの完了を待つ（Vue.js の非同期評価のため）
  await page.evaluate(() => null); // 小さな遅延を追加
  try {
    await page.waitForSelector('button:has-text("ログイン"):not([disabled])', { timeout: 3000 });
  } catch {
    // 無効なままでも force: true でクリックして送信（サーバー側で認証）
    await page.evaluate(() => {
      document.querySelectorAll('button').forEach(b => {
        if (b.textContent.includes('ログイン')) { b.removeAttribute('disabled'); b.disabled = false; }
      });
    });
  }
  await page.click('button:has-text("ログイン")', { force: true });
  await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await sleep(2000);
  if (page.url().includes('/login')) throw new Error('ログイン失敗。認証情報を確認してください。');

  // セッションCookieをeditor.note.comサブドメインにも適用
  const cookies = await page.context().cookies();
  const noteCookies = cookies.filter(c => c.domain.includes('note.com'));
  const extraCookies = [];
  for (const c of noteCookies) {
    if (!c.domain.startsWith('.')) {
      extraCookies.push({ ...c, domain: '.note.com' });
    }
    extraCookies.push({ ...c, domain: 'editor.note.com' });
  }
  if (extraCookies.length) await page.context().addCookies(extraCookies);

  console.log('  ログイン成功');
}

async function postNote(page, noteData, retryCount = 0) {
  try {
    // networkidle で待つ（editor.note.com への OAuth リダイレクトが完了するまで）
    await page.goto('https://note.com/notes/new', { waitUntil: 'networkidle', timeout: 60000 });
    await sleep(2000);

    // カバー画像アップロード
    if (noteData.coverPath && fs.existsSync(noteData.coverPath)) {
      try {
        for (const sel of ['input[type="file"][accept*="image"]', 'input[type="file"]']) {
          const input = await page.$(sel);
          if (input) { await input.setInputFiles(noteData.coverPath); await sleep(2000); break; }
        }
      } catch { /* スキップ */ }
    }

    // タイトル
    const titleSel = 'textarea[placeholder="記事タイトル"]';
    await page.waitForSelector(titleSel, { timeout: 30000 });
    await page.click(titleSel);
    await page.fill(titleSel, noteData.title);

    // 本文
    const bodySel = '.ProseMirror, [contenteditable="true"]:not([placeholder="記事タイトル"])';
    await page.waitForSelector(bodySel, { timeout: 10000 });
    await page.click(bodySel);
    await sleep(500);

    const fullBody = noteData.paidPart
      ? noteData.freePart + '\n\n' + noteData.paidPart
      : noteData.freePart;

    await page.evaluate((text) => {
      const el = document.querySelector('.ProseMirror, [contenteditable="true"]:not([placeholder="記事タイトル"])');
      if (el) { el.focus(); document.execCommand('insertText', false, text); }
    }, fullBody);
    await sleep(1000);

    // 「公開に進む」をクリック（エディタ上のボタン）
    let publishClicked = false;
    for (const sel of ['button:has-text("公開に進む")', 'button:has-text("公開")']) {
      try {
        await page.click(sel, { timeout: 5000 });
        publishClicked = true;
        break;
      } catch {}
    }
    if (!publishClicked) {
      // フォールバック: JS経由でクリック
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button'))
          .find(b => b.textContent.includes('公開'));
        if (btn) btn.click();
      });
    }
    await sleep(2000); // /publish/ への遷移待ち

    // 投稿するボタンを待つ（公開ページのロード）
    await page.waitForSelector('button:has-text("投稿する")', { timeout: 20000 }).catch(() => {});

    // 価格設定（公開ページに価格入力欄があれば設定）
    if (noteData.price > 0 && noteData.paidPart) {
      const priceInput = await page.$('input[type="number"], input[placeholder*="価格"], input[placeholder*="金額"]');
      if (priceInput) {
        await priceInput.fill(String(noteData.price));
        await sleep(500);
      }
    }

    // 「投稿する」をクリック
    for (const sel of ['button:has-text("投稿する")', 'button:has-text("公開する")']) {
      try {
        await page.click(sel, { timeout: 5000 });
        break;
      } catch {}
    }
    await sleep(3000); // 投稿完了待ち

    return page.url();

  } catch (err) {
    if (retryCount < 2) {
      console.log(`  リトライ (${retryCount + 1}/2)...`);
      await sleep(5000);
      return postNote(page, noteData, retryCount + 1);
    }
    throw err;
  }
}

// ───── 投稿メイン ─────
function isFormatted(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.includes('<!-- formatted -->');
}

async function runPost() {
  const state = loadState();
  const postedFiles = new Set(state.posted.map(p => p.file));
  const allFiles = fs.readdirSync(OUTPUT_DIR)
    .filter(f => f.endsWith('.md'))
    .filter(f => isFormatted(path.join(OUTPUT_DIR, f)));
  const pending = allFiles.filter(f => !postedFiles.has(f));

  if (pending.length === 0) {
    console.log('\n✅ フォーマット済み46本の投稿が完了しました。');

    // 未フォーマット記事を自動削除
    const allFiles = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.md'));
    const unformatted = allFiles.filter(f => !isFormatted(path.join(OUTPUT_DIR, f)));
    if (unformatted.length > 0) {
      console.log(`  未フォーマット記事 ${unformatted.length}本を削除中...`);
      unformatted.forEach(f => fs.unlinkSync(path.join(OUTPUT_DIR, f)));
      console.log(`  ✅ ${unformatted.length}本を削除しました。次のバッチをお待ちください。`);
    }
    return;
  }

  const file = pending[0];
  const content = fs.readFileSync(path.join(OUTPUT_DIR, file), 'utf-8');
  const noteData = parseMarkdown(content, file);

  console.log(`  投稿: ${noteData.title.slice(0, 40)}`);
  console.log(`  価格: ¥${noteData.price} / 残り未投稿: ${pending.length}本（フォーマット済みのみ）`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'],
  });

  // セッションが有効ならロード（ログインをスキップ）
  const contextOptions = {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
  };
  if (isSessionValid()) {
    contextOptions.storageState = SESSION_PATH;
    console.log('  保存済みセッションを使用します');
  }

  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  try {
    // ログイン（セッションなし or 期限切れ）
    if (!isSessionValid()) {
      await login(page);
      const storageState = await context.storageState();
      saveSession(storageState);
      console.log('  セッションを保存しました');
    } else {
      // セッション有効時もCookieコピーが必要
      const cookies = await context.cookies();
      const noteCookies = cookies.filter(c => c.domain.includes('note.com'));
      const extra = [];
      for (const c of noteCookies) {
        if (!c.domain.startsWith('.')) extra.push({ ...c, domain: '.note.com' });
        extra.push({ ...c, domain: 'editor.note.com' });
      }
      if (extra.length) await context.addCookies(extra);
    }

    const noteUrl = await postNote(page, noteData);

    state.posted.push({
      id: parseInt(file.split('_')[0]),
      file,
      postedAt: new Date().toISOString(),
      noteUrl,
    });
    state.postedHours[hourKey()] = file;
    saveState(state);

    console.log(`  ✅ 投稿完了: ${noteUrl}`);
  } catch (err) {
    console.log(`  ❌ 投稿エラー: ${err.message}`);
  } finally {
    await browser.close();
  }
}

// ───── スケジューラーループ ─────
function formatTime(d = new Date()) {
  return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

async function main() {
  if (!CONFIG.email || !CONFIG.password) {
    console.error('.env に NOTE_EMAIL と NOTE_PASSWORD を設定してください。');
    process.exit(1);
  }

  console.log('スケジュール自動投稿 起動');
  console.log(`投稿時刻: ${SCHEDULE_HOURS.map(h => `${String(h).padStart(2,'0')}:00`).join('  ')}`);
  console.log('');

  while (true) {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const hk = hourKey(now);
    const state = loadState();

    // 投稿時刻の判定：該当時間帯（00〜04分）かつ今日まだ投稿していない
    if (SCHEDULE_HOURS.includes(h) && m <= 4 && !state.postedHours?.[hk]) {
      console.log(`\n[${formatTime()}] ⏰ ${String(h).padStart(2,'0')}:00 投稿スロット`);
      await runPost();
    } else {
      // 次の投稿時刻を計算
      const nextHour = SCHEDULE_HOURS.find(sh => sh > h) ?? SCHEDULE_HOURS[0];
      const isToday = nextHour > h;
      const waitMin = isToday
        ? (nextHour - h) * 60 - m
        : (24 - h + nextHour) * 60 - m;
      process.stdout.write(`\r[${formatTime()}] 次の投稿: ${String(nextHour).padStart(2,'0')}:00（あと約${waitMin}分）   `);
    }

    // 30秒ごとにチェック
    await sleep(30000);
  }
}

main().catch(err => {
  console.error('致命的エラー:', err.message);
  process.exit(1);
});
