import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

import {
  getConfig,
  isConfigured,
  BID_STRATEGIES,
  METRICS,
  OPERATORS,
  RULE_ACTIONS,
  RULE_TEMPLATES,
  EVAL_WINDOWS,
} from "./lib/config.js";
import { callMetaApi } from "./lib/meta-api-client.js";
import {
  createRule,
  listRules,
  deleteRule,
  evaluateRule,
  buildActionApiCall,
  formatRuleSummary,
} from "./lib/rule-engine.js";
import {
  fetchBudgetOverview,
  buildBudgetOverviewDryRun,
  fetchInsights,
  buildInsightsDryRun,
  analyzeBudget,
} from "./lib/budget-analyzer.js";
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
  name: "meta-budget",
  version: "1.0.0",
});

// ── Tool 1: get_budget_overview ─────────────────────────────────────

server.tool(
  "get_budget_overview",
  "Get budget overview across all campaigns and ad sets. Shows daily budgets, bid strategies, spend, and optimization suggestions. If API is not configured, returns a dry_run preview of what would be fetched.",
  {
    window: z
      .enum(["today", "yesterday", "last_3d", "last_7d", "last_14d", "last_30d"])
      .optional()
      .default("last_7d")
      .describe("パフォーマンス評価期間"),
    campaign_id: z
      .string()
      .optional()
      .describe("特定キャンペーンのみ取得（省略時はアカウント全体）"),
  },
  async ({ window, campaign_id }) => {
    try {
      if (!isConfigured()) {
        // Dry run: show what API calls would be made
        const overview = buildBudgetOverviewDryRun();
        const insights = buildInsightsDryRun({ level: "adset", window, campaignId: campaign_id });

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              mode: "dry_run",
              budget_overview: overview,
              insights_request: insights,
              available_bid_strategies: BID_STRATEGIES,
              available_metrics: METRICS,
            }, null, 2),
          }],
        };
      }

      // Live: fetch real data
      const { campaigns, adsets } = await fetchBudgetOverview();
      const insightsResult = await fetchInsights({ level: "adset", window, campaignId: campaign_id });
      const insights = insightsResult.data || [];
      const suggestions = analyzeBudget(campaigns, adsets, insights);

      const output = {
        success: true,
        mode: "live",
        window: EVAL_WINDOWS[window],
        summary: {
          total_campaigns: campaigns.length,
          active_campaigns: campaigns.filter((c) => c.effective_status === "ACTIVE").length,
          total_adsets: adsets.length,
          active_adsets: adsets.filter((a) => a.effective_status === "ACTIVE").length,
          total_daily_budget: campaigns.reduce((s, c) => s + parseInt(c.daily_budget || 0), 0),
        },
        campaigns: campaigns.map((c) => ({
          id: c.id,
          name: c.name,
          status: c.effective_status,
          objective: c.objective,
          daily_budget: c.daily_budget,
          bid_strategy: c.bid_strategy,
        })),
        adset_performance: insights.slice(0, 20).map((row) => ({
          adset_id: row.adset_id,
          adset_name: row.adset_name,
          spend: row.spend,
          impressions: row.impressions,
          clicks: row.clicks,
          ctr: row.ctr,
          cpc: row.cpc,
          conversions: (row.actions || []).find(
            (a) => a.action_type === "purchase" || a.action_type === "lead"
          )?.value || "0",
          cpa: (row.cost_per_action_type || []).find(
            (c) => c.action_type === "purchase" || c.action_type === "lead"
          )?.value || "N/A",
          frequency: row.frequency,
        })),
        optimization_suggestions: suggestions,
      };

      const savedPath = saveOutput("budget_overview", output);
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

// ── Tool 2: update_budget ───────────────────────────────────────────

