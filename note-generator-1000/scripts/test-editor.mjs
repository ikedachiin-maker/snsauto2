#!/usr/bin/env node
/**
 * editor.note.com 認証デバッグスクリプト
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

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const email = process.env.NOTE_EMAIL;
  const password = process.env.NOTE_PASSWORD;
  console.log(`Email: ${email ? email.slice(0,3)+'***' : 'NOT SET'}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  // ── Step 1: ログイン（page.type で文字入力）──
  console.log('\n[1] ログイン中...');
  await page.goto('https://note.com/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(2000);

  await page.click('input#email');
  await page.type('input#email', email, { delay: 50 });
  await page.click('input#password');
  await page.type('input#password', password, { delay: 50 });
  await sleep(1000);

  const btnState = await page.$eval('button:has-text("ログイン")', el => ({
    disabled: el.disabled,
    text: el.textContent.trim()
  })).catch(() => null);
  console.log(`  ボタン状態: ${JSON.stringify(btnState)}`);

  try {
    await page.waitForSelector('button:has-text("ログイン"):not([disabled])', { timeout: 5000 });
    await page.click('button:has-text("ログイン")');
  } catch {
    console.log('  ボタンが有効化されず、強制クリック');
    await page.click('button:has-text("ログイン")');
  }

  await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await sleep(2000);

  const loginUrl = page.url();
  console.log(`  ログイン後URL: ${loginUrl}`);
  await page.screenshot({ path: '/tmp/test_login.png' });

  if (loginUrl.includes('/login')) {
    console.error('  ❌ ログイン失敗');
    await browser.close();
    return;
  }
  console.log('  ✅ ログイン成功');

  // ── Step 2: Cookie確認 ──
  const cookies = await context.cookies();
  const noteCookies = cookies.filter(c => c.domain.includes('note.com'));
  console.log(`\n[2] note.com Cookie (${noteCookies.length}件):`);
  noteCookies.forEach(c => console.log(`  [${c.domain}] ${c.name}`));

  // ── Step 3: CookieをサブドメインにコピーしてからEditorへ ──
  console.log('\n[3] Cookie を .note.com / editor.note.com にコピー...');
  const extraCookies = [];
  for (const c of noteCookies) {
    // .note.com ドメインへ（サブドメイン全体に効かせる）
    if (!c.domain.startsWith('.')) {
      extraCookies.push({ ...c, domain: '.note.com' });
    }
    // editor.note.com へも明示的に追加
    extraCookies.push({ ...c, domain: 'editor.note.com' });
  }
  await context.addCookies(extraCookies);
  console.log(`  ${extraCookies.length}件追加`);

  // ── Step 4: note.com/notes/new → networkidle ──
  console.log('\n[4] note.com/notes/new に移動 (networkidle, 60s)...');
  try {
    await page.goto('https://note.com/notes/new', { waitUntil: 'networkidle', timeout: 60000 });
  } catch (e) {
    console.log(`  タイムアウト (networkidle): ${e.message.slice(0,60)}`);
  }
  const editorUrl4 = page.url();
  console.log(`  URL: ${editorUrl4}`);
  await page.screenshot({ path: '/tmp/test_editor_v4.png' });

  // タイトル入力欄を探す
  try {
    await page.waitForSelector('textarea[placeholder="記事タイトル"]', { timeout: 20000 });
    console.log('  ✅ エディタ読み込み成功！');
    await browser.close();
    return;
  } catch {
    console.log('  ❌ タイトル欄なし');
  }

  // ── Step 5: 直接 editor.note.com/new ──
  console.log('\n[5] 直接 editor.note.com/new に移動...');
  try {
    await page.goto('https://editor.note.com/new', { waitUntil: 'networkidle', timeout: 60000 });
  } catch (e) {
    console.log(`  タイムアウト: ${e.message.slice(0,60)}`);
  }
  console.log(`  URL: ${page.url()}`);
  await page.screenshot({ path: '/tmp/test_editor_direct.png' });

  try {
    await page.waitForSelector('textarea[placeholder="記事タイトル"]', { timeout: 20000 });
    console.log('  ✅ 直接アクセス成功！');
  } catch {
    console.log('  ❌ 直接アクセスも失敗');

    // ページ内要素を確認
    const elems = await page.evaluate(() =>
      Array.from(document.querySelectorAll('input,textarea,[contenteditable],button'))
        .slice(0, 10)
        .map(el => `<${el.tagName} id="${el.id}" placeholder="${el.placeholder||''}" text="${el.textContent?.slice(0,20)||''}">`
    ));
    elems.forEach(e => console.log('  ', e));

    // コンソールエラーも確認
    const title = await page.title();
    console.log(`  page title: "${title}"`);
  }

  await browser.close();
  console.log('\nスクリーンショット: /tmp/test_*.png');
}

main().catch(err => { console.error('致命的エラー:', err.message); process.exit(1); });
