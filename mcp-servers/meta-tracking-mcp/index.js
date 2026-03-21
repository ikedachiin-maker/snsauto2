import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

import {
  getConfig,
  isConfigured,
  STANDARD_EVENTS,
  USER_DATA_FIELDS,
  ACTION_SOURCES,
  DATA_PROCESSING_OPTIONS,
} from "./lib/config.js";
import { sendEvents, getEventDiagnostics, getPixelStats } from "./lib/capi-client.js";
import {
  buildEvent,
  generateEventId,
  validateEventQuality,
} from "./lib/event-builder.js";
import {
  generatePixelBaseCode,
  generateEventCode,
  generateDedupSnippet,
  generateCapiHandler,
  generateGtmTag,
} from "./lib/pixel-helper.js";
import { formatError } from "./lib/errors.js";

// ── Output ──────────────────────────────────────────────────────────

const OUTPUT_DIR = join(import.meta.dirname, "output");

function saveOutput(name, data) {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const filePath = join(OUTPUT_DIR, `${name}_${ts}.json`);
  writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  return filePath;
}

// ── MCP Server ──────────────────────────────────────────────────────

const server = new McpServer({
  name: "meta-tracking",
  version: "1.0.0",
});

// ── Tool 1: setup_check ─────────────────────────────────────────────

server.tool(
  "setup_check",
  "Check Meta Pixel and Conversions API configuration. Shows environment variables, Pixel status, and available events.",
  {},
  async () => {
    const config = getConfig();
    const configured = isConfigured();

    const status = {
      environment: {
        META_ACCESS_TOKEN: config.accessToken
          ? `Set (${config.accessToken.slice(0, 8)}...)`
          : "NOT SET",
        META_PIXEL_ID: config.pixelId || "NOT SET",
        META_TEST_EVENT_CODE: config.testEventCode || "NOT SET (optional)",
      },
      configured,
      standard_events: Object.entries(STANDARD_EVENTS).map(([name, def]) => ({
        event_name: name,
        label: def.label,
        required_params: def.required_params,
      })),
      user_data_fields: Object.entries(USER_DATA_FIELDS).map(([key, def]) => ({
        key,
        label: def.label,
        needs_hash: def.hash,
      })),
      action_sources: ACTION_SOURCES,
    };

    // If configured, fetch Pixel info
    if (configured) {
      try {
        const pixelInfo = await getPixelStats({ dryRun: false });
        status.pixel_info = pixelInfo;
      } catch (error) {
        status.pixel_info = { error: formatError(error) };
      }
    } else {
      status.pixel_info = {
        skipped: true,
        message: "Set META_ACCESS_TOKEN and META_PIXEL_ID to check Pixel status. All tools work in dry_run mode without these.",
      };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(status, null, 2) }],
    };
  }
);

// ── Tool 2: send_event ──────────────────────────────────────────────

