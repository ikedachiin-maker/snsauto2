#!/usr/bin/env node
/**
 * 公開ページの UI 確認テスト v3 - publishページのロードを待つ
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

async function doLogin(page) {
  await page.goto('https://note.com/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(2000);
  await page.click('input#email');
  await page.type('input#email', process.env.NOTE_EMAIL, { delay: 50 });
  await page.click('input#password');
  await page.type('input#password', process.env.NOTE_PASSWORD, { delay: 50 });
  await sleep(1000);
  await page.evaluate(() => null);
  try {
    await page.waitForSelector('button:has-text("ログイン"):not([disabled])', { timeout: 3000 });
  } catch {
    await page.evaluate(() => {
      document.querySelectorAll('button').forEach(b => {
        if (b.textContent.includes('ログイン')) { b.removeAttribute('disabled'); b.disabled = false; }
      });
    });
  }
  await page.click('button:has-text("ログイン")', { force: true });
  await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await sleep(2000);
  if (page.url().includes('/login')) throw new Error('ログイン失敗');
  const cookies = await page.context().cookies();
  const noteCookies = cookies.filter(c => c.domain.includes('note.com'));
  const extra = [];
  for (const c of noteCookies) {
    if (!c.domain.startsWith('.')) extra.push({ ...c, domain: '.note.com' });
    extra.push({ ...c, domain: 'editor.note.com' });
  }
  await page.context().addCookies(extra);
  console.log('✅ ログイン成功');
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'],
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  await doLogin(page);

  console.log('\nエディタへ移動...');
  await page.goto('https://note.com/notes/new', { waitUntil: 'networkidle', timeout: 60000 });
  await sleep(2000);

  await page.waitForSelector('textarea[placeholder="記事タイトル"]', { timeout: 30000 });
  await page.fill('textarea[placeholder="記事タイトル"]', 'テスト記事（公開ページ確認）');

  const bodySel = '.ProseMirror, [contenteditable="true"]:not([placeholder="記事タイトル"])';
  await page.click(bodySel);
  await page.evaluate((text) => {
    const el = document.querySelector('.ProseMirror, [contenteditable="true"]:not([placeholder="記事タイトル"])');
    if (el) { el.focus(); document.execCommand('insertText', false, text); }
  }, 'テスト本文テスト本文テスト本文。');
  await sleep(1000);

  // 「公開に進む」をJS経由でクリック
  console.log('\n「公開に進む」クリック...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === '公開に進む');
    if (btn) btn.click();
  });

  // URLが /publish/ に変わるまで待つ
  console.log('  /publish/ への遷移を待機中...');
  try {
    await page.waitForURL('**/publish/**', { timeout: 20000 });
  } catch {
    console.log('  URL遷移タイムアウト');
  }
  console.log(`URL: ${page.url()}`);
  await sleep(3000); // ページロード待機

  await page.screenshot({ path: '/tmp/test_pub3_publish.png' });

  // ボタン一覧
  const btns = await page.$$eval('button', bs =>
    bs.map(b => b.textContent?.trim()).filter(t => t)
  );
  console.log(`\nボタン一覧: ${btns.join(' | ')}`);

  // 入力欄一覧
  const inputs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('input,select,textarea')).map(el => ({
      tag: el.tagName, type: el.type || '', placeholder: el.placeholder || '',
      id: el.id || '', name: el.name || '', value: el.value?.slice(0, 30) || '',
    }))
  );
  console.log(`\n入力欄:`, JSON.stringify(inputs, null, 2));

  // 価格関連要素を探す（テキスト内容で）
  const allText = await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const texts = [];
    let node;
    while (node = walker.nextNode()) {
      const t = node.textContent.trim();
      if (t && t.length > 2) texts.push(t);
    }
    return texts.filter(t => t.includes('価格') || t.includes('¥') || t.includes('円') || t.includes('有料') || t.includes('投稿'));
  });
  console.log(`\n価格・投稿関連テキスト: ${allText.join(' / ')}`);

  await browser.close();
}

main().catch(err => { console.error('エラー:', err.message); process.exit(1); });
