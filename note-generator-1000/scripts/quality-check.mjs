#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

function countKanji(text) {
  const kanjiPattern = /[\u4e00-\u9faf\u3400-\u4dbf]/g;
  const kanjiCount = (text.match(kanjiPattern) || []).length;
  const totalChars = text.replace(/\s/g, '').length;
  return totalChars > 0 ? kanjiCount / totalChars : 0;
}

function countNumbers(text) {
  return (text.match(/[0-9０-９]+/g) || []).length;
}

function getSentences(text) {
  return text.split(/[。！？\n]/).filter(s => s.trim().length > 0);
}

function similarity(text1, text2) {
  const words1 = new Set(text1.slice(0, 500).split(''));
  const words2 = new Set(text2.slice(0, 500).split(''));
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  return intersection.size / union.size;
}

function checkNote(content, allContents) {
  const issues = [];
  const text = content.replace(/^#.*$/m, '').replace(/\*\*.*?\*\*/g, '').trim();
  const charCount = text.length;

  // 1. 文字数チェック
  if (charCount < 3000) {
    issues.push({ type: 'char_count', severity: 'error', message: `文字数不足: ${charCount}字（最低3000字必要）` });
  } else if (charCount > 8000) {
    issues.push({ type: 'char_count', severity: 'warning', message: `文字数超過: ${charCount}字（最大8000字推奨）` });
  }

  // 2. 冒頭フックチェック
  const hookWords = ['あなた', '悩み', '辛い', '苦しい', 'できない', '不安', 'つらい', '困って', '稼げない', 'モテない', '痩せられない'];
  const first3Lines = text.split('\n').slice(0, 3).join('');
  const hasHook = hookWords.some(w => first3Lines.includes(w));
  if (!hasHook) {
    issues.push({ type: 'hook', severity: 'warning', message: '冒頭3行に読者の悩みに触れる表現がない' });
  }

  // 3. 数字チェック
  const numberCount = countNumbers(text);
  if (numberCount < 5) {
    issues.push({ type: 'numbers', severity: 'warning', message: `具体的な数字が少ない: ${numberCount}個（5個以上推奨）` });
  }

  // 4. CTAチェック
  const ctaWords = ['有料', 'ここから先', '続きを読む', '購入', '限定', '今すぐ'];
  const hasCTA = ctaWords.some(w => text.includes(w));
  if (!hasCTA) {
    issues.push({ type: 'cta', severity: 'error', message: '有料パートへの誘導文（CTA）がない' });
  }

  // 5. 一文の長さチェック
  const sentences = getSentences(text);
  const longSentences = sentences.filter(s => s.length > 68);
  const longRatio = sentences.length > 0 ? longSentences.length / sentences.length : 0;
  if (longRatio > 0.1) {
    issues.push({ type: 'sentence_length', severity: 'warning', message: `長文が多い: ${Math.round(longRatio * 100)}%（10%以内推奨）` });
  }

  // 6. 漢字率チェック
  const kanjiRate = countKanji(text);
  if (kanjiRate > 0.35) {
    issues.push({ type: 'kanji_rate', severity: 'warning', message: `漢字率が高い: ${Math.round(kanjiRate * 100)}%（35%以下推奨）` });
  }

  // 7. 重複チェック（サンプリング）
  const sampleContents = allContents.slice(0, 20);
  for (const other of sampleContents) {
    if (other === content) continue;
    const sim = similarity(text, other);
    if (sim > 0.7) {
      issues.push({ type: 'duplicate', severity: 'error', message: `類似コンテンツ検出: 類似度${Math.round(sim * 100)}%` });
      break;
    }
  }

  // ランク付け
  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const totalIssues = errorCount * 2 + warningCount;

  let rank;
  if (totalIssues === 0) rank = 'A';
  else if (totalIssues <= 2) rank = 'B';
  else if (totalIssues <= 5) rank = 'C';
  else rank = 'D';

  return { rank, issues, charCount, kanjiRate: Math.round(kanjiRate * 100), numberCount };
}

async function main() {
  const outputDir = path.join(ROOT, 'output');
  const reportPath = path.join(ROOT, 'data', 'quality-report.json');

  if (!fs.existsSync(outputDir)) {
    console.error('output/ ディレクトリが見つかりません。先に npm run generate を実行してください。');
    process.exit(1);
  }

  const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.md'));
  if (files.length === 0) {
    console.log('チェック対象のファイルがありません。');
    return;
  }

  console.log(`${files.length}本の品質チェックを開始...\n`);

  const allContents = files.map(f => fs.readFileSync(path.join(outputDir, f), 'utf-8'));
  const results = [];
  const rankCount = { A: 0, B: 0, C: 0, D: 0 };
  const lowRankNotes = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const content = allContents[i];
    const result = checkNote(content, allContents.filter((_, j) => j !== i));

    const parts = file.replace('.md', '').split('_');
    const id = parts[0];
    const genre = parts.slice(1).join('_');
    const noteResult = { id: parseInt(id), genre, file, ...result };
    results.push(noteResult);
    rankCount[result.rank]++;

    if (['C', 'D'].includes(result.rank)) {
      lowRankNotes.push(noteResult);
    }

    if ((i + 1) % 50 === 0 || i + 1 === files.length) {
      console.log(`  進捗: ${i + 1}/${files.length}本チェック完了`);
    }
  }

  // レポート保存
  const report = {
    checkedAt: new Date().toISOString(),
    totalChecked: files.length,
    rankSummary: rankCount,
    lowRankNotes: lowRankNotes.map(n => ({
      id: n.id,
      file: n.file,
      rank: n.rank,
      issues: n.issues,
      charCount: n.charCount,
    })),
    allResults: results,
  };

  fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');

  // 結果表示
  console.log('\n品質チェック結果:');
  console.log(`  A ランク: ${rankCount.A}本`);
  console.log(`  B ランク: ${rankCount.B}本`);
  console.log(`  C ランク: ${rankCount.C}本`);
  console.log(`  D ランク: ${rankCount.D}本`);
  console.log(`\nCランク以下: ${lowRankNotes.length}本`);

  if (lowRankNotes.length > 0) {
    console.log('\n改善が必要なnote（上位10件）:');
    lowRankNotes.slice(0, 10).forEach(n => {
      console.log(`  [${n.rank}] ${n.file}: ${n.issues.map(i => i.message).join(' / ')}`);
    });
  }

  console.log(`\nレポートを data/quality-report.json に保存しました`);
}

main().catch(console.error);
