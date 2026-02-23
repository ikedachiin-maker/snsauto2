import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

import {
  getConfig,
  isConfigured,
  ODAX_OBJECTIVES,
  CTA_MAP,
  DEFAULTS,
  API_VERSION,
  GRAPH_API_BASE,
} from "./lib/config.js";
import { callMetaApi, getMetaApi } from "./lib/meta-api-client.js";
import {
  buildCampaignPayload,
  buildAdSetPayload,
  buildImageUploadPayload,
  buildAdCreativePayload,
  buildAdPayload,
  buildFullCampaignPlan,
} from "./lib/campaign-builder.js";
import { readCreativeJson } from "./lib/creative-reader.js";
import { formatError } from "./lib/errors.js";

// ── Output Manager ──────────────────────────────────────────────────

const OUTPUT_DIR = join(import.meta.dirname, "output");

function saveResult(campaignName, data) {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const dir = join(OUTPUT_DIR, campaignName || "_unnamed");
  mkdirSync(dir, { recursive: true });
  const filePath = join(dir, `${ts}.json`);
  writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  return filePath;
}

// ── MCP Server ──────────────────────────────────────────────────────

const server = new McpServer({
  name: "meta-campaign",
  version: "1.0.0",
});

// ── Tool 1: setup_check ─────────────────────────────────────────────

server.tool(
  "setup_check",
  "Check Meta API authentication and permissions. Shows which environment variables are configured and tests API connectivity.",
  {},
  async () => {
    const config = getConfig();
    const configured = isConfigured();

    const status = {
      api_version: API_VERSION,
      graph_api_base: GRAPH_API_BASE,
      environment: {
        META_ACCESS_TOKEN: config.accessToken
          ? `Set (${config.accessToken.slice(0, 8)}...)`
          : "NOT SET",
        META_AD_ACCOUNT_ID: config.adAccountId || "NOT SET",
        META_PAGE_ID: config.pageId || "NOT SET",
      },
      configured,
      available_objectives: Object.entries(ODAX_OBJECTIVES).map(([k, v]) => ({
        key: k,
        api_value: v.objective,
        description: v.description,
      })),
      available_cta_types: Object.keys(CTA_MAP),
      defaults: DEFAULTS,
    };

    // If configured, test API connectivity
    if (configured) {
      try {
        const result = await getMetaApi(
          `act_${config.adAccountId}`,
          { fields: "name,account_status,currency,timezone_name" },
          { dryRun: false }
        );
        status.api_test = {
          success: true,
          account: result,
        };
      } catch (error) {
        status.api_test = {
          success: false,
          error: formatError(error),
        };
      }
    } else {
      status.api_test = {
        skipped: true,
        message:
          "Set META_ACCESS_TOKEN, META_AD_ACCOUNT_ID, and META_PAGE_ID to enable live API calls. " +
          "All mutation tools work in dry_run mode without these.",
      };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(status, null, 2) }],
    };
  }
);

// ── Tool 2: create_campaign ─────────────────────────────────────────

