#!/usr/bin/env node
/**
 * 無料→有料パートの切り替えCTAを強化するスクリプト（APIコストゼロ版）
 * - <!-- formatted --> タグがある記事を対象
 * - 有料パートの見出し（## ）を抽出してベネフィット箇条書きを自動生成
 * - まとめセクションの末尾（---ここから有料--- の直前）にCTAを挿入
 * - 既にCTAが強化済みの記事はスキップ（<!-- cta-updated --> タグで管理）
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT, 'output');

const GENRE_PHRASES = {
  fukugyou: { topic: '副業・収入アップ', action: '稼ぐ' },
  mindset:  { topic: 'マインドセット・思考改革', action: '成果を出す' },
  renai:    { topic: '恋愛・人間関係', action: '結果を出す' },
  business: { topic: 'ビジネス・スキルアップ', action: '成功する' },
  health:   { topic: '健康・美容', action: '変わる' },
};

function isFormatted(content) {
  return content.includes('<!-- formatted -->');
}

function isCtaUpdated(content) {
  return content.includes('<!-- cta-updated -->');
}

function parseParts(content) {
  const sepIdx = content.indexOf('---ここから有料---');
  if (sepIdx === -1) return { freePart: content, paidPart: '' };
  return {
    freePart: content.slice(0, sepIdx),
    paidPart: content.slice(sepIdx + '---ここから有料---'.length).trim(),
  };
}

// 有料パートから見出しを最大4つ抽出
function extractPaidHeadings(paidPart) {
  const lines = paidPart.split('\n');
  const headings = lines
    .filter(l => /^#{1,3} /.test(l))
    .map(l => l.replace(/^#{1,3} /, '').trim())
    .filter(h => h.length > 0 && h.length < 40)
    .slice(0, 4);
  return headings;
}

// 見出しをベネフィット文に変換
function headingToBenefit(heading) {
  // すでに「〜方法」「〜術」「〜ステップ」などの形なら加工
  if (/方法|術|ステップ|手順|コツ|戦略|テンプレ|事例|実例|スケジュール|チェック/.test(heading)) {
    return heading;
  }
  return heading;
}

// タイトルからキーワードを抽出
function extractKeyword(title) {
  // 「副業で月収○万」「恋愛で〜」などのパターン
  const match = title.match(/月収[\d万円]+|月[\d万円]+|[\d]+万/);
  if (match) return match[0];
  return '';
}

function buildCta(title, genre, paidPart) {
  const gp = GENRE_PHRASES[genre] || GENRE_PHRASES.fukugyou;
  const headings = extractPaidHeadings(paidPart);
  const keyword = extractKeyword(title);

  // 見出しが取れない場合のデフォルトベネフィット
  const defaultBenefits = [
    `具体的なステップと手順（すぐ実践できる形式）`,
    `失敗しないためのチェックリスト`,
    `成果を出した人の実例・数値データ`,
    `コピペで使えるテンプレート集`,
  ];

  const benefits = headings.length >= 3
    ? headings.map(headingToBenefit)
    : defaultBenefits;

  const benefitLines = benefits.map(b => `✅ ${b}`).join('\n');

  const intro = keyword
    ? `この先の有料パートでは、**${keyword}を実現するための具体的なノウハウ**をすべて公開しています。`
    : `この先の有料パートでは、**${gp.topic}で本当に${gp.action}ための具体的なノウハウ**をすべて公開しています。`;

  return `${intro}

${benefitLines}

無料パートでお伝えしたことは、あくまでも「入口」です。本当に大切なこと、すぐに使える手順と実例は、続きにすべて詰め込みました。ぜひ読んでみてください。

<!-- cta-updated -->`;
}

function main() {
  const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.md'));
  const targets = files.filter(f => {
    const content = fs.readFileSync(path.join(OUTPUT_DIR, f), 'utf-8');
    return isFormatted(content) && !isCtaUpdated(content);
  });

  const alreadyDone = files.filter(f => {
    const content = fs.readFileSync(path.join(OUTPUT_DIR, f), 'utf-8');
    return isCtaUpdated(content);
  }).length;

  console.log(`対象: ${targets.length}本 / スキップ済み: ${alreadyDone}本\n`);

  if (targets.length === 0) {
    console.log('すべてCTA更新済みです。');
    return;
  }

  let success = 0;
  let skipped = 0;

  for (let i = 0; i < targets.length; i++) {
    const file = targets[i];
    const filePath = path.join(OUTPUT_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    const [, genreRaw] = file.replace('.md', '').split('_');
    const genre = genreRaw || 'fukugyou';
    const title = content.split('\n')[0].replace(/^#\s*/, '').trim();

    const { freePart, paidPart } = parseParts(content);
    if (!paidPart) {
      process.stdout.write(`[${i + 1}/${targets.length}] ${title.slice(0, 28)}... スキップ（有料パートなし）\n`);
      skipped++;
      continue;
    }

    const cta = buildCta(title, genre, paidPart);
    const newContent = freePart.trimEnd() + '\n\n' + cta + '\n\n' + '---ここから有料---' + '\n\n' + paidPart;

    fs.writeFileSync(filePath, newContent, 'utf-8');
    process.stdout.write(`[${i + 1}/${targets.length}] ${title.slice(0, 30)}... ✅\n`);
    success++;
  }

  console.log(`\nCTA更新完了: ${success}本更新 / ${skipped}本スキップ`);
}

main();
