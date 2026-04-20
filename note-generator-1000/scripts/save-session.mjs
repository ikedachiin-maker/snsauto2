#!/usr/bin/env node
/**
 * セッション保存スクリプト（手動ログイン版）
 *
 * 使い方:
 *   npm run save-session
 *
 * 動作:
 *   1. ブラウザウィンドウが開きます（note.com のログインページ）
 *   2. 手動でメールアドレスとパスワードを入力してログイン
 *   3. ログイン完了後、このターミナルでEnterを押す
 *   4. セッションが保存され、24時間ログイン不要になります
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SESSION_PATH = path.join(ROOT, 'data', 'session.json');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function ask(question) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, ans => { rl.close(); resolve(ans); });
  });
}

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════╗');
  console.log('║  note.com セッション保存スクリプト   ║');
  console.log('╚══════════════════════════════════════╝');
  console.log('');
  console.log('ブラウザが開きます。');
  console.log('note.com にログインしてからこのターミナルでEnterを押してください。');
  console.log('');

  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox'],
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  await page.goto('https://note.com/login', {
    waitUntil: 'domcontentloaded',
    timeout: 90000,
  });

  console.log('ブラウザを開きました: https://note.com/login');
  console.log('手動でログインしてください...');
  console.log('');

  await ask('ログイン完了後、Enterを押してください: ');

  const currentUrl = page.url();
  console.log(`\n現在のURL: ${currentUrl}`);

  if (currentUrl.includes('/login')) {
    console.log('\n⚠️  まだログインページにいます。');
    await ask('ログインを完了してから再度Enterを押してください: ');
  }

  const finalUrl = page.url();
  if (finalUrl.includes('/login')) {
    console.log('❌ ログインが確認できませんでした。');
    await browser.close();
    process.exit(1);
  }

  // Cookieをすべてのnoteドメインにコピー
  const cookies = await context.cookies();
  const noteCookies = cookies.filter(c => c.domain.includes('note.com'));
  const extra = [];
  for (const c of noteCookies) {
    if (!c.domain.startsWith('.')) extra.push({ ...c, domain: '.note.com' });
    extra.push({ ...c, domain: 'editor.note.com' });
  }
  if (extra.length) await context.addCookies(extra);

  // セッション保存
  const storageState = await context.storageState();
  fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
  fs.writeFileSync(SESSION_PATH, JSON.stringify(storageState, null, 2), 'utf-8');

  console.log(`\n✅ セッションを保存しました: ${SESSION_PATH}`);
  console.log('有効期間: 約20時間');
  console.log('\nスケジューラを起動できます:');
  console.log('  npm run schedule\n');

  await browser.close();
}

main().catch(err => {
  console.error('エラー:', err.message);
  process.exit(1);
});
