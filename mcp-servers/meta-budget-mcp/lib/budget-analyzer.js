// ── Budget Analysis & Optimization Suggestions ─────────────────────

import { BID_STRATEGIES, METRICS, EVAL_WINDOWS, INSIGHTS_FIELDS, getConfig } from "./config.js";
import { getMetaApi } from "./meta-api-client.js";

// ── Fetch Insights from Meta API ────────────────────────────────────

function dateRange(window) {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() - 1); // Yesterday as end date

  const ewDef = EVAL_WINDOWS[window];
  const start = new Date(end);
  start.setDate(start.getDate() - (ewDef?.days || 7) + 1);

  return {
    since: start.toISOString().split("T")[0],
    until: end.toISOString().split("T")[0],
  };
}

export async function fetchInsights({ level = "adset", window = "last_7d", campaignId }) {
  const config = getConfig();
  const { since, until } = dateRange(window);

  const params = {
    fields: INSIGHTS_FIELDS,
    level,
    time_range: JSON.stringify({ since, until }),
    limit: "100",
  };

  // If specific campaign, fetch insights for that campaign
  const endpoint = campaignId
    ? `${campaignId}/insights`
    : `act_${config.adAccountId}/insights`;

  return getMetaApi(endpoint, params, { dryRun: false });
}

// Build a dry_run representation of what the insights request would look like
export function buildInsightsDryRun({ level = "adset", window = "last_7d", campaignId }) {
  const config = getConfig();
  const { since, until } = dateRange(window);

  const endpoint = campaignId
    ? `${campaignId}/insights`
    : `act_${config.adAccountId}/insights`;

  return {
    dry_run: true,
    endpoint,
    params: {
      fields: INSIGHTS_FIELDS,
      level,
      time_range: { since, until },
    },
    note: "Set META_ACCESS_TOKEN and META_AD_ACCOUNT_ID to fetch real data.",
  };
}

// ── Budget Overview (from account-level data) ───────────────────────

export async function fetchBudgetOverview() {
  const config = getConfig();

  // Fetch campaigns with budget info
  const campaigns = await getMetaApi(
    `act_${config.adAccountId}/campaigns`,
    {
      fields: "name,status,objective,daily_budget,lifetime_budget,bid_strategy,budget_remaining,effective_status",
      limit: "50",
      filtering: JSON.stringify([{ field: "effective_status", operator: "IN", value: ["ACTIVE", "PAUSED"] }]),
    },
    { dryRun: false }
  );

  // Fetch adsets with budget info
  const adsets = await getMetaApi(
    `act_${config.adAccountId}/adsets`,
    {
      fields: "name,status,campaign_id,daily_budget,lifetime_budget,bid_strategy,bid_amount,optimization_goal,budget_remaining,effective_status",
      limit: "100",
      filtering: JSON.stringify([{ field: "effective_status", operator: "IN", value: ["ACTIVE", "PAUSED"] }]),
    },
    { dryRun: false }
  );

  return { campaigns: campaigns.data || [], adsets: adsets.data || [] };
}

export function buildBudgetOverviewDryRun() {
  const config = getConfig();
  return {
    dry_run: true,
    requests: [
      {
        endpoint: `act_${config.adAccountId}/campaigns`,
        fields: "name,status,objective,daily_budget,lifetime_budget,bid_strategy,budget_remaining,effective_status",
      },
      {
        endpoint: `act_${config.adAccountId}/adsets`,
        fields: "name,status,campaign_id,daily_budget,bid_strategy,bid_amount,optimization_goal,budget_remaining,effective_status",
      },
    ],
    note: "Set META_ACCESS_TOKEN and META_AD_ACCOUNT_ID to fetch real data.",
  };
}

// ── Optimization Suggestions ────────────────────────────────────────

