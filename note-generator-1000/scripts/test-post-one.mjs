#!/usr/bin/env node
/**
 * 1記事投稿テスト（公開まで実行）
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const envPath = path.join(ROOT, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length) process.env[key.trim()] = vals.join('=').trim();
  });
}

const OUTPUT_DIR = path.join(ROOT, 'output');
const COVERS_DIR = path.join(ROOT, 'covers');
const STATE_PATH = path.join(ROOT, 'data', 'post-state.json');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

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

async function main() {
  const state = loadState();
  const postedFiles = new Set(state.posted.map(p => p.file));
  const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.md')).sort();
  const pending = files.filter(f => !postedFiles.has(f));

  if (pending.length === 0) {
    console.log('未投稿記事なし');
    return;
  }

  const file = pending[0];
  const content = fs.readFileSync(path.join(OUTPUT_DIR, file), 'utf-8');
  const noteData = parseMarkdown(content, file);

  console.log(`投稿: ${noteData.title}`);
  console.log(`価格: ¥${noteData.price}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'],
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  try {
    // ── ログイン ──
    const emailVal = process.env.NOTE_EMAIL;
    const passVal = process.env.NOTE_PASSWORD;
    console.log(`\nEmail: ${emailVal ? emailVal.slice(0,5)+'...' : 'UNDEFINED'}`);
    console.log(`Pass: ${passVal ? '***' : 'UNDEFINED'}`);

    console.log('\nログイン中...');
    await page.goto('https://note.com/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log('Goto complete. URL:', page.url());
    await page.screenshot({ path: '/tmp/test_post_login_loaded.png' });
    await sleep(3000); // ページ完全ロード待ち

    // 入力欄の存在確認
    const inputs = await page.evaluate(() =>
      Array.from(document.querySelectorAll('input')).map(el => ({id: el.id, type: el.type, name: el.name}))
    );
    console.log('Inputs found:', JSON.stringify(inputs));

    await page.click('input#email');
    await page.type('input#email', emailVal, { delay: 50 });
    await page.click('input#password');
    await page.type('input#password', passVal, { delay: 50 });
    await sleep(1000);

    // フォーム内容確認
    const formState = await page.evaluate(() => {
      const email = document.querySelector('input#email');
      const pass = document.querySelector('input#password');
      const btn = document.querySelector('button[data-type="primary"]');
      return {
        emailLen: email?.value?.length || 0,
        passLen: pass?.value?.length || 0,
        btnDisabled: btn?.disabled,
      };
    });
    console.log(`フォーム状態: ${JSON.stringify(formState)}`);

    await page.screenshot({ path: '/tmp/test_post_login.png' });

    // ボタンが disabled のまま → JS で強制 enable して送信
    try {
      await page.waitForSelector('button:has-text("ログイン"):not([disabled])', { timeout: 3000 });
    } catch {
      console.log('  ボタン無効 → JS で強制有効化');
      await page.evaluate(() => {
        document.querySelectorAll('button').forEach(b => {
          if (b.textContent.includes('ログイン')) {
            b.removeAttribute('disabled');
            b.disabled = false;
          }
        });
      });
    }
    await page.click('button:has-text("ログイン")', { force: true });
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await sleep(2000);

    await page.screenshot({ path: '/tmp/test_post_afterlogin.png' });
    console.log('After-login URL:', page.url());
    if (page.url().includes('/login')) throw new Error('ログイン失敗');

    // Cookie copy
    const cookies = await context.cookies();
    const noteCookies = cookies.filter(c => c.domain.includes('note.com'));
    const extra = [];
    for (const c of noteCookies) {
      if (!c.domain.startsWith('.')) extra.push({ ...c, domain: '.note.com' });
      extra.push({ ...c, domain: 'editor.note.com' });
    }
    await context.addCookies(extra);
    console.log('✅ ログイン成功');

    // ── エディタ ──
    console.log('\nエディタ移動中...');
    await page.goto('https://note.com/notes/new', { waitUntil: 'networkidle', timeout: 60000 });
    await sleep(2000);
    console.log(`URL: ${page.url()}`);

    // タイトル
    const titleSel = 'textarea[placeholder="記事タイトル"]';
    await page.waitForSelector(titleSel, { timeout: 30000 });
    await page.click(titleSel);
    await page.fill(titleSel, noteData.title);
    console.log('✅ タイトル入力');

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
    console.log('✅ 本文入力');

    await page.screenshot({ path: '/tmp/test_post_filled.png' });

    // ── 公開ボタン確認 ──
    const allBtns = await page.$$eval('button', bs =>
      bs.map(b => b.textContent?.trim()).filter(t => t && t.length > 0)
    );
    console.log(`\nボタン一覧: ${allBtns.join(', ')}`);

    // 価格設定
    if (noteData.price > 0 && noteData.paidPart) {
      for (const sel of ['button:has-text("販売設定")', 'button:has-text("有料")']) {
        try {
          await page.click(sel, { timeout: 3000 });
          console.log(`✅ 販売設定クリック: ${sel}`);
          break;
        } catch {}
      }
      await sleep(1000);
      const priceInput = await page.$('input[type="number"], input[placeholder*="価格"]');
      if (priceInput) {
        await priceInput.fill(String(noteData.price));
        console.log(`✅ 価格設定: ¥${noteData.price}`);
      }
      await sleep(500);
    }

    await page.screenshot({ path: '/tmp/test_post_price.png' });

    // 公開ボタンクリック
    let clicked = false;
    for (const sel of ['button:has-text("公開")', 'button:has-text("投稿")']) {
      try {
        await page.click(sel, { timeout: 3000 });
        console.log(`✅ 公開ボタンクリック: ${sel}`);
        clicked = true;
        break;
      } catch {}
    }
    if (!clicked) {
      console.log('❌ 公開ボタンが見つからない');
      await page.screenshot({ path: '/tmp/test_post_no_publish.png' });
      await browser.close();
      return;
    }
    await sleep(1500);

    await page.screenshot({ path: '/tmp/test_post_publish_dialog.png' });

    // 確認ダイアログ
    for (const sel of ['button:has-text("公開する")', 'button:has-text("投稿する")', 'button:has-text("確認")']) {
      try {
        await page.click(sel, { timeout: 3000 });
        console.log(`✅ 確認ダイアログクリック: ${sel}`);
        break;
      } catch {}
    }

    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    const noteUrl = page.url();
    console.log(`\n🎉 投稿完了: ${noteUrl}`);

    // State更新
    state.posted.push({
      id: parseInt(file.split('_')[0]),
      file,
      postedAt: new Date().toISOString(),
      noteUrl,
    });
    saveState(state);
    console.log('✅ State保存');

  } catch (err) {
    console.error(`\n❌ エラー: ${err.message}`);
    await page.screenshot({ path: '/tmp/test_post_error.png' });
  } finally {
    await browser.close();
  }
}

main().catch(err => { console.error('致命的エラー:', err.message); process.exit(1); });
