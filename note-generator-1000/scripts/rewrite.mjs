#!/usr/bin/env node
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Load env
const envPath = path.join(ROOT, '.env');
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf-8');
  env.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length) process.env[key.trim()] = vals.join('=').trim();
  });
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function rewriteNote(content, issues) {
  const issueList = issues.map(i => `- ${i.message}`).join('\n');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    temperature: 0.7,
    system: 'あなたはnoteのリライト専門家です。',
    messages: [{
      role: 'user',
      content: `以下のnote記事を改善してください。

【改善ポイント】
${issueList}

【現在の記事】
${content}

改善ポイントをすべて修正した上で、記事全体のクオリティを引き上げてください。
元の構成は維持しつつ、読者に刺さる表現に変えてください。
有料パートの区切りは「---ここから有料---」を維持してください。`,
    }],
  });

  return response.content[0].text;
}

async function runQualityCheck() {
  const { execSync } = await import('child_process');
  execSync('node scripts/quality-check.mjs', { cwd: ROOT, stdio: 'inherit' });
}

async function main() {
  const reportPath = path.join(ROOT, 'data', 'quality-report.json');

  if (!fs.existsSync(reportPath)) {
    console.log('品質レポートがありません。先に npm run check を実行します...\n');
    await runQualityCheck();
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
  const lowRankNotes = report.lowRankNotes || [];

  if (lowRankNotes.length === 0) {
    console.log('Cランク以下のnoteはありません。');
    return;
  }

  console.log(`${lowRankNotes.length}本をリライトします...\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const note of lowRankNotes) {
    const filePath = path.join(ROOT, 'output', note.file);

    if (!fs.existsSync(filePath)) {
      console.log(`ファイルが見つかりません: ${note.file}`);
      continue;
    }

    process.stdout.write(`[${note.rank}] ${note.file.slice(0, 40)}... `);

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const rewritten = await rewriteNote(content, note.issues);

      // ヘッダーを保持しつつ本文を置き換え
      const headerMatch = content.match(/^(# .+\n\n\*\*.*?\*\*\n\n---\n\n)/s);
      const header = headerMatch ? headerMatch[1] : '';

      fs.writeFileSync(filePath, header + rewritten, 'utf-8');
      console.log(`完了`);
      successCount++;

      await new Promise(r => setTimeout(r, 2000));
    } catch (err) {
      console.log(`エラー: ${err.message}`);
      errorCount++;
    }
  }

  console.log(`\nリライト完了: 成功${successCount}本 / エラー${errorCount}本`);

  if (successCount > 0) {
    console.log('\n再品質チェックを実行します...\n');
    await runQualityCheck();
  }
}

main().catch(console.error);