server.tool(
  "create_campaign",
  "Create a single Meta Ads campaign. Defaults to dry_run=true (preview mode). Campaign is created in PAUSED status.",
  {
    name: z.string().describe("キャンペーン名"),
    objective: z
      .enum(["sales", "leads", "awareness", "traffic", "engagement", "app_promotion"])
      .optional()
      .default("sales")
      .describe("ODAX目的"),
    daily_budget_cents: z
      .number()
      .optional()
      .describe("日予算（通貨最小単位: JPY=円, USD=セント）"),
    special_ad_categories: z
      .array(z.enum(["CREDIT", "EMPLOYMENT", "HOUSING", "ISSUES_ELECTIONS_POLITICS"]))
      .optional()
      .default([])
      .describe("特別広告カテゴリ"),
    smart_promotion_type: z
      .enum(["GUIDED_CREATION", "SMART_APP_PROMOTION"])
      .optional()
      .describe("Advantage+ キャンペーンタイプ"),
    dry_run: z
      .boolean()
      .optional()
      .default(true)
      .describe("true=APIを呼ばずリクエスト内容をプレビュー（デフォルト）"),
  },
  async ({ name, objective, daily_budget_cents, special_ad_categories, smart_promotion_type, dry_run }) => {
    try {
      const { endpoint, params } = buildCampaignPayload({
        name,
        objective,
        daily_budget_cents,
        special_ad_categories,
        smart_promotion_type,
      });

      const result = await callMetaApi(endpoint, params, { dryRun: dry_run });

      const output = {
        success: true,
        mode: dry_run ? "dry_run" : "live",
        objective: ODAX_OBJECTIVES[objective],
        result,
      };

      if (!dry_run && result.id) {
        output.campaign_id = result.id;
        output.note = "Campaign created in PAUSED status. Use set_campaign_status to activate.";
      }

      return {
        content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${formatError(error)}` }],
        isError: true,
      };
    }
  }
);

// ── Tool 3: create_full_campaign ────────────────────────────────────

server.tool(
  "create_full_campaign",
  "Create a complete Meta campaign from a Module 1 creative.json file. Executes: Image Upload → Campaign → Ad Set → Ad Creative → Ad. Defaults to dry_run=true.",
  {
    creative_json_path: z
      .string()
      .describe("Module 1が出力したcreative.jsonのパス"),
    campaign_name: z.string().optional().describe("キャンペーン名"),
    objective: z
      .enum(["sales", "leads", "awareness", "traffic", "engagement", "app_promotion"])
      .optional()
      .default("sales"),
    daily_budget_cents: z
      .number()
      .optional()
      .describe("日予算（通貨最小単位）"),
    link_url: z
      .string()
      .optional()
      .default("https://example.com")
      .describe("広告リンク先URL"),
    targeting: z
      .object({
        geo_locations: z.object({
          countries: z.array(z.string()).optional(),
          cities: z.array(z.object({ key: z.string() })).optional(),
        }).optional(),
        age_min: z.number().optional(),
        age_max: z.number().optional(),
        genders: z.array(z.number()).optional(),
      })
      .optional()
      .describe("ターゲティング設定（省略時はAdvantage+自動）"),
    creative_index: z
      .number()
      .optional()
      .default(0)
      .describe("creative.json内のクリエイティブindex（0始まり）"),
    dry_run: z
      .boolean()
      .optional()
      .default(true)
      .describe("true=プレビューモード（デフォルト）"),
  },
  async ({
    creative_json_path,
    campaign_name,
    objective,
    daily_budget_cents,
    link_url,
    targeting,
    creative_index,
    dry_run,
  }) => {
    try {
      // Read creative.json from Module 1
      const creativeData = readCreativeJson(creative_json_path);
      const creative = creativeData.creatives[creative_index];
      if (!creative) {
        throw new Error(
          `Creative index ${creative_index} not found. Available: 0-${creativeData.creatives.length - 1}`
        );
      }

      const cName = campaign_name || `Campaign_${creative.creative_id}`;

      // DRY RUN: Show the full execution plan
      if (dry_run) {
        const plan = buildFullCampaignPlan({
          creative,
          campaign_name: cName,
          objective,
          daily_budget_cents,
          link_url,
          targeting,
        });

        // Generate curl commands for each step
        const stepsWithCurl = [];
        for (const step of plan) {
          const apiResult = await callMetaApi(step.endpoint, step.params, {
            dryRun: true,
            method: step.params._files ? "POST" : "POST",
          });
          stepsWithCurl.push({
            step: step.step,
            action: step.action,
            endpoint: step.endpoint,
            params: step.params,
            curl: apiResult.curl,
          });
        }

        const output = {
          success: true,
          mode: "dry_run",
          creative_source: creativeData.source_path,
          creative_used: {
            id: creative.creative_id,
            format: creative.format,
            headline: creative.copy.headline,
            primary_text: creative.copy.primary_text.slice(0, 80) + "...",
            image_path: creative.image.path,
            image_exists: creative.image.exists,
          },
          execution_plan: stepsWithCurl,
          note: "Set dry_run=false to execute these API calls. Ensure META_ACCESS_TOKEN, META_AD_ACCOUNT_ID, and META_PAGE_ID are set.",
        };

        const savedPath = saveResult(cName, output);
        output.saved_to = savedPath;

        return {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        };
      }

      // LIVE EXECUTION: Run steps sequentially
      if (!isConfigured()) {
        throw new Error(
          "META_ACCESS_TOKEN, META_AD_ACCOUNT_ID, and META_PAGE_ID must be set for live execution."
        );
      }

      const results = { steps: [], ids: {} };

      // Step 1: Upload image
      const imgPayload = buildImageUploadPayload({ image_path: creative.image.path });
      const imgResult = await callMetaApi(imgPayload.endpoint, imgPayload.params, { dryRun: false });
      const imageHash = Object.values(imgResult.images || {})[0]?.hash;
      results.steps.push({ step: 1, action: "upload_image", result: imgResult });
      results.ids.image_hash = imageHash;

      // Step 2: Create campaign
      const campPayload = buildCampaignPayload({
        name: cName,
        objective,
        daily_budget_cents,
      });
      const campResult = await callMetaApi(campPayload.endpoint, campPayload.params, { dryRun: false });
      results.steps.push({ step: 2, action: "create_campaign", result: campResult });
      results.ids.campaign_id = campResult.id;

      // Step 3: Create ad set
      const adsetPayload = buildAdSetPayload({
        campaign_id: campResult.id,
        name: `AdSet_${creative.creative_id}`,
        objective,
        targeting,
      });
      const adsetResult = await callMetaApi(adsetPayload.endpoint, adsetPayload.params, { dryRun: false });
      results.steps.push({ step: 3, action: "create_adset", result: adsetResult });
      results.ids.adset_id = adsetResult.id;

      // Step 4: Create ad creative
      const acPayload = buildAdCreativePayload({
        name: `Creative_${creative.creative_id}`,
        image_hash: imageHash,
        headline: creative.copy.headline,
        primary_text: creative.copy.primary_text,
        description: creative.copy.description,
        cta_type: creative.copy.cta_type,
        link_url,
      });
      const acResult = await callMetaApi(acPayload.endpoint, acPayload.params, { dryRun: false });
      results.steps.push({ step: 4, action: "create_adcreative", result: acResult });
      results.ids.adcreative_id = acResult.id;

      // Step 5: Create ad
      const adPayload = buildAdPayload({
        name: `Ad_${creative.creative_id}`,
        adset_id: adsetResult.id,
        creative_id: acResult.id,
      });
      const adResult = await callMetaApi(adPayload.endpoint, adPayload.params, { dryRun: false });
      results.steps.push({ step: 5, action: "create_ad", result: adResult });
      results.ids.ad_id = adResult.id;

      const output = {
        success: true,
        mode: "live",
        ids: results.ids,
        steps: results.steps,
        note: "All objects created in PAUSED status. Use set_campaign_status to activate.",
      };

      const savedPath = saveResult(cName, output);
      output.saved_to = savedPath;

      return {
        content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${formatError(error)}` }],
        isError: true,
      };
    }
  }
);

