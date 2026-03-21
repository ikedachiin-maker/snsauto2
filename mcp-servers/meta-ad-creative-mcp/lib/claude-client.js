import { readFileSync } from "fs";
import { join } from "path";

const BASE_DIR = import.meta.dirname;
const SYSTEM_PROMPT_FILE = join(
  BASE_DIR,
  "..",
  "templates",
  "prompts",
  "ad-copy-system.txt"
);

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-sonnet-4-20250514";

const TONE_DESCRIPTIONS = {
  professional: "フォーマルでビジネスライクなトーン。信頼感と専門性を重視",
  casual: "親しみやすくカジュアルなトーン。友人に話すような自然な言葉遣い",
  urgent: "緊急性を強調するトーン。今すぐ行動を促す。限定感・希少性を活用",
  emotional: "感情に訴えるトーン。共感・感動・ストーリー性を重視",
  ugc: "ユーザー投稿風のトーン。体験談のような自然な語り口。口コミ的",
};

const CTA_LABELS = {
  shop_now: "今すぐ購入",
  learn_more: "詳しくはこちら",
  sign_up: "登録する",
  download: "ダウンロード",
  contact_us: "お問い合わせ",
  get_offer: "特典を受け取る",
};

function getApiKey() {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY.trim();
  throw new Error(
    "ANTHROPIC_API_KEY not set. Set it as an environment variable."
  );
}

function getModel() {
  return process.env.CLAUDE_MODEL || DEFAULT_MODEL;
}

function loadSystemPrompt() {
  return readFileSync(SYSTEM_PROMPT_FILE, "utf-8");
}

function buildUserPrompt(options) {
  const {
    productName,
    productDescription,
    targetAudience,
    tone,
    ctaType,
    language,
    numVariations,
  } = options;

  const toneDesc = TONE_DESCRIPTIONS[tone] || TONE_DESCRIPTIONS.casual;
  const ctaLabel = CTA_LABELS[ctaType] || CTA_LABELS.learn_more;
  const lang = language === "en" ? "英語" : "日本語";

  return `以下の商品・サービスの広告コピーを${numVariations}個生成してください。

## 商品情報
- 商品名: ${productName}
- 説明: ${productDescription}
${targetAudience ? `- ターゲット層: ${targetAudience}` : ""}

## 指定条件
- トーン: ${tone}（${toneDesc}）
- CTAボタン: ${ctaType}（${ctaLabel}）
- 言語: ${lang}
- バリエーション数: ${numVariations}個

JSON配列で出力してください。`;
}

export async function generateAdCopy(options) {
  const apiKey = getApiKey();
  const model = getModel();
  const systemPrompt = loadSystemPrompt();

  const userPrompt = buildUserPrompt({
    productName: options.productName,
    productDescription: options.productDescription,
    targetAudience: options.targetAudience || "",
    tone: options.tone || "casual",
    ctaType: options.ctaType || "learn_more",
    language: options.language || "ja",
    numVariations: options.numVariations || 1,
  });

  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const text = data?.content?.[0]?.text;

  if (!text) {
    throw new Error("No text returned from Claude API");
  }

  // Parse JSON from response (handle potential markdown wrapping)
  let copies;
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON array found in response");
    copies = JSON.parse(jsonMatch[0]);
  } catch (e) {
    throw new Error(`Failed to parse Claude response as JSON: ${e.message}\nRaw: ${text}`);
  }

  // Validate and add CTA + variation IDs
  return copies.map((copy, i) => ({
    headline: (copy.headline || "").slice(0, 40),
    primary_text: (copy.primary_text || "").slice(0, 200),
    description: (copy.description || "").slice(0, 25),
    cta: options.ctaType || "learn_more",
    variation_id: `copy_v${i + 1}`,
  }));
}

export { TONE_DESCRIPTIONS, CTA_LABELS };
