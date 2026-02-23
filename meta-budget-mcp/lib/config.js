// ── Meta Budget Optimization Configuration ──────────────────────────

export const API_VERSION = "v25.0";
export const GRAPH_API_BASE = `https://graph.facebook.com/${API_VERSION}`;

// ── Environment Variables ────────────────────────────────────────────

export function getConfig() {
  return {
    accessToken: process.env.META_ACCESS_TOKEN || "",
    adAccountId: process.env.META_AD_ACCOUNT_ID || "",
  };
}

export function isConfigured() {
  const cfg = getConfig();
  return !!(cfg.accessToken && cfg.adAccountId);
}

// ── Bid Strategies ──────────────────────────────────────────────────

export const BID_STRATEGIES = {
  lowest_cost: {
    api_value: "LOWEST_COST_WITHOUT_CAP",
    description: "最低コスト（上限なし）- 予算内で最大結果を獲得",
    risk: "low",
    recommended_for: ["新規キャンペーン", "テスト段階"],
  },
  cost_cap: {
    api_value: "COST_CAP",
    description: "コスト上限 - CPAが上限を超えないよう制御",
    risk: "medium",
    recommended_for: ["CPA目標が明確な場合", "スケール段階"],
    requires: "bid_amount",
  },
  bid_cap: {
    api_value: "LOWEST_COST_WITH_BID_CAP",
    description: "入札上限 - オークション入札額に上限設定",
    risk: "high",
    recommended_for: ["上級者向け", "競合が激しい場合"],
    requires: "bid_amount",
  },
  roas_goal: {
    api_value: "LOWEST_COST_WITH_MIN_ROAS",
    description: "ROAS目標 - 最低ROAS達成を優先",
    risk: "medium",
    recommended_for: ["EC・物販", "ROAS最適化"],
    requires: "roas_average_floor",
  },
};

// ── Performance Metrics ─────────────────────────────────────────────

export const METRICS = {
  spend: { label: "消費額", unit: "currency", direction: "lower_better" },
  impressions: { label: "インプレッション", unit: "count", direction: "higher_better" },
  clicks: { label: "クリック数", unit: "count", direction: "higher_better" },
  ctr: { label: "CTR", unit: "percent", direction: "higher_better" },
  cpc: { label: "CPC", unit: "currency", direction: "lower_better" },
  cpm: { label: "CPM", unit: "currency", direction: "lower_better" },
  conversions: { label: "コンバージョン", unit: "count", direction: "higher_better" },
  cpa: { label: "CPA", unit: "currency", direction: "lower_better" },
  roas: { label: "ROAS", unit: "ratio", direction: "higher_better" },
  frequency: { label: "フリクエンシー", unit: "ratio", direction: "lower_better" },
};

// ── Rule Condition Operators ────────────────────────────────────────

export const OPERATORS = {
  gt: { label: ">", description: "より大きい" },
  gte: { label: ">=", description: "以上" },
  lt: { label: "<", description: "より小さい" },
  lte: { label: "<=", description: "以下" },
  eq: { label: "==", description: "等しい" },
};

// ── Rule Action Types ───────────────────────────────────────────────

export const RULE_ACTIONS = {
  pause: {
    description: "広告セット/広告を一時停止",
    api_field: "status",
    api_value: "PAUSED",
  },
  activate: {
    description: "広告セット/広告を有効化",
    api_field: "status",
    api_value: "ACTIVE",
  },
  increase_budget: {
    description: "日予算を増額（%指定）",
    api_field: "daily_budget",
    requires: "percent",
  },
  decrease_budget: {
    description: "日予算を減額（%指定）",
    api_field: "daily_budget",
    requires: "percent",
  },
  set_budget: {
    description: "日予算を固定額に設定",
    api_field: "daily_budget",
    requires: "amount",
  },
  change_bid_strategy: {
    description: "入札戦略を変更",
    api_field: "bid_strategy",
    requires: "strategy",
  },
  notify: {
    description: "通知のみ（変更なし）",
    api_field: null,
  },
};

// ── Prebuilt Rule Templates ─────────────────────────────────────────

export const RULE_TEMPLATES = {
  pause_high_cpa: {
    name: "高CPA自動停止",
    description: "CPAが目標の1.5倍を超えたら広告セットを停止",
    conditions: [
      { metric: "cpa", operator: "gt", value: null, value_label: "目標CPA × 1.5" },
      { metric: "spend", operator: "gte", value: null, value_label: "最低消費額" },
    ],
    action: { type: "pause" },
    evaluation_window: "last_7d",
  },
  scale_winner: {
    name: "好成績AdSet増額",
    description: "CPAが目標以下かつ十分なCV数があれば予算20%増",
    conditions: [
      { metric: "cpa", operator: "lte", value: null, value_label: "目標CPA" },
      { metric: "conversions", operator: "gte", value: 5 },
    ],
    action: { type: "increase_budget", percent: 20 },
    evaluation_window: "last_7d",
  },
  frequency_cap: {
    name: "フリクエンシー上限",
    description: "フリクエンシーが3を超えたら広告を停止（クリエイティブ疲弊）",
    conditions: [
      { metric: "frequency", operator: "gt", value: 3 },
    ],
    action: { type: "pause" },
    evaluation_window: "last_7d",
  },
  low_ctr_alert: {
    name: "低CTRアラート",
    description: "CTRが0.5%未満で1000imp以上なら通知",
    conditions: [
      { metric: "ctr", operator: "lt", value: 0.5 },
      { metric: "impressions", operator: "gte", value: 1000 },
    ],
    action: { type: "notify" },
    evaluation_window: "last_3d",
  },
  roas_scaledown: {
    name: "低ROAS減額",
    description: "ROASが目標の70%未満なら予算30%減",
    conditions: [
      { metric: "roas", operator: "lt", value: null, value_label: "目標ROAS × 0.7" },
      { metric: "spend", operator: "gte", value: null, value_label: "最低消費額" },
    ],
    action: { type: "decrease_budget", percent: 30 },
    evaluation_window: "last_7d",
  },
};

// ── Evaluation Windows ──────────────────────────────────────────────

export const EVAL_WINDOWS = {
  today: { label: "今日", days: 0, time_range: "today" },
  yesterday: { label: "昨日", days: 1, time_range: "yesterday" },
  last_3d: { label: "過去3日", days: 3, time_range: "last_3d" },
  last_7d: { label: "過去7日", days: 7, time_range: "last_7d" },
  last_14d: { label: "過去14日", days: 14, time_range: "last_14d" },
  last_30d: { label: "過去30日", days: 30, time_range: "last_30d" },
};

// ── Insights API Fields ─────────────────────────────────────────────

export const INSIGHTS_FIELDS =
  "campaign_name,adset_name,ad_name,spend,impressions,clicks,ctr,cpc,cpm,actions,cost_per_action_type,purchase_roas";
