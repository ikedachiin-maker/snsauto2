import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { generateAdImage, FORMAT_ASPECT_MAP } from "./lib/gemini-client.js";
import { generateAdCopy } from "./lib/claude-client.js";
import {
  AD_FORMATS,
  CTA_OPTIONS,
  IMAGE_STYLES,
  COPY_TONES,
  getAllTemplates,
} from "./lib/templates.js";
import {
  createOutputDir,
  saveImageFile,
  saveCreativeManifest,
  saveVariationsManifest,
} from "./lib/output-manager.js";

// ── MCP Server ──────────────────────────────────────────────────────────
const server = new McpServer({
  name: "meta-ad-creative",
  version: "1.0.0",
});

// ── Tool 1: list_templates ──────────────────────────────────────────────
server.tool(
  "list_templates",
  "List available Meta ad formats, CTA options, image styles, and copy tones",
  {
    category: z
      .enum(["all", "feed", "story", "carousel"])
      .optional()
      .default("all")
      .describe("Filter by category"),
  },
  async ({ category }) => {
    const templates = getAllTemplates(category);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              templates,
              cta_options: CTA_OPTIONS,
              image_styles: IMAGE_STYLES,
              copy_tones: COPY_TONES,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ── Tool 2: generate_ad_copy ────────────────────────────────────────────
server.tool(
  "generate_ad_copy",
  "Generate Meta ad copy (headline, primary text, description) using Claude AI. Returns structured ad text ready for Meta campaigns.",
  {
    product_name: z.string().describe("商品/サービス名"),
    product_description: z
      .string()
      .describe("商品の特徴・ベネフィットの説明"),
    target_audience: z
      .string()
      .optional()
      .describe("ターゲット層（例: 30代女性、副業に興味のある会社員）"),
    tone: z
      .enum(["professional", "casual", "urgent", "emotional", "ugc"])
      .optional()
      .default("casual")
      .describe("コピーのトーン"),
    cta_type: z
      .enum([
        "shop_now",
        "learn_more",
        "sign_up",
        "download",
        "contact_us",
        "get_offer",
      ])
      .optional()
      .default("learn_more")
      .describe("CTAボタン種別"),
    language: z
      .enum(["ja", "en"])
      .optional()
      .default("ja")
      .describe("言語"),
    num_variations: z
      .number()
      .min(1)
      .max(5)
      .optional()
      .default(1)
      .describe("バリエーション数（1-5）"),
  },
  async ({
    product_name,
    product_description,
    target_audience,
    tone,
    cta_type,
    language,
    num_variations,
  }) => {
    try {
      const copies = await generateAdCopy({
        productName: product_name,
        productDescription: product_description,
        targetAudience: target_audience,
        tone,
        ctaType: cta_type,
        language,
        numVariations: num_variations,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: true, copies }, null, 2),
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

// ── Tool 3: generate_ad_image ───────────────────────────────────────────
server.tool(
  "generate_ad_image",
  "Generate a Meta ad-optimized image using Gemini AI. Auto-selects aspect ratio based on ad format.",
  {
    prompt: z.string().describe("画像の説明プロンプト"),
    ad_format: z
      .enum(["feed_square", "feed_portrait", "story", "carousel"])
      .optional()
      .default("feed_square")
      .describe("広告フォーマット（アスペクト比を自動決定）"),
    style: z
      .enum([
        "photo_realistic",
        "illustration",
        "ugc_style",
        "minimal",
        "bold_graphic",
      ])
      .optional()
      .default("photo_realistic")
      .describe("画像スタイル"),
    model: z
      .enum(["nano-banana-pro", "nano-banana"])
      .optional()
      .default("nano-banana-pro")
      .describe("Geminiモデル"),
    image_size: z
      .enum(["1K", "2K"])
      .optional()
      .default("1K")
      .describe("解像度"),
    campaign_id: z
      .string()
      .optional()
      .describe("キャンペーンID（出力ディレクトリ整理用）"),
  },
  async ({ prompt, ad_format, style, model, image_size, campaign_id }) => {
    try {
      const result = await generateAdImage(prompt, {
        format: ad_format,
        style,
        model,
        imageSize: image_size,
      });

      // Save to output directory
      const { outputPath } = createOutputDir(campaign_id);
      const ext = result.mimeType === "image/png" ? "png" : "jpg";
      const filename = `${ad_format}_0.${ext}`;

      const fileInfo = saveImageFile(outputPath, result.base64, filename);

      const formatSpec = AD_FORMATS[ad_format];

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                image: {
                  ...fileInfo,
                  format: ad_format,
                  aspect_ratio: result.aspectRatio,
                  pixels: formatSpec?.pixels || "unknown",
                  mime_type: result.mimeType,
                  model: result.model,
                  style,
                  prompt_used: result.promptUsed,
                },
                output_dir: outputPath,
              },
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

// ── Tool 4: generate_ad_creative ────────────────────────────────────────
server.tool(
  "generate_ad_creative",
  "Generate a complete Meta ad creative package (image + copy) in one call. Saves everything to output directory with a creative.json manifest.",
  {
    product_name: z.string().describe("商品/サービス名"),
    product_description: z.string().describe("商品の特徴・ベネフィット"),
    image_prompt: z.string().describe("画像生成プロンプト"),
    ad_format: z
      .enum(["feed_square", "feed_portrait", "story", "carousel"])
      .optional()
      .default("feed_square")
      .describe("広告フォーマット"),
    target_audience: z.string().optional().describe("ターゲット層"),
    tone: z
      .enum(["professional", "casual", "urgent", "emotional", "ugc"])
      .optional()
      .default("casual"),
    cta_type: z
      .enum([
        "shop_now",
        "learn_more",
        "sign_up",
        "download",
        "contact_us",
        "get_offer",
      ])
      .optional()
      .default("learn_more"),
    style: z
      .enum([
        "photo_realistic",
        "illustration",
        "ugc_style",
        "minimal",
        "bold_graphic",
      ])
      .optional()
      .default("photo_realistic"),
    language: z.enum(["ja", "en"]).optional().default("ja"),
    campaign_id: z.string().optional().describe("キャンペーンID"),
  },
  async ({
    product_name,
    product_description,
    image_prompt,
    ad_format,
    target_audience,
    tone,
    cta_type,
    style,
    language,
    campaign_id,
  }) => {
    try {
      // Generate image and copy in parallel
      const [imageResult, copies] = await Promise.all([
        generateAdImage(image_prompt, {
          format: ad_format,
          style,
          model: "nano-banana-pro",
          imageSize: "1K",
        }),
        generateAdCopy({
          productName: product_name,
          productDescription: product_description,
          targetAudience: target_audience,
          tone,
          ctaType: cta_type,
          language,
          numVariations: 1,
        }),
      ]);

      // Save files
      const { outputPath, timestamp } = createOutputDir(campaign_id);
      const ext = imageResult.mimeType === "image/png" ? "png" : "jpg";
      const filename = `${ad_format}_0.${ext}`;
      const fileInfo = saveImageFile(outputPath, imageResult.base64, filename);

      const formatSpec = AD_FORMATS[ad_format];
      const creativeId = `crt_${timestamp}_${ad_format}`;

      const creative = {
        campaign_id: campaign_id || null,
        creatives: [
          {
            creative_id: creativeId,
            format: ad_format,
            image: {
              ...fileInfo,
              aspect_ratio: imageResult.aspectRatio,
              pixels: formatSpec?.pixels || "unknown",
              mime_type: imageResult.mimeType,
            },
            copy: copies[0],
            metadata: {
              product_name,
              target_audience: target_audience || null,
              tone,
              style,
              model_image: "nano-banana-pro",
              model_copy: "claude-sonnet",
            },
          },
        ],
      };

      const manifestPath = saveCreativeManifest(outputPath, creative);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                creative: creative.creatives[0],
                output_dir: outputPath,
                manifest_path: manifestPath,
              },
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

// ── Tool 5: generate_ad_variations ──────────────────────────────────────
server.tool(
  "generate_ad_variations",
  "Generate multiple ad creative variations for A/B testing. Choose to vary copy only, image only, or both.",
  {
    product_name: z.string().describe("商品/サービス名"),
    product_description: z.string().describe("商品の特徴・ベネフィット"),
    image_prompt: z
      .string()
      .describe("ベース画像プロンプト（バリエーション自動生成）"),
    ad_format: z
      .enum(["feed_square", "feed_portrait", "story", "carousel"])
      .optional()
      .default("feed_square"),
    num_variations: z
      .number()
      .min(2)
      .max(5)
      .optional()
      .default(3)
      .describe("バリエーション数（2-5）"),
    variation_strategy: z
      .enum(["copy_only", "image_only", "both"])
      .optional()
      .default("both")
      .describe("何を変えるか: copy_only / image_only / both"),
    target_audience: z.string().optional(),
    tone: z
      .enum(["professional", "casual", "urgent", "emotional", "ugc"])
      .optional()
      .default("casual"),
    cta_type: z
      .enum([
        "shop_now",
        "learn_more",
        "sign_up",
        "download",
        "contact_us",
        "get_offer",
      ])
      .optional()
      .default("learn_more"),
    style: z
      .enum([
        "photo_realistic",
        "illustration",
        "ugc_style",
        "minimal",
        "bold_graphic",
      ])
      .optional()
      .default("photo_realistic"),
    language: z.enum(["ja", "en"]).optional().default("ja"),
    campaign_id: z.string().optional(),
  },
  async ({
    product_name,
    product_description,
    image_prompt,
    ad_format,
    num_variations,
    variation_strategy,
    target_audience,
    tone,
    cta_type,
    style,
    language,
    campaign_id,
  }) => {
    try {
      const { outputPath, timestamp } = createOutputDir(campaign_id);
      const formatSpec = AD_FORMATS[ad_format];
      const variations = [];

      // Image variation suffixes for diversity
      const imageVariationHints = [
        "",
        ", different angle and composition",
        ", alternative color scheme and mood",
        ", close-up detail shot",
        ", lifestyle context with people",
      ];

      // Determine what to generate
      const needMultipleImages =
        variation_strategy === "image_only" ||
        variation_strategy === "both";
      const needMultipleCopies =
        variation_strategy === "copy_only" ||
        variation_strategy === "both";

      // Generate copies
      const copies = await generateAdCopy({
        productName: product_name,
        productDescription: product_description,
        targetAudience: target_audience,
        tone,
        ctaType: cta_type,
        language,
        numVariations: needMultipleCopies ? num_variations : 1,
      });

      // Generate images (sequentially to respect rate limits)
      const imageCount = needMultipleImages ? num_variations : 1;
      const images = [];

      for (let i = 0; i < imageCount; i++) {
        const hint = imageVariationHints[i] || "";
        const variedPrompt = `${image_prompt}${hint}`;

        const imageResult = await generateAdImage(variedPrompt, {
          format: ad_format,
          style,
          model: "nano-banana-pro",
          imageSize: "1K",
        });

        const ext = imageResult.mimeType === "image/png" ? "png" : "jpg";
        const filename = `${ad_format}_v${i + 1}.${ext}`;
        const fileInfo = saveImageFile(outputPath, imageResult.base64, filename);

        images.push({
          ...fileInfo,
          aspect_ratio: imageResult.aspectRatio,
          pixels: formatSpec?.pixels || "unknown",
          mime_type: imageResult.mimeType,
          prompt_used: variedPrompt,
        });
      }

      // Combine into variations
      for (let i = 0; i < num_variations; i++) {
        const imageIdx = needMultipleImages ? i : 0;
        const copyIdx = needMultipleCopies ? i : 0;

        variations.push({
          variation_id: `v${i + 1}`,
          creative_id: `crt_${timestamp}_${ad_format}_v${i + 1}`,
          format: ad_format,
          image: images[imageIdx],
          copy: copies[copyIdx],
          metadata: {
            product_name,
            target_audience: target_audience || null,
            tone,
            style,
            variation_strategy,
          },
        });
      }

      const variationsData = {
        campaign_id: campaign_id || null,
        num_variations,
        variation_strategy,
        variations,
      };

      const manifestPath = saveVariationsManifest(outputPath, variationsData);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                campaign_id: campaign_id || null,
                num_variations,
                variation_strategy,
                variations: variations.map((v) => ({
                  variation_id: v.variation_id,
                  image_file: v.image.filename,
                  headline: v.copy.headline,
                  primary_text: v.copy.primary_text,
                })),
                output_dir: outputPath,
                manifest_path: manifestPath,
              },
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