server.tool(
  "update_budget",
  "Update the budget or bid strategy of a campaign or ad set. Defaults to dry_run=true.",
  {
    object_id: z.string().describe("キャンペーンまたは広告セットのID"),
    object_type: z
      .enum(["campaign", "adset"])
      .optional()
      .default("campaign")
      .describe("オブジェクトタイプ"),
    daily_budget: z
      .number()
      .optional()
      .describe("新しい日予算（通貨最小単位: JPY=円）"),
    bid_strategy: z
      .enum(["lowest_cost", "cost_cap", "bid_cap", "roas_goal"])
      .optional()
      .describe("入札戦略"),
    bid_amount: z
      .number()
      .optional()
      .describe("入札上限額（cost_cap/bid_cap使用時）"),
    roas_average_floor: z
      .number()
      .optional()
      .describe("最低ROAS（roas_goal使用時、例: 2.0）"),
    dry_run: z
      .boolean()
      .optional()
      .default(true)
      .describe("true=プレビューモード（デフォルト）"),
  },
  async ({ object_id, object_type, daily_budget, bid_strategy, bid_amount, roas_average_floor, dry_run }) => {
    try {
      const params = {};

      if (daily_budget != null) {
        params.daily_budget = String(daily_budget);
      }

      if (bid_strategy) {
        const stratDef = BID_STRATEGIES[bid_strategy];
        if (!stratDef) {
          throw new Error(`Unknown bid strategy: ${bid_strategy}`);
        }
        params.bid_strategy = stratDef.api_value;

        if (stratDef.requires === "bid_amount" && bid_amount) {
          params.bid_amount = String(bid_amount);
        }
        if (stratDef.requires === "roas_average_floor" && roas_average_floor) {
          params.roas_average_floor = String(roas_average_floor);
        }
      }

      if (Object.keys(params).length === 0) {
        throw new Error("少なくとも daily_budget か bid_strategy を指定してください");
      }

      const result = await callMetaApi(object_id, params, { dryRun: dry_run });

      const output = {
        success: true,
        mode: dry_run ? "dry_run" : "live",
        object_id,
        object_type,
        changes: params,
        bid_strategy_info: bid_strategy ? BID_STRATEGIES[bid_strategy] : undefined,
        result,
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

// ── Tool 3: create_rule ─────────────────────────────────────────────

server.tool(
  "create_rule",
  "Create an automated budget optimization rule (if-then logic). Rules are saved locally and can be evaluated with evaluate_rules. Use template_id for prebuilt rules or define custom conditions.",
  {
    template_id: z
      .enum(["pause_high_cpa", "scale_winner", "frequency_cap", "low_ctr_alert", "roas_scaledown"])
      .optional()
      .describe("プリセットテンプレートID（カスタムの場合は省略）"),
    name: z.string().optional().describe("ルール名（テンプレート使用時は自動設定）"),
    target_level: z
      .enum(["campaign", "adset", "ad"])
      .optional()
      .default("adset")
      .describe("ルール適用レベル"),
    conditions: z
      .array(z.object({
        metric: z.enum(["spend", "impressions", "clicks", "ctr", "cpc", "cpm", "conversions", "cpa", "roas", "frequency"]),
        operator: z.enum(["gt", "gte", "lt", "lte", "eq"]),
        value: z.number(),
      }))
      .optional()
      .describe("条件リスト（テンプレート使用時はvalue上書き可能）"),
    action: z
      .object({
        type: z.enum(["pause", "activate", "increase_budget", "decrease_budget", "set_budget", "change_bid_strategy", "notify"]),
        percent: z.number().optional(),
        amount: z.number().optional(),
        strategy: z.string().optional(),
      })
      .optional()
      .describe("アクション定義"),
    evaluation_window: z
      .enum(["today", "yesterday", "last_3d", "last_7d", "last_14d", "last_30d"])
      .optional()
      .default("last_7d")
      .describe("評価期間"),
  },
  async ({ template_id, name, target_level, conditions, action, evaluation_window }) => {
    try {
      let ruleConfig;

      if (template_id) {
        const template = RULE_TEMPLATES[template_id];
        if (!template) throw new Error(`Unknown template: ${template_id}`);

        // Use template, allow overrides
        const templateConditions = template.conditions.map((tc, i) => {
          const override = conditions?.[i];
          return {
            metric: override?.metric || tc.metric,
            operator: override?.operator || tc.operator,
            value: override?.value ?? tc.value,
          };
        });

        // Validate all conditions have values
        for (const c of templateConditions) {
          if (c.value == null) {
            throw new Error(
              `Template "${template_id}" requires values for conditions. ` +
              `Provide conditions array with values. Needed: ${template.conditions.map((t) => `${t.metric} (${t.value_label || "value"})`).join(", ")}`
            );
          }
        }

        ruleConfig = {
          name: name || template.name,
          description: template.description,
          target_level: target_level || "adset",
          conditions: templateConditions,
          action: action || template.action,
          evaluation_window: evaluation_window || template.evaluation_window,
        };
      } else {
        // Custom rule
        if (!conditions || conditions.length === 0) {
          throw new Error("conditions is required for custom rules (or use template_id for prebuilt)");
        }
        if (!action) {
          throw new Error("action is required for custom rules");
        }

        ruleConfig = {
          name: name || `Custom Rule ${Date.now()}`,
          target_level: target_level || "adset",
          conditions,
          action,
          evaluation_window,
        };
      }

      const rule = createRule(ruleConfig);
      const summary = formatRuleSummary(rule);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            rule,
            summary,
            available_templates: Object.entries(RULE_TEMPLATES).map(([id, t]) => ({
              id,
              name: t.name,
              description: t.description,
            })),
          }, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${formatError(error)}` }],
        isError: true,
      };
    }
  }
);

// ── Tool 4: list_rules ──────────────────────────────────────────────

server.tool(
  "list_rules",
  "List all saved budget optimization rules, or delete a specific rule.",
  {
    delete_rule_id: z
      .string()
      .optional()
      .describe("削除するルールID（省略時は一覧表示）"),
  },
  async ({ delete_rule_id }) => {
    try {
      if (delete_rule_id) {
        const result = deleteRule(delete_rule_id);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ success: true, ...result }, null, 2),
          }],
        };
      }

      const rules = listRules();

      if (rules.length === 0) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              rules: [],
              message: "ルールが未作成です。create_ruleで作成するか、テンプレートを使用してください。",
              available_templates: Object.entries(RULE_TEMPLATES).map(([id, t]) => ({
                id,
                name: t.name,
                description: t.description,
              })),
            }, null, 2),
          }],
        };
      }

      const rulesWithSummary = rules.map((r) => ({
        id: r.id,
        name: r.name,
        enabled: r.enabled,
        summary: formatRuleSummary(r),
        target_level: r.target_level,
        evaluation_window: r.evaluation_window,
        last_evaluated: r.last_evaluated,
        execution_count: r.execution_count,
        created_at: r.created_at,
      }));

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            total: rules.length,
            rules: rulesWithSummary,
          }, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${formatError(error)}` }],
        isError: true,
      };
    }
  }
);