export function analyzeBudget(campaigns, adsets, insights) {
  const suggestions = [];

  // Analyze each campaign
  for (const camp of campaigns) {
    const campAdsets = adsets.filter((a) => a.campaign_id === camp.id);
    const hasCBO = !!camp.daily_budget || !!camp.lifetime_budget;

    // Suggestion: Enable CBO if not enabled and has multiple ad sets
    if (!hasCBO && campAdsets.length > 1) {
      suggestions.push({
        level: "campaign",
        target_id: camp.id,
        target_name: camp.name,
        type: "enable_cbo",
        priority: "high",
        suggestion: "CBO（キャンペーン予算最適化）を有効化",
        reason: `${campAdsets.length}個のAdSetがあり、CBO有効化でMeta AIが最適配分します`,
        action: {
          endpoint: camp.id,
          params: {
            daily_budget: String(
              campAdsets.reduce((sum, a) => sum + parseInt(a.daily_budget || 0), 0) || 2000
            ),
          },
        },
      });
    }

    // Suggestion: Bid strategy upgrade
    if (camp.bid_strategy === "LOWEST_COST_WITHOUT_CAP" && camp.status === "ACTIVE") {
      const campInsights = insights?.filter((i) => i.campaign_id === camp.id) || [];
      const totalSpend = campInsights.reduce((s, i) => s + parseFloat(i.spend || 0), 0);

      if (totalSpend > 10000) {
        suggestions.push({
          level: "campaign",
          target_id: camp.id,
          target_name: camp.name,
          type: "bid_strategy_upgrade",
          priority: "medium",
          suggestion: "入札戦略をCost Capに切替検討",
          reason: `累計消費 ¥${Math.round(totalSpend)} - CPA安定のためCost Capへ移行推奨`,
          action: {
            endpoint: camp.id,
            params: { bid_strategy: "COST_CAP" },
          },
        });
      }
    }
  }

  // Analyze ad sets
  if (insights && insights.length > 0) {
    for (const row of insights) {
      const adsetId = row.adset_id;
      const adset = adsets.find((a) => a.id === adsetId);
      if (!adset) continue;

      const spend = parseFloat(row.spend || 0);
      const cpa = parseFloat(
        (row.cost_per_action_type || []).find(
          (c) => c.action_type === "purchase" || c.action_type === "lead"
        )?.value || 0
      );
      const frequency = parseFloat(row.frequency || 0);
      const ctr = parseFloat(row.ctr || 0);
      const conversions = parseInt(
        (row.actions || []).find(
          (a) => a.action_type === "purchase" || a.action_type === "lead"
        )?.value || 0
      );

      // High frequency warning
      if (frequency > 3) {
        suggestions.push({
          level: "adset",
          target_id: adsetId,
          target_name: row.adset_name,
          type: "frequency_alert",
          priority: "high",
          suggestion: "フリクエンシー過多 - クリエイティブ更新推奨",
          reason: `フリクエンシー ${frequency.toFixed(1)} > 3.0 → 広告疲弊の兆候`,
        });
      }

      // Low CTR warning
      if (ctr < 0.5 && parseInt(row.impressions || 0) > 1000) {
        suggestions.push({
          level: "adset",
          target_id: adsetId,
          target_name: row.adset_name,
          type: "low_ctr",
          priority: "medium",
          suggestion: "CTR低下 - クリエイティブ・ターゲティング見直し",
          reason: `CTR ${ctr.toFixed(2)}% < 0.5%`,
        });
      }

      // Good performer → scale up
      if (conversions >= 5 && cpa > 0 && spend > 3000) {
        suggestions.push({
          level: "adset",
          target_id: adsetId,
          target_name: row.adset_name,
          type: "scale_up",
          priority: "medium",
          suggestion: "好成績 - 予算増額検討",
          reason: `CV ${conversions}件, CPA ¥${Math.round(cpa)} - 予算20%増で拡大余地あり`,
          action: {
            endpoint: adsetId,
            params: {
              daily_budget: String(Math.round(parseInt(adset.daily_budget || 2000) * 1.2)),
            },
          },
        });
      }

      // Poor performer → reduce or pause
      if (spend > 5000 && conversions === 0) {
        suggestions.push({
          level: "adset",
          target_id: adsetId,
          target_name: row.adset_name,
          type: "poor_performer",
          priority: "high",
          suggestion: "消費のみでCV無し - 停止検討",
          reason: `¥${Math.round(spend)} 消費でCV 0件`,
          action: {
            endpoint: adsetId,
            params: { status: "PAUSED" },
          },
        });
      }
    }
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  suggestions.sort((a, b) => (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9));

  return suggestions;
}