// ── Tool 4: get_campaign_status ─────────────────────────────────────

server.tool(
  "get_campaign_status",
  "Get the status and key metrics of a Meta campaign, ad set, or ad by ID.",
  {
    object_id: z.string().describe("キャンペーン/広告セット/広告のID"),
    object_type: z
      .enum(["campaign", "adset", "ad"])
      .optional()
      .default("campaign")
      .describe("オブジェクトタイプ"),
    fields: z
      .string()
      .optional()
      .describe("取得フィールド（カンマ区切り）"),
  },
  async ({ object_id, object_type, fields }) => {
    try {
      if (!isConfigured()) {
        throw new Error(
          "META_ACCESS_TOKEN is required to fetch campaign status. " +
          "Set it in environment variables."
        );
      }

      const defaultFields = {
        campaign:
          "name,status,objective,daily_budget,lifetime_budget,bid_strategy,created_time,updated_time,effective_status",
        adset:
          "name,status,campaign_id,optimization_goal,daily_budget,billing_event,targeting,created_time,effective_status",
        ad: "name,status,adset_id,creative,created_time,effective_status",
      };

      const result = await getMetaApi(
        object_id,
        { fields: fields || defaultFields[object_type] },
        { dryRun: false }
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { success: true, object_type, data: result },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${formatError(error)}` }],
        isError: true,
      };
    }
  }
);

// ── Tool 5: set_campaign_status ─────────────────────────────────────

server.tool(
  "set_campaign_status",
  "Pause or activate a Meta campaign, ad set, or ad. Defaults to dry_run=true.",
  {
    object_id: z.string().describe("キャンペーン/広告セット/広告のID"),
    status: z
      .enum(["ACTIVE", "PAUSED"])
      .describe("新しいステータス"),
    object_type: z
      .enum(["campaign", "adset", "ad"])
      .optional()
      .default("campaign")
      .describe("オブジェクトタイプ"),
    dry_run: z
      .boolean()
      .optional()
      .default(true)
      .describe("true=プレビューモード（デフォルト）"),
  },
  async ({ object_id, status, object_type, dry_run }) => {
    try {
      const result = await callMetaApi(
        object_id,
        { status },
        { dryRun: dry_run }
      );

      const output = {
        success: true,
        mode: dry_run ? "dry_run" : "live",
        object_id,
        object_type,
        new_status: status,
        result,
      };

      if (!dry_run) {
        output.note =
          status === "ACTIVE"
            ? "Object is now active. Ads will start delivering based on budget and schedule."
            : "Object is now paused. No further spend will occur.";
      }

      return {
        content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${formatError(error)}` }],
        isError: true,
      };
    }
  }
);

// ── Start ────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