// ── Tool 5: evaluate_rules ──────────────────────────────────────────

server.tool(
  "evaluate_rules",
  "Evaluate all enabled rules against current campaign performance data. In dry_run mode, uses sample data to demonstrate what rules would trigger. Set execute=true to apply actions via API.",
  {
    sample_data: z
      .array(z.object({
        adset_id: z.string().optional(),
        adset_name: z.string().optional(),
        campaign_id: z.string().optional(),
        campaign_name: z.string().optional(),
        spend: z.string().optional(),
        impressions: z.string().optional(),
        clicks: z.string().optional(),
        ctr: z.string().optional(),
        cpc: z.string().optional(),
        cpm: z.string().optional(),
        frequency: z.string().optional(),
        daily_budget: z.string().optional(),
        actions: z.array(z.object({
          action_type: z.string(),
          value: z.string(),
        })).optional(),
        cost_per_action_type: z.array(z.object({
          action_type: z.string(),
          value: z.string(),
        })).optional(),
        purchase_roas: z.array(z.object({
          action_type: z.string().optional(),
          value: z.string(),
        })).optional(),
      }))
      .optional()
      .describe("テスト用サンプルデータ（省略時はAPIから取得、未設定時はデモデータ使用）"),
    execute: z
      .boolean()
      .optional()
      .default(false)
      .describe("true=ルールアクションを実際に実行（API必須）"),
    dry_run: z
      .boolean()
      .optional()
      .default(true)
      .describe("true=プレビューモード（デフォルト）"),
  },
  async ({ sample_data, execute, dry_run }) => {
    try {
      const rules = listRules().filter((r) => r.enabled);

      if (rules.length === 0) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: "有効なルールがありません。create_ruleでルールを作成してください。",
            }, null, 2),
          }],
        };
      }

      // Get performance data
      let insightsData;

      if (sample_data && sample_data.length > 0) {
        insightsData = sample_data;
      } else if (isConfigured() && !dry_run) {
        const result = await fetchInsights({ level: "adset", window: "last_7d" });
        insightsData = result.data || [];
      } else {
        // Demo data for dry_run
        insightsData = [
          {
            adset_id: "demo_adset_001",
            adset_name: "Demo AdSet A (好成績)",
            campaign_id: "demo_camp_001",
            spend: "15000",
            impressions: "50000",
            clicks: "750",
            ctr: "1.5",
            cpc: "20",
            cpm: "300",
            frequency: "1.8",
            daily_budget: "3000",
            actions: [{ action_type: "purchase", value: "10" }],
            cost_per_action_type: [{ action_type: "purchase", value: "1500" }],
            purchase_roas: [{ value: "3.2" }],
          },
          {
            adset_id: "demo_adset_002",
            adset_name: "Demo AdSet B (CPA高い)",
            campaign_id: "demo_camp_001",
            spend: "20000",
            impressions: "60000",
            clicks: "400",
            ctr: "0.67",
            cpc: "50",
            cpm: "333",
            frequency: "2.5",
            daily_budget: "5000",
            actions: [{ action_type: "purchase", value: "3" }],
            cost_per_action_type: [{ action_type: "purchase", value: "6667" }],
            purchase_roas: [{ value: "0.8" }],
          },
          {
            adset_id: "demo_adset_003",
            adset_name: "Demo AdSet C (疲弊)",
            campaign_id: "demo_camp_001",
            spend: "10000",
            impressions: "80000",
            clicks: "200",
            ctr: "0.25",
            cpc: "50",
            cpm: "125",
            frequency: "4.2",
            daily_budget: "2000",
            actions: [{ action_type: "purchase", value: "1" }],
            cost_per_action_type: [{ action_type: "purchase", value: "10000" }],
            purchase_roas: [{ value: "0.5" }],
          },
        ];
      }

      // Evaluate each rule against each data row
      const evaluations = [];

      for (const rule of rules) {
        for (const row of insightsData) {
          const result = evaluateRule(rule, row);

          if (result.all_conditions_met && result.recommended_action) {
            const currentBudget = parseInt(row.daily_budget || "2000");
            const apiCall = buildActionApiCall(rule, result.target_id, currentBudget);

            let executionResult = null;
            if (execute && !dry_run && apiCall.endpoint) {
              executionResult = await callMetaApi(apiCall.endpoint, apiCall.params, { dryRun: false });
            } else if (apiCall.endpoint) {
              executionResult = await callMetaApi(apiCall.endpoint, apiCall.params, { dryRun: true });
            }

            result.api_action = apiCall;
            result.execution_result = executionResult;
          }

          evaluations.push(result);
        }
      }

      const triggered = evaluations.filter((e) => e.all_conditions_met);
      const notTriggered = evaluations.filter((e) => !e.all_conditions_met);

      const output = {
        success: true,
        mode: dry_run ? "dry_run" : execute ? "live_execute" : "live_preview",
        data_source: sample_data ? "sample_data" : isConfigured() ? "meta_api" : "demo_data",
        summary: {
          rules_evaluated: rules.length,
          data_rows: insightsData.length,
          total_evaluations: evaluations.length,
          rules_triggered: triggered.length,
        },
        triggered: triggered.map((t) => ({
          rule: t.rule_name,
          target: t.target_name || t.target_id,
          conditions: t.conditions_evaluated,
          action: t.api_action?.description,
          curl: t.execution_result?.curl || null,
          executed: execute && !dry_run,
        })),
        not_triggered_summary: notTriggered.length > 0
          ? `${notTriggered.length}件の評価で条件未達（詳細省略）`
          : null,
      };

      const savedPath = saveOutput("rule_evaluation", output);
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
