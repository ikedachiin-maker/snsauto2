#!/usr/bin/env node
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
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

// コマンドライン引数パース（--email=xxx --password=xxx）
const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith('--') && a.includes('='))
    .map(a => { const [k, ...v] = a.slice(2).split('='); return [k, v.join('=')]; })
);

const CONFIG = {
  email: args.email || process.env.NOTE_EMAIL || '',
  password: args.password || process.env.NOTE_PASSWORD || '',
  limitPerDay: parseInt(args.limit || process.env.POST_LIMIT_PER_DAY || '10'),
  intervalMinutes: parseInt(args.interval || process.env.POST_INTERVAL_MINUTES || '24'),
  autoMode: process.argv.includes('--auto'),
  headless: process.argv.includes('--headless'),
};

const STATE_PATH = path.join(ROOT, 'data', 'post-state.json');
const OUTPUT_DIR = path.join(ROOT, 'output');
const COVERS_DIR = path.join(ROOT, 'covers');

function loadState() {
  if (!fs.existsSync(STATE_PATH)) {
    return { posted: [], todayCount: 0, lastPostDate: '' };
  }
  const state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8'));
  const today = new Date().toISOString().split('T')[0];
  if (state.lastPostDate !== today) {
    state.todayCount = 0;
    state.lastPostDate = today;
  }
  return state;
}

function saveState(state) {
  fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), 'utf-8');
}

function parseMarkdown(content, file = '') {
  const lines = content.split('\n');
  const title = lines[0].replace(/^#\s*/, '').trim();

  // 価格取得
  const metaLine = lines.find(l => l.includes('**価格:**'));
  const price = metaLine?.match(/¥(\d+)/) ? parseInt(metaLine.match(/¥(\d+)/)[1]) : 0;

  // 本文開始位置を特定
  // 新フォーマット: <!-- formatted --> の次行から
  // 旧フォーマット: \n---\n の後から
  let body;
  const formattedIdx = content.indexOf('<!-- formatted -->');
  const hrIdx = content.indexOf('\n---\n');
  if (formattedIdx !== -1) {
    body = content.slice(content.indexOf('\n', formattedIdx) + 1);
  } else if (hrIdx !== -1) {
    body = content.slice(hrIdx + 5);
  } else {
    // fallback: タイトル行の次の\n\n以降
    body = content.slice(content.indexOf('\n\n') + 2);
  }

  // HTMLコメントタグを除去（<!-- formatted --> <!-- cta-updated --> 等）
  body = body.replace(/<!--[\s\S]*?-->/g, '');

  // [BODY_IMAGE] プレースホルダーを除去
  body = body.replace(/\[BODY_IMAGE\]/g, '');

  // 末尾のタグ行（タグ: #xxx）を除去
  body = body.replace(/\n---\n[^\n]*タグ[：:][\s\S]*$/m, '').replace(/\nタグ[：:][\s\S]*$/m, '');

  // 空行の連続を整理
  body = body.replace(/\n{3,}/g, '\n\n').trim();

  // 無料パート / 有料パートに分割
  const sepIdx = body.indexOf('---ここから有料---');
  let freePart, paidPart;
  if (sepIdx !== -1) {
    freePart = body.slice(0, sepIdx).trim();
    paidPart = body.slice(sepIdx + '---ここから有料---'.length).trim();
  } else {
    freePart = body.trim();
    paidPart = '';
  }

  // カバー画像パス
  const coverPath = path.join(COVERS_DIR, file.replace('.md', '.png'));

  return { title, price, freePart, paidPart, coverPath };
}

function ask(question) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, answer => { rl.close(); resolve(answer); });
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function login(page) {
  console.log('ログイン中...');
  await page.goto('https://note.com/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(2000);

  await page.click('input#email');
  await page.type('input#email', CONFIG.email, { delay: 50 });
  await page.click('input#password');
  await page.type('input#password', CONFIG.password, { delay: 50 });
  await sleep(1000);

  await page.waitForSelector('button:has-text("ログイン"):not([disabled])', { timeout: 10000 });
  await page.click('button:has-text("ログイン")');

  await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await sleep(2000);

  if (page.url().includes('/login')) {
    throw new Error('ログイン失敗。メールアドレスとパスワードを確認してください。');
  }
  console.log('ログイン成功\n');
}

async function postNote(page, noteData, retryCount = 0) {
  try {
    await page.goto('https://note.com/notes/new', { waitUntil: 'networkidle' });
    await sleep(2000);

    // カバー画像アップロード（存在する場合）
    if (noteData.coverPath && fs.existsSync(noteData.coverPath)) {
      try {
        const coverSelectors = [
          'input[type="file"][accept*="image"]',
          '[data-testid="cover-image-input"]',
          'input[type="file"]',
        ];
        for (const sel of coverSelectors) {
          const input = await page.$(sel);
          if (input) {
            await input.setInputFiles(noteData.coverPath);
            await sleep(2000);
            break;
          }
        }
      } catch {
        // カバー画像設定失敗はスキップして続行
      }
    }

    // タイトル入力
    const titleSelector = 'textarea[placeholder="記事タイトル"]';
    await page.waitForSelector(titleSelector, { timeout: 10000 });
    await page.click(titleSelector);
    await page.fill(titleSelector, noteData.title);

    // 本文入力
    const bodySelector = '.ProseMirror, [contenteditable="true"]:not([placeholder="記事タイトル"])';
    await page.waitForSelector(bodySelector, { timeout: 10000 });
    await page.click(bodySelector);
    await sleep(500);

    // 本文をクリップボード経由で入力（長文対応）
    const fullBody = noteData.paidPart
      ? noteData.freePart + '\n\n' + noteData.paidPart
      : noteData.freePart;

    await page.evaluate((text) => {
      const el = document.querySelector('.ProseMirror, [contenteditable="true"]:not([placeholder="記事タイトル"])');
      if (el) {
        el.focus();
        document.execCommand('insertText', false, text);
      }
    }, fullBody);

    await sleep(1000);

    // 価格設定（有料の場合）
    if (noteData.price > 0 && noteData.paidPart) {
      const sellBtnSelectors = [
        'button:has-text("販売設定")',
        'button:has-text("有料")',
        '[data-testid="sell-button"]',
      ];
      for (const sel of sellBtnSelectors) {
        try {
          await page.click(sel, { timeout: 3000 });
          break;
        } catch {}
      }
      await sleep(1000);

      const priceInput = await page.$('input[type="number"], input[placeholder*="価格"]');
      if (priceInput) {
        await priceInput.fill(String(noteData.price));
      }
      await sleep(500);
    }

    // 公開ボタンをクリック
    const publishSelectors = [
      'button:has-text("公開")',
      'button:has-text("投稿")',
      '[data-testid="publish-button"]',
    ];
    for (const sel of publishSelectors) {
      try {
        await page.click(sel, { timeout: 3000 });
        break;
      } catch {}
    }
    await sleep(1500);

    // 確認ダイアログ
    const confirmSelectors = [
      'button:has-text("公開する")',
      'button:has-text("投稿する")',
      'button:has-text("確認")',
    ];
    for (const sel of confirmSelectors) {
      try {
        await page.click(sel, { timeout: 3000 });
        break;
      } catch {}
    }

    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 20000 });
    return page.url();

  } catch (err) {
    if (retryCount < 3) {
      console.log(`  リトライ (${retryCount + 1}/3)...`);
      await sleep(5000);
      return postNote(page, noteData, retryCount + 1);
    }
    throw err;
  }
}

