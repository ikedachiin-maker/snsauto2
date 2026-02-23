// ── Meta Report Generation Configuration ────────────────────────────

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

// ── Insights Metrics ────────────────────────────────────────────────

export const METRICS = {
  // Cost & delivery
  spend: { label: "消費額", format: "currency" },
  impressions: { label: "インプレッション", format: "number" },
  reach: { label: "リーチ", format: "number" },
  frequency: { label: "フリクエンシー", format: "decimal" },

  // Clicks
  clicks: { label: "クリック", format: "number" },
  unique_clicks: { label: "ユニーククリック", format: "number" },
  ctr: { label: "CTR", format: "percent" },
  unique_ctr: { label: "ユニークCTR", format: "percent" },
  cpc: { label: "CPC", format: "currency" },
  cost_per_unique_click: { label: "ユニークCPC", format: "currency" },
  cpm: { label: "CPM", format: "currency" },
  cpp: { label: "CPP（リーチ単価）", format: "currency" },

  // Conversions
  actions: { label: "アクション", format: "actions" },
  conversions: { label: "コンバージョン", format: "actions" },
  cost_per_action_type: { label: "CPA", format: "actions_cost" },
  purchase_roas: { label: "ROAS", format: "roas" },
  action_values: { label: "コンバージョン価値", format: "actions" },

  // Video
  video_play_actions: { label: "動画再生", format: "actions" },
  video_thruplay_watched_actions: { label: "ThruPlay", format: "actions" },
  video_avg_time_watched_actions: { label: "平均視聴時間", format: "actions" },

  // Engagement
  inline_link_clicks: { label: "リンククリック", format: "number" },
  inline_link_click_ctr: { label: "リンクCTR", format: "percent" },
  cost_per_inline_link_click: { label: "リンクCPC", format: "currency" },
};

// ── Metric Presets ──────────────────────────────────────────────────

export const METRIC_PRESETS = {
  overview: {
    label: "概要",
    fields: "spend,impressions,reach,frequency,clicks,ctr,cpc,cpm",
  },
  conversions: {
    label: "コンバージョン",
    fields: "spend,impressions,clicks,actions,cost_per_action_type,purchase_roas,action_values",
  },
  engagement: {
    label: "エンゲージメント",
    fields: "spend,impressions,reach,clicks,ctr,inline_link_clicks,inline_link_click_ctr,cost_per_inline_link_click",
  },
  video: {
    label: "動画",
    fields: "spend,impressions,reach,video_play_actions,video_thruplay_watched_actions,video_avg_time_watched_actions",
  },
  full: {
    label: "全指標",
    fields: "spend,impressions,reach,frequency,clicks,unique_clicks,ctr,unique_ctr,cpc,cost_per_unique_click,cpm,cpp,actions,cost_per_action_type,purchase_roas,action_values,inline_link_clicks,inline_link_click_ctr",
  },
};

// ── Date Presets ────────────────────────────────────────────────────

export const DATE_PRESETS = {
  today: { label: "今日" },
  yesterday: { label: "昨日" },
  last_3d: { label: "過去3日" },
  last_7d: { label: "過去7日" },
  last_14d: { label: "過去14日" },
  last_30d: { label: "過去30日" },
  this_month: { label: "今月" },
  last_month: { label: "先月" },
  this_quarter: { label: "今四半期" },
  last_quarter: { label: "前四半期" },
  maximum: { label: "全期間" },
};

// ── Breakdowns ──────────────────────────────────────────────────────

export const BREAKDOWNS = {
  age: { label: "年齢", type: "demographic" },
  gender: { label: "性別", type: "demographic" },
  "age,gender": { label: "年齢×性別", type: "demographic" },
  country: { label: "国", type: "geographic" },
  region: { label: "地域", type: "geographic" },
  publisher_platform: { label: "プラットフォーム", type: "placement" },
  platform_position: { label: "配置面", type: "placement" },
  "publisher_platform,platform_position": { label: "プラットフォーム×配置面", type: "placement" },
  device_platform: { label: "デバイス", type: "device" },
  impression_device: { label: "表示デバイス", type: "device" },
};

// ── Report Levels ───────────────────────────────────────────────────

export const REPORT_LEVELS = {
  account: { label: "アカウント", endpoint_suffix: "insights" },
  campaign: { label: "キャンペーン", endpoint_suffix: "insights" },
  adset: { label: "広告セット", endpoint_suffix: "insights" },
  ad: { label: "広告", endpoint_suffix: "insights" },
};

// ── Time Increments ─────────────────────────────────────────────────

export const TIME_INCREMENTS = {
  1: { label: "日次" },
  7: { label: "週次" },
  14: { label: "2週間" },
  monthly: { label: "月次" },
  all_days: { label: "全期間合算" },
};
