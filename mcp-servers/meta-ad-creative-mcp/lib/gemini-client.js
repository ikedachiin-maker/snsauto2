import { readFileSync, existsSync } from "fs";
import { join } from "path";

const BASE_DIR = import.meta.dirname;
const API_KEY_FILE = join(BASE_DIR, "..", "apikey.txt");
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

const MODELS = {
  "nano-banana-pro": "gemini-3-pro-image-preview",
  "nano-banana": "gemini-2.5-flash-image",
};

// Ad format -> Gemini aspect ratio mapping
const FORMAT_ASPECT_MAP = {
  feed_square: "1:1",
  feed_portrait: "3:4",
  story: "9:16",
  carousel: "1:1",
};

// Style -> prompt enhancement
const STYLE_PROMPTS = {
  photo_realistic:
    "Professional high-quality photography, studio lighting, sharp focus, clean composition",
  illustration:
    "Modern digital illustration, vibrant colors, clean vector-like style",
  ugc_style:
    "Authentic user-generated content style, natural lighting, casual smartphone photo aesthetic, relatable",
  minimal:
    "Minimalist design, clean white space, simple elegant composition, modern",
  bold_graphic:
    "Bold graphic design, high contrast colors, eye-catching typography space, dynamic layout",
};

function getApiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY.trim();
  if (existsSync(API_KEY_FILE))
    return readFileSync(API_KEY_FILE, "utf-8").trim();
  // Also check google-flow-mcp's apikey.txt
  const altKeyFile = join(BASE_DIR, "..", "..", "google-flow-mcp", "apikey.txt");
  if (existsSync(altKeyFile)) return readFileSync(altKeyFile, "utf-8").trim();
  throw new Error(
    "Gemini API key not found. Set GEMINI_API_KEY env var or create apikey.txt"
  );
}

function buildAdImagePrompt(userPrompt, format, style) {
  const styleEnhancement = STYLE_PROMPTS[style] || STYLE_PROMPTS.photo_realistic;

  const formatHints = {
    feed_square:
      "Square format for social media feed ad, centered subject, clear focal point",
    feed_portrait:
      "Portrait format for social media feed ad, vertical composition, product-focused",
    story:
      "Full-screen vertical format for Stories/Reels ad, mobile-first, immersive",
    carousel:
      "Clean product shot suitable for carousel ad card, consistent style",
  };

  const formatHint = formatHints[format] || formatHints.feed_square;

  return `${userPrompt}. ${styleEnhancement}. ${formatHint}. No text or watermarks in the image.`;
}

export async function generateAdImage(prompt, options = {}) {
  const apiKey = getApiKey();
  const model = options.model || "nano-banana-pro";
  const modelId = MODELS[model];
  const format = options.format || "feed_square";
  const style = options.style || "photo_realistic";
  const imageSize = options.imageSize || "1K";

  if (!modelId) {
    throw new Error(`Unknown model: ${model}. Use: ${Object.keys(MODELS).join(", ")}`);
  }

  const aspectRatio = FORMAT_ASPECT_MAP[format];
  if (!aspectRatio) {
    throw new Error(`Unknown format: ${format}. Use: ${Object.keys(FORMAT_ASPECT_MAP).join(", ")}`);
  }

  const enhancedPrompt = buildAdImagePrompt(prompt, format, style);

  const url = `${GEMINI_API_BASE}/${modelId}:generateContent`;
  const body = {
    contents: [{ parts: [{ text: enhancedPrompt }] }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: {
        aspectRatio,
        imageSize,
      },
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts;

  if (!parts || parts.length === 0) {
    throw new Error("No content returned from Gemini API");
  }

  // Extract image data
  const imageData = parts.find((p) => p.inlineData);
  const textData = parts.find((p) => p.text);

  if (!imageData) {
    throw new Error("No image generated. Gemini returned text only.");
  }

  return {
    base64: imageData.inlineData.data,
    mimeType: imageData.inlineData.mimeType,
    description: textData?.text || null,
    promptUsed: enhancedPrompt,
    format,
    aspectRatio,
    model,
  };
}

export { FORMAT_ASPECT_MAP, STYLE_PROMPTS, MODELS };
