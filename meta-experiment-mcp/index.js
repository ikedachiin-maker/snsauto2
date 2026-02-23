import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

import {
  getConfig,
  isConfigured,
  TEST_VARIABLES,
  TEST_OBJECTIVES,
  CONFIDENCE_LEVELS,
  DURATION,
  WINNER_ACTIONS,
  EXPERIMENT_INSIGHTS_FIELDS,
} from "./lib/config.js";
import { callMetaApi, getMetaApi } from "./lib/meta-api-client.js";
import {
  buildExperimentPayload,
  buildAdSetExperimentPayload,
  buildExperimentPlan,
} from "./lib/experiment-builder.js";
import { analyzeExperiment, generateDemoResults } from "./lib/stats-engine.js";
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
  name: "meta-experiment",
  version: "1.0.0",
});

// ── Tool 1: create_experiment ───────────────────────────────────────

server.tool(
  "create_experiment",
  "Create an A/B test experiment comparing 2-5 campaign or ad set variants. Defaults to dry_run=true. Returns experiment plan with API calls preview.",
  {
    name: z.string().describe("実験名（例: 'CTA比較テスト_2月'）"),
    description: z.string().optional().describe("テスト目的の説明"),
    test_variable: z
      .enum(["creative", "audience", "placement", "optimization", "bid_strategy", "landing_page"])
      .optional()
      .default("creative")
      .describe("テスト変数（何を比較するか）"),
    test_objective: z
      .enum(["cost_per_result", "ctr", "conversion_rate", "roas", "cpc", "cpm"])
      .optional()
      .default("cost_per_result")
      .describe("判定基準（何で勝敗を決めるか）"),
    level: z
      .enum(["campaign", "adset"])
      .optional()
      .default("campaign")
      .describe("テストレベル"),
    variant_ids: z
      .array(z.string())
      .describe("比較するキャンペーンIDまたは広告セットIDの配列（2-5個）"),
    campaign_id: z
      .string()
      .optional()
      .describe("親キャンペーンID（level=adsetの場合）"),
    duration_days: z
      .number()
      .min(4)
      .max(30)
      .optional()
      .default(7)
      .describe("テスト期間（4-30日、推奨7日）"),
    confidence_level: z
      .number()
      .optional()
      .default(90)
      .describe("信頼度レベル（65/80/90/95）"),
    daily_budget_per_variant: z
      .number()
      .optional()
      .describe("バリアントごとの日予算（通貨最小単位）"),
    dry_run: z
      .boolean()
      .optional()
      .default(true)
      .describe("true=プレビューモード（デフォルト）"),
  },
  async ({
    name,
    description,
    test_variable,
    test_objective,
    level,
    variant_ids,
    campaign_id,
    duration_days,
    confidence_level,
    daily_budget_per_variant,
    dry_run,
  }) => {
    try {
      if (variant_ids.length < 2 || variant_ids.length > 5) {
        throw new Error("バリアントは2-5個必要です");
      }

      // Build experiment plan
      const plan = buildExperimentPlan({
        name,
        test_variable,
        test_objective,
        variant_ids,
        level,
        duration_days,
        confidence_level,
        daily_budget_per_variant,
      });

      if (dry_run) {
        // Show what would be created
        let apiPreview;
        if (level === "campaign") {
          apiPreview = buildExperimentPayload({
            name,
            description,
            campaign_ids: variant_ids,
            duration_days,
            confidence_level,
          });
        } else {
          apiPreview = buildAdSetExperimentPayload({
            name,
            campaign_id,
            adset_ids: variant_ids,
            duration_days,
            confidence_level,
          });
        }

        const dryResult = await callMetaApi(apiPreview.endpoint, apiPreview.params, { dryRun: true });

        const output = {
          success: true,
          mode: "dry_run",
          experiment_plan: plan,
          test_variable_info: TEST_VARIABLES[test_variable],
          test_objective_info: TEST_OBJECTIVES[test_objective],
          confidence_info: CONFIDENCE_LEVELS[confidence_level] || CONFIDENCE_LEVELS[90],
          api_request: {
            endpoint: apiPreview.endpoint,
            params: apiPreview.params,
            meta: apiPreview.meta,
          },
          curl: dryResult.curl,
          note: "Set dry_run=false to create this experiment. Ensure META_ACCESS_TOKEN and META_AD_ACCOUNT_ID are set.",
        };

        const savedPath = saveOutput("experiment_plan", output);
        output.saved_to = savedPath;

        return {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        };
      }

      // Live: create experiment
      if (!isConfigured()) {
        throw new Error("META_ACCESS_TOKEN and META_AD_ACCOUNT_ID must be set for live execution.");
      }

      let payload;
      if (level === "campaign") {
        payload = buildExperimentPayload({
          name,
          description,
          campaign_ids: variant_ids,
          duration_days,
          confidence_level,
        });
      } else {
        payload = buildAdSetExperimentPayload({
          name,
          campaign_id,
          adset_ids: variant_ids,
          duration_days,
          confidence_level,
        });
      }

      const result = await callMetaApi(payload.endpoint, payload.params, { dryRun: false });

      const output = {
        success: true,
        mode: "live",
        experiment_id: result.id,
        experiment_plan: plan,
        result,
        note: `実験が作成されました。${duration_days}日後にget_experiment_resultsで結果を確認してください。`,
      };

      const savedPath = saveOutput("experiment_created", output);
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

// ── Tool 2: list_experiments ────────────────────────────────────────

server.tool(
  "list_experiments",
  "List all A/B test experiments in the ad account. Shows status, duration, and variants for each experiment.",
  {
    status_filter: z
      .enum(["all", "active", "completed", "scheduled"])
      .optional()
      .default("all")
      .describe("ステータスフィルタ"),
  },
  async ({ status_filter }) => {
    try {
      if (!isConfigured()) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              mode: "dry_run",
              message: "META_ACCESS_TOKEN と META_AD_ACCOUNT_ID を設定するとアカウントの実験一覧を取得できます。",
              api_endpoint: `act_${getConfig().adAccountId}/experiments`,
              available_test_variables: TEST_VARIABLES,
              available_test_objectives: TEST_OBJECTIVES,
              confidence_levels: CONFIDENCE_LEVELS,
              duration_constraints: DURATION,
            }, null, 2),
          }],
        };
      }

      const config = getConfig();
      const result = await getMetaApi(
        `act_${config.adAccountId}/experiments`,
        { fields: "name,description,start_time,end_time,status,cells,winner_cell" },
        { dryRun: false }
      );

      let experiments = result.data || [];

      if (status_filter !== "all") {
        const statusMap = {
          active: "ACTIVE",
          completed: "COMPLETED",
          scheduled: "SCHEDULED",
        };
        experiments = experiments.filter((e) => e.status === statusMap[status_filter]);
      }

      const output = {
        success: true,
        mode: "live",
        total: experiments.length,
        filter: status_filter,
        experiments: experiments.map((e) => ({
          id: e.id,
          name: e.name,
          status: e.status,
          start_time: e.start_time,
          end_time: e.end_time,
          cells: e.cells,
          winner_cell: e.winner_cell || null,
        })),
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

// ── Tool 3: get_experiment_results ──────────────────────────────────

server.tool(
  "get_experiment_results",
  "Get detailed results for a specific experiment. Fetches insights per variant and performs statistical analysis. Use sample_data for dry_run testing.",
  {
    experiment_id: z
      .string()
      .optional()
      .describe("実験ID（live取得用。省略時はデモデータを使用）"),
    test_objective: z
      .enum(["cost_per_result", "ctr", "conversion_rate", "roas", "cpc", "cpm"])
      .optional()
      .default("cost_per_result")
      .describe("判定基準メトリクス"),
    confidence_level: z
      .number()
      .optional()
      .default(90)
      .describe("信頼度レベル"),
    sample_data: z
      .array(z.object({
        id: z.string().optional(),
        name: z.string(),
        spend: z.string(),
        impressions: z.string(),
        clicks: z.string(),
        conversions: z.number().optional(),
        ctr: z.string().optional(),
        cpc: z.string().optional(),
        cpa: z.string().optional(),
        roas: z.string().optional(),
        actions: z.array(z.object({
          action_type: z.string(),
          value: z.string(),
        })).optional(),
        cost_per_action_type: z.array(z.object({
          action_type: z.string(),
          value: z.string(),
        })).optional(),
        purchase_roas: z.array(z.object({
          value: z.string(),
        })).optional(),
      }))
      .optional()
      .describe("テスト用サンプルデータ（省略時はデモデータ）"),
  },
  async ({ experiment_id, test_objective, confidence_level, sample_data }) => {
    try {
      let variantData;

      if (sample_data && sample_data.length > 0) {
        variantData = sample_data;
      } else if (experiment_id && isConfigured()) {
        // Fetch experiment details
        const experiment = await getMetaApi(
          experiment_id,
          { fields: "name,description,status,start_time,end_time,cells,winner_cell" },
          { dryRun: false }
        );

        // Fetch insights for each cell's campaigns/adsets
        const cells = experiment.cells || [];
        variantData = [];

        for (const cell of cells) {
          const campaignIds = (cell.campaigns || []).map((c) => c.campaign_id);
          const adsetIds = (cell.adsets || []).map((a) => a.adset_id);
          const targetId = campaignIds[0] || adsetIds[0];

          if (targetId) {
            const insights = await getMetaApi(
              `${targetId}/insights`,
              {
                fields: EXPERIMENT_INSIGHTS_FIELDS,
                date_preset: "maximum",
              },
              { dryRun: false }
            );

            const row = insights.data?.[0] || {};
            variantData.push({
              id: targetId,
              name: cell.name || `Cell ${cells.indexOf(cell)}`,
              ...row,
            });
          }
        }
      } else {
        // Demo data
        variantData = generateDemoResults(3, test_objective);
      }

      if (variantData.length < 2) {
        throw new Error("分析には最低2つのバリアントデータが必要です");
      }

      // Run statistical analysis
      const analysis = analyzeExperiment(variantData, test_objective, confidence_level);

      const output = {
        success: true,
        mode: experiment_id && isConfigured() ? "live" : "demo",
        experiment_id: experiment_id || "demo",
        data_source: sample_data ? "sample_data" : experiment_id ? "meta_api" : "demo_data",
        analysis,
      };

      const savedPath = saveOutput("experiment_results", output);
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

// ── Tool 4: end_experiment ──────────────────────────────────────────

server.tool(
  "end_experiment",
  "End an active A/B test experiment. Optionally apply winner actions (scale budget, pause losers). Defaults to dry_run=true.",
  {
    experiment_id: z.string().describe("終了する実験ID"),
    winner_action: z
      .enum(["scale_budget", "pause_losers", "apply_and_end", "report_only"])
      .optional()
      .default("report_only")
      .describe("勝者に対するアクション"),
    winner_id: z
      .string()
      .optional()
      .describe("勝者バリアントのキャンペーン/AdSet ID（scale_budget/apply_and_end時に必要）"),
    loser_ids: z
      .array(z.string())
      .optional()
      .describe("敗者バリアントのID配列（pause_losers時に使用）"),
    scale_percent: z
      .number()
      .optional()
      .default(50)
      .describe("勝者の予算増額率（%）"),
    dry_run: z
      .boolean()
      .optional()
      .default(true)
      .describe("true=プレビューモード（デフォルト）"),
  },
  async ({ experiment_id, winner_action, winner_id, loser_ids, scale_percent, dry_run }) => {
    try {
      const actionDef = WINNER_ACTIONS[winner_action];
      const actions = [];

      // Step 1: End the experiment
      actions.push({
        step: 1,
        action: "end_experiment",
        description: "実験を終了",
        ...(await callMetaApi(`${experiment_id}/end`, {}, { dryRun: dry_run })),
      });

      // Step 2: Apply winner actions
      if (winner_action === "scale_budget" && winner_id) {
        // Scale winner budget
        actions.push({
          step: 2,
          action: "scale_winner",
          description: `勝者の予算を${scale_percent}%増額`,
          note: "現在の予算を取得してから増額します",
          ...(await callMetaApi(winner_id, {
            daily_budget: `<current_budget * ${1 + scale_percent / 100}>`,
          }, { dryRun: true })), // Always preview the budget change
        });

        // Pause losers
        if (loser_ids && loser_ids.length > 0) {
          for (const loserId of loser_ids) {
            actions.push({
              step: actions.length + 1,
              action: "pause_loser",
              description: `敗者 ${loserId} を停止`,
              ...(await callMetaApi(loserId, { status: "PAUSED" }, { dryRun: dry_run })),
            });
          }
        }
      } else if (winner_action === "pause_losers" && loser_ids) {
        for (const loserId of loser_ids) {
          actions.push({
            step: actions.length + 1,
            action: "pause_loser",
            description: `敗者 ${loserId} を停止`,
            ...(await callMetaApi(loserId, { status: "PAUSED" }, { dryRun: dry_run })),
          });
        }
      } else if (winner_action === "apply_and_end" && winner_id) {
        actions.push({
          step: 2,
          action: "activate_winner",
          description: "勝者を有効化（他は自動停止）",
          ...(await callMetaApi(winner_id, { status: "ACTIVE" }, { dryRun: dry_run })),
        });
      }

      const output = {
        success: true,
        mode: dry_run ? "dry_run" : "live",
        experiment_id,
        winner_action: actionDef,
        actions,
        note: dry_run
          ? "Set dry_run=false to execute these actions."
          : "実験終了とアクションが適用されました。",
      };

      const savedPath = saveOutput("experiment_ended", output);
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

// ── Tool 5: analyze_winner ──────────────────────────────────────────

server.tool(
  "analyze_winner",
  "Analyze variant performance data to determine A/B test winner with statistical significance. Works entirely offline with provided data - no API access needed.",
  {
    variants: z
      .array(z.object({
        name: z.string().describe("バリアント名（例: 'Variant A'）"),
        spend: z.number().describe("消費額"),
        impressions: z.number().describe("インプレッション数"),
        clicks: z.number().describe("クリック数"),
        conversions: z.number().optional().default(0).describe("コンバージョン数"),
        revenue: z.number().optional().default(0).describe("売上額"),
      }))
      .describe("比較するバリアントデータ（2-5個）"),
    test_objective: z
      .enum(["cost_per_result", "ctr", "conversion_rate", "roas", "cpc", "cpm"])
      .optional()
      .default("cost_per_result")
      .describe("判定基準"),
    confidence_level: z
      .number()
      .optional()
      .default(90)
      .describe("信頼度レベル（65/80/90/95）"),
  },
  async ({ variants, test_objective, confidence_level }) => {
    try {
      if (variants.length < 2 || variants.length > 5) {
        throw new Error("バリアントは2-5個必要です");
      }

      // Convert simple input to full variant format
      const fullVariants = variants.map((v, i) => {
        const cpa = v.conversions > 0 ? v.spend / v.conversions : 0;
        const roas = v.spend > 0 && v.revenue > 0 ? v.revenue / v.spend : 0;

        return {
          id: `variant_${String.fromCharCode(97 + i)}`,
          name: v.name,
          spend: v.spend.toString(),
          impressions: v.impressions.toString(),
          clicks: v.clicks.toString(),
          conversions: v.conversions || 0,
          ctr: ((v.clicks / v.impressions) * 100).toFixed(2),
          cpc: v.clicks > 0 ? (v.spend / v.clicks).toFixed(2) : "0",
          cpm: v.impressions > 0 ? ((v.spend / v.impressions) * 1000).toFixed(2) : "0",
          cpa: cpa.toFixed(2),
          roas: roas.toFixed(2),
        };
      });

      const analysis = analyzeExperiment(fullVariants, test_objective, confidence_level);

      const output = {
        success: true,
        mode: "offline_analysis",
        test_objective_info: TEST_OBJECTIVES[test_objective],
        confidence_info: CONFIDENCE_LEVELS[confidence_level] || CONFIDENCE_LEVELS[90],
        analysis,
      };

      const savedPath = saveOutput("winner_analysis", output);
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