async function main() {
  if (!CONFIG.email || !CONFIG.password) {
    console.error('.env に NOTE_EMAIL と NOTE_PASSWORD を設定してください。');
    process.exit(1);
  }

  const state = loadState();
  const today = new Date().toISOString().split('T')[0];
  state.lastPostDate = today;

  if (state.todayCount >= CONFIG.limitPerDay) {
    console.log(`本日の投稿上限（${CONFIG.limitPerDay}本）に達しました。明日また実行してください。`);
    process.exit(0);
  }

  // 未投稿ファイルの取得
  const postedFiles = new Set(state.posted.map(p => p.file));
  const allFiles = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.md'));
  const pendingFiles = allFiles.filter(f => !postedFiles.has(f));

  if (pendingFiles.length === 0) {
    console.log('未投稿の記事はありません。');
    process.exit(0);
  }

  const remaining = CONFIG.limitPerDay - state.todayCount;
  const toPost = pendingFiles.slice(0, remaining);

  console.log(`未投稿: ${pendingFiles.length}本 / 本日残り投稿枠: ${remaining}本`);
  console.log(`今回投稿: ${toPost.length}本\n`);

  if (!CONFIG.autoMode) {
    console.log('セミオートモードです。各記事を確認してから投稿します。');
    console.log('完全自動化は --auto フラグを使用してください。\n');
  }

  const browser = await chromium.launch({ headless: CONFIG.headless });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await login(page);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < toPost.length; i++) {
      const file = toPost[i];
      const content = fs.readFileSync(path.join(OUTPUT_DIR, file), 'utf-8');
      const noteData = parseMarkdown(content, file);

      console.log(`[${i + 1}/${toPost.length}] ${noteData.title.slice(0, 50)}...`);
      console.log(`  ジャンル: ${file.split('_')[1]?.replace('.md', '')} | 価格: ¥${noteData.price}`);

      if (!CONFIG.autoMode) {
        console.log('\n--- 無料パート冒頭 ---');
        console.log(noteData.freePart.slice(0, 200) + '...');
        console.log('-------------------\n');

        const answer = await ask('投稿しますか？ [y/N/q(終了)]: ');
        if (answer.toLowerCase() === 'q') {
          console.log('\n投稿を中断しました。');
          break;
        }
        if (answer.toLowerCase() !== 'y') {
          console.log('  スキップ\n');
          continue;
        }
      }

      try {
        process.stdout.write('  投稿中... ');
        const noteUrl = await postNote(page, noteData);

        state.posted.push({
          id: parseInt(file.split('_')[0]),
          file,
          postedAt: new Date().toISOString(),
          noteUrl,
        });
        state.todayCount++;
        saveState(state);

        console.log(`完了: ${noteUrl}`);
        successCount++;

        // 最後の記事でなければ待機
        if (i < toPost.length - 1) {
          const waitMs = CONFIG.intervalMinutes * 60 * 1000;
          console.log(`\n次の投稿まで${CONFIG.intervalMinutes}分待機中...\n`);
          await sleep(waitMs);
        }

      } catch (err) {
        console.log(`エラー: ${err.message}`);
        errorCount++;
      }
    }

    console.log(`\n完了: 成功${successCount}本 / エラー${errorCount}本`);
    console.log(`本日の投稿合計: ${state.todayCount}/${CONFIG.limitPerDay}本`);

  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('致命的エラー:', err.message);
  process.exit(1);
});