server.tool(
  "send_event",
  "Send a single conversion event via Conversions API (CAPI). Supports all standard Meta events with user data hashing and event quality validation. Defaults to dry_run=true.",
  {
    event_name: z
      .string()
      .describe("イベント名（Purchase, Lead, ViewContent等のMeta標準イベント、またはカスタムイベント名）"),
    user_data: z
      .object({
        em: z.string().optional().describe("メールアドレス（自動SHA-256ハッシュ）"),
        ph: z.string().optional().describe("電話番号（自動SHA-256ハッシュ）"),
        external_id: z.string().optional().describe("外部ユーザーID"),
        client_ip_address: z.string().optional().describe("IPアドレス"),
        client_user_agent: z.string().optional().describe("ユーザーエージェント"),
        fbc: z.string().optional().describe("Facebookクリックパラメータ（_fbc cookie）"),
        fbp: z.string().optional().describe("Facebookブラウザパラメータ（_fbp cookie）"),
        fn: z.string().optional().describe("名"),
        ln: z.string().optional().describe("姓"),
        country: z.string().optional().describe("国コード（jp等）"),
      })
      .optional()
      .default({})
      .describe("ユーザーデータ（PII自動ハッシュ対応）"),
    custom_data: z
      .object({
        value: z.number().optional().describe("金額"),
        currency: z.string().optional().describe("通貨コード（JPY, USD）"),
        content_ids: z.array(z.string()).optional().describe("商品ID配列"),
        content_type: z.string().optional().describe("product or product_group"),
        content_name: z.string().optional().describe("コンテンツ名"),
        content_category: z.string().optional().describe("カテゴリ"),
        num_items: z.number().optional().describe("アイテム数"),
        order_id: z.string().optional().describe("注文ID"),
        search_string: z.string().optional().describe("検索キーワード"),
        predicted_ltv: z.number().optional().describe("予測LTV"),
      })
      .optional()
      .default({})
      .describe("カスタムデータ（購入額、商品ID等）"),
    event_source_url: z
      .string()
      .optional()
      .describe("イベント発生URL"),
    action_source: z
      .enum(["website", "app", "phone_call", "chat", "email", "physical_store", "system_generated", "other"])
      .optional()
      .default("website")
      .describe("アクションソース"),
    event_id: z
      .string()
      .optional()
      .describe("イベントID（Pixelとの重複排除用。省略時は自動生成）"),
    test_mode: z
      .boolean()
      .optional()
      .default(false)
      .describe("true=テストモード（Events Managerのテストイベントに表示）"),
    dry_run: z
      .boolean()
      .optional()
      .default(true)
      .describe("true=プレビューモード（デフォルト）"),
  },
  async ({ event_name, user_data, custom_data, event_source_url, action_source, event_id, test_mode, dry_run }) => {
    try {
      const event = buildEvent({
        event_name,
        event_id,
        event_source_url,
        action_source,
        user_data,
        custom_data,
      });

      // Validate quality
      const quality = validateEventQuality(event);

      const result = await sendEvents([event], { dryRun: dry_run, testMode: test_mode });

      const eventDef = STANDARD_EVENTS[event_name];
      const output = {
        success: true,
        mode: dry_run ? "dry_run" : "live",
        event: {
          event_name,
          event_id: event.event_id,
          is_standard: !!eventDef,
          label: eventDef?.label || "カスタムイベント",
        },
        quality,
        result,
        dedup_note: `Pixelからも同じevent_id "${event.event_id}" で送信すると自動重複排除されます。`,
      };

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

// ── Tool 3: send_batch_events ───────────────────────────────────────

server.tool(
  "send_batch_events",
  "Send multiple conversion events in a single CAPI batch call (max 1000 events). Efficient for bulk data upload or historical backfill. Defaults to dry_run=true.",
  {
    events: z
      .array(z.object({
        event_name: z.string(),
        event_time: z.number().optional().describe("UNIXタイムスタンプ（秒）"),
        event_id: z.string().optional(),
        event_source_url: z.string().optional(),
        action_source: z.string().optional().default("website"),
        user_data: z.object({
          em: z.string().optional(),
          ph: z.string().optional(),
          external_id: z.string().optional(),
          client_ip_address: z.string().optional(),
          client_user_agent: z.string().optional(),
          fbc: z.string().optional(),
          fbp: z.string().optional(),
        }).optional().default({}),
        custom_data: z.object({
          value: z.number().optional(),
          currency: z.string().optional(),
          content_ids: z.array(z.string()).optional(),
          content_type: z.string().optional(),
          order_id: z.string().optional(),
        }).optional().default({}),
      }))
      .describe("イベント配列（最大1000件）"),
    test_mode: z
      .boolean()
      .optional()
      .default(false),
    dry_run: z
      .boolean()
      .optional()
      .default(true),
  },
  async ({ events, test_mode, dry_run }) => {
    try {
      if (events.length > 1000) {
        throw new Error("バッチ上限は1000件です。分割して送信してください。");
      }

      // Build events
      const builtEvents = events.map((e) => buildEvent(e));

      // Validate quality for first few
      const qualitySample = builtEvents.slice(0, 3).map((e) => ({
        event_name: e.event_name,
        event_id: e.event_id,
        quality: validateEventQuality(e),
      }));

      const result = await sendEvents(builtEvents, { dryRun: dry_run, testMode: test_mode });

      const output = {
        success: true,
        mode: dry_run ? "dry_run" : "live",
        batch_size: builtEvents.length,
        event_summary: Object.entries(
          builtEvents.reduce((acc, e) => {
            acc[e.event_name] = (acc[e.event_name] || 0) + 1;
            return acc;
          }, {})
        ).map(([name, count]) => ({ event_name: name, count })),
        quality_sample: qualitySample,
        result,
      };

      const savedPath = saveOutput("batch_events", output);
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

// ── Tool 4: get_pixel_code ──────────────────────────────────────────

server.tool(
  "get_pixel_code",
  "Generate Meta Pixel installation code, event tracking snippets, and CAPI deduplication setup. No API access needed - works entirely offline.",
  {
    pixel_id: z
      .string()
      .optional()
      .describe("Pixel ID（省略時は環境変数から取得）"),
    include: z
      .array(z.enum(["base_code", "event_snippets", "dedup_snippets", "capi_handler", "gtm_tag"]))
      .optional()
      .default(["base_code", "event_snippets", "dedup_snippets"])
      .describe("生成するコード種別"),
    events: z
      .array(z.string())
      .optional()
      .default(["Purchase", "Lead", "ViewContent", "AddToCart"])
      .describe("トラッキングするイベント名"),
  },
  async ({ pixel_id, include, events }) => {
    try {
      const pid = pixel_id || getConfig().pixelId || "<YOUR_PIXEL_ID>";
      const output = { pixel_id: pid, code_snippets: {} };

      if (include.includes("base_code")) {
        output.code_snippets.base_code = {
          description: "HTMLの<head>タグ内に設置するベースコード",
          code: generatePixelBaseCode(pid),
        };
      }

      if (include.includes("event_snippets")) {
        output.code_snippets.event_snippets = events.map((eventName) => {
          const eventDef = STANDARD_EVENTS[eventName];
          const exampleParams = {};
          if (eventName === "Purchase") {
            exampleParams.value = 3980;
            exampleParams.currency = "JPY";
          } else if (eventName === "ViewContent") {
            exampleParams.content_ids = ["product_123"];
            exampleParams.content_type = "product";
          }

          return {
            event_name: eventName,
            label: eventDef?.label || "カスタム",
            code: generateEventCode(eventName, exampleParams),
            with_dedup: generateEventCode(eventName, exampleParams, generateEventId()),
          };
        });
      }

      if (include.includes("dedup_snippets")) {
        output.code_snippets.dedup_snippets = {
          description: "Pixel + CAPI 重複排除の完全実装例",
          events: events.slice(0, 3).map((eventName) => {
            const params = eventName === "Purchase"
              ? { value: 3980, currency: "JPY" }
              : {};
            return {
              event_name: eventName,
              code: generateDedupSnippet(eventName, params),
            };
          }),
        };
      }

      if (include.includes("capi_handler")) {
        output.code_snippets.capi_handler = {
          description: "サーバーサイドCAPIハンドラ（Node.js/Express例）",
          code: generateCapiHandler(pid),
        };
      }

      if (include.includes("gtm_tag")) {
        output.code_snippets.gtm_tag = {
          description: "GTMカスタムHTMLタグ（サーバーサイドGTM連携）",
          code: generateGtmTag(pid),
        };
      }

      output.implementation_guide = {
        step_1: "base_codeを全ページの<head>に設置",
        step_2: "購入・リード等のイベントポイントにevent_snippetsを設置",
        step_3: "dedup_snippetsでPixel+CAPI両方から同一event_idで送信",
        step_4: "capi_handlerをサーバーにデプロイ（Node.js/Cloud Functions/Lambda）",
        step_5: "Events Managerでイベント受信を確認",
        important: "event_idの一致が重複排除の鍵。Pixel側とCAPI側で同じIDを使用すること。",
      };

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

// ── Tool 5: get_event_diagnostics ───────────────────────────────────

server.tool(
  "get_event_diagnostics",
  "Get Pixel and CAPI event diagnostics from Events Manager. Shows event match quality, deduplication status, and issues. Requires API access.",
  {
    dry_run: z
      .boolean()
      .optional()
      .default(true)
      .describe("true=プレビューモード（デフォルト）"),
  },
  async ({ dry_run }) => {
    try {
      if (!isConfigured() || dry_run) {
        // Show demo diagnostics + API preview
        const diagnosticsPreview = await getEventDiagnostics({ dryRun: true });
        const pixelPreview = await getPixelStats({ dryRun: true });

        const output = {
          success: true,
          mode: "dry_run",
          api_requests: {
            diagnostics: diagnosticsPreview,
            pixel_stats: pixelPreview,
          },
          demo_diagnostics: {
            events_overview: [
              { event_name: "Purchase", browser_count: 150, server_count: 180, dedup_count: 185, match_rate: "81%" },
              { event_name: "Lead", browser_count: 320, server_count: 350, dedup_count: 360, match_rate: "76%" },
              { event_name: "ViewContent", browser_count: 5200, server_count: 5800, dedup_count: 6000, match_rate: "72%" },
              { event_name: "AddToCart", browser_count: 800, server_count: 900, dedup_count: 920, match_rate: "74%" },
            ],
            quality_indicators: {
              event_match_quality: 7.2,
              grade: "Good",
              deduplication_active: true,
              pixel_firing: true,
              capi_active: true,
            },
            common_issues: [
              {
                severity: "warning",
                message: "一部イベントでevent_idが未設定。重複排除が機能していません。",
                fix: "Pixel送信時にeventIDオプション、CAPI送信時にevent_idパラメータを設定してください。",
              },
              {
                severity: "info",
                message: "client_ip_addressが一部イベントで未設定。",
                fix: "サーバーサイドでリクエスト元IPをuser_data.client_ip_addressに設定してください。",
              },
            ],
          },
          note: "META_ACCESS_TOKEN and META_PIXEL_ID を設定すると実際の診断データを取得できます。",
        };

        return {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        };
      }

      // Live: fetch real diagnostics
      const [diagnostics, pixelInfo] = await Promise.all([
        getEventDiagnostics({ dryRun: false }),
        getPixelStats({ dryRun: false }),
      ]);

      const output = {
        success: true,
        mode: "live",
        pixel: pixelInfo,
        diagnostics: diagnostics.data || diagnostics,
      };

      const savedPath = saveOutput("diagnostics", output);
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

// ── Start ────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
