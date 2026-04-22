#!/usr/bin/env node
/**
 * Claude Code特化タイトル100本生成スクリプト
 */
import Anthropic from '@anthropic-ai/sdk';
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

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TOTAL = 100;
const BATCH = 50;

async function generateBatch(batchSize, startId, existingTitles) {
  const prompt = `Claude Code（Anthropic社のAI CLIツール）に特化したnote有料記事のタイトルを${batchSize}本生成してください。

【ターゲット読者】
- プログラミング初心者・非エンジニアでAIを副業や仕事に活かしたい人
- エンジニアだがAIツールの活用をもっと深めたい人
- AI副業・フリーランスに興味がある人

【扱うテーマ（バランスよく）】
- Claude Code入門・セットアップ方法
- Claude Codeで業務自動化・効率化
- 非エンジニアのClaude Code活用術
- Claude Codeで副業・収益化
- Claude Code × 他ツール（Cursor, GitHub Copilot, ChatGPT）比較
- Claude Codeのプロンプト術・コツ
- Claude Codeで特定タスクを自動化（スクレイピング, API連携, データ分析など）
- AIエージェント×Claude Codeの組み合わせ
- Claude Codeを使ったWebサービス・ツール作成

【タイトルの型】
- 「Claude Codeで○○した話。作業時間が○分の1になった」
- 「【完全入門】非エンジニアがClaude Codeを使いこなすまでの全手順」
- 「ChatGPTとClaude Codeの違いを6ヶ月使って比較した結果」
- 「Claude Codeで月収○万円。AIフリーランスの仕事術を全公開」
- 「Claude Codeを使えない人が損してる○つの理由」

【重複禁止の既存タイトル】
${existingTitles.slice(-30).map(t => t.title).join('\n')}

以下のJSON形式のみで返してください（他のテキスト不要）:
[
  {
    "title": "タイトル",
    "angle": "方法論",
    "emotion": "好奇心",
    "target_length": 5000,
    "price": 980
  }
]

angleは: 方法論, 失敗談, 比較, ランキング, 体験談, 最新トレンド のいずれか
emotionは: 好奇心, 焦り, 希望, 怒り, 共感 のいずれか
priceは: 480, 980, 1980 のいずれか
target_lengthは: 4000〜7000の整数`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].text;
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('JSON not found in response');

  const items = JSON.parse(jsonMatch[0]);
  return items.map((item, i) => ({
    id: startId + i,
    title: item.title,
    genre: 'claude_code',
    angle: item.angle,
    emotion: item.emotion,
    target_length: item.target_length,
    price: item.price,
  }));
}

async function main() {
  const outputPath = path.join(ROOT, 'data', 'titles.json');
  let existing = { notes: [] };
  if (fs.existsSync(outputPath)) {
    existing = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
  }

  const currentClaudeCode = existing.notes.filter(n => n.genre === 'claude_code');
  if (currentClaudeCode.length >= TOTAL) {
    console.log(`Claude Codeタイトルは既に${currentClaudeCode.length}本あります。`);
    return;
  }

  const needed = TOTAL - currentClaudeCode.length;
  console.log(`Claude Codeタイトルを${needed}本生成します...`);

  let allNotes = [...existing.notes];
  let currentId = allNotes.length + 1;
  let generated = 0;

  while (generated < needed) {
    const batchSize = Math.min(BATCH, needed - generated);
    console.log(`  バッチ生成中: ${generated + 1}〜${generated + batchSize}本目`);

    try {
      const notes = await generateBatch(batchSize, currentId, allNotes);
      allNotes.push(...notes);
      currentId += notes.length;
      generated += notes.length;

      fs.writeFileSync(outputPath, JSON.stringify({ notes: allNotes }, null, 2), 'utf-8');
      console.log(`  -> ${generated}/${needed}本完了`);

      if (generated < needed) await new Promise(r => setTimeout(r, 2000));
    } catch (err) {
      console.error(`エラー: ${err.message}`);
      break;
    }
  }

  console.log(`\n✅ 完了: Claude Codeタイトル${generated}本を data/titles.json に追加しました`);
}

main().catch(console.error);
