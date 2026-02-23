import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { join } from "path";

// ── Config ──────────────────────────────────────────────────────────────
const BASE_DIR = import.meta.dirname;
const OUTPUT_DIR = join(BASE_DIR, "output");
const API_KEY_FILE = join(BASE_DIR, "apikey.txt");

const GEMINI_API_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";

const MODELS = {
  "nano-banana-pro": "gemini-3-pro-image-preview",
  "nano-banana": "gemini-2.5-flash-image",
};

function getApiKey() {
  // Check env first, then file
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY.trim();
  if (existsSync(API_KEY_FILE)) return readFileSync(API_KEY_FILE, "utf-8").trim();
  throw new Error(
    "API key not found. Set GEMINI_API_KEY env var or create apikey.txt"
  );
}

// ── Image Generation ────────────────────────────────────────────────────
async function generateImage(prompt, options = {}) {
  const apiKey = getApiKey();
  const modelId = MODELS[options.model || "nano-banana-pro"];
  const aspectRatio = options.aspectRatio || "1:1";
  const imageSize = options.imageSize || "1K";

  const url = `${GEMINI_API_BASE}/${modelId}:generateContent`;

  const body = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: {
        aspectRatio: aspectRatio,
        imageSize: imageSize,
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
    throw new Error(
      "No content returned. Response: " +
        JSON.stringify(data).substring(0, 500)
    );
  }

  return parts;
}

function saveImage(base64Data, mimeType, filename) {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  const filePath = join(OUTPUT_DIR, filename);
  writeFileSync(filePath, Buffer.from(base64Data, "base64"));
  return filePath;
}

// ── MCP Server ──────────────────────────────────────────────────────────
const server = new McpServer({
  name: "google-flow",
  version: "1.0.0",
});

server.tool(
  "generate_image",
  "Generate an image using Google Gemini (Nano Banana Pro or Nano Banana). Saves image to output/ and returns file path.",
  {
    prompt: z.string().describe("Text description of the image to generate"),
    model: z
      .enum(["nano-banana-pro", "nano-banana"])
      .optional()
      .default("nano-banana-pro")
      .describe(
        "nano-banana-pro = Gemini 3 Pro Image (highest quality), nano-banana = Gemini 2.5 Flash Image (faster)"
      ),
    aspect_ratio: z
      .enum(["1:1", "16:9", "9:16", "4:3", "3:4"])
      .optional()
      .default("1:1")
      .describe("Aspect ratio of the generated image"),
    image_size: z
      .enum(["1K", "2K", "4K"])
      .optional()
      .default("1K")
      .describe("Resolution: 1K (default), 2K, or 4K (Nano Banana Pro only)"),
  },
  async ({ prompt, model, aspect_ratio, image_size }) => {
    try {
      const parts = await generateImage(prompt, {
        model,
        aspectRatio: aspect_ratio,
        imageSize: image_size,
      });

      const timestamp = Date.now();
      const results = [];
      let imageIndex = 0;

      for (const part of parts) {
        if (part.inlineData) {
          const ext = part.inlineData.mimeType === "image/png" ? "png" : "jpg";
          const filename = `nanobananapro_${timestamp}_${imageIndex}.${ext}`;
          const filePath = saveImage(
            part.inlineData.data,
            part.inlineData.mimeType,
            filename
          );
          results.push({ path: filePath, mimeType: part.inlineData.mimeType });
          imageIndex++;
        } else if (part.text) {
          results.push({ description: part.text });
        }
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { success: true, prompt, model, images: results },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "check_api",
  "Verify the Gemini API key is working",
  {},
  async () => {
    try {
      const apiKey = getApiKey();
      const url = `${GEMINI_API_BASE}?key=${apiKey}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`API check failed (${res.status})`);
      }
      const data = await res.json();
      const imageModels = (data.models || [])
        .filter((m) => m.name.includes("image"))
        .map((m) => m.name);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { success: true, apiKeyValid: true, imageModels },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// ── Start ───────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
