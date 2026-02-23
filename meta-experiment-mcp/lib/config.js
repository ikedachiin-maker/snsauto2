// ── Meta Experiments API Configuration ───────────────────────────────

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

// ── Test Variables (何をテストするか) ────────────────────────────────

export const TEST_VARIABLES = {
  creative: {
    label: "クリエイティブ",
    description: "画像/動画/テキストの異なるバリエーション比較",
    level: "ad",
  },
  audience: {
    label: "オーディエンス",
    description: "異なるターゲティング設定の比較",
    level: "adset",
  },
  placement: {
    label: "配置面",
    description: "Feed vs Story vs Reels等の比較",
    level: "adset",
  },
  optimization: {
    label: "最適化イベント",
    description: "異なるコンバージョンイベントの比較",
    level: "adset",
  },
  bid_strategy: {
    label: "入札戦略",
    description: "Lowest Cost vs Cost Cap等の比較",
    level: "campaign",
  },
  landing_page: {
    label: "ランディングページ",
    description: "異なるLP URLの比較",
    level: "ad",
  },
};

// ── Test Objectives (何を基準に判定するか) ────────────────────────────

export const TEST_OBJECTIVES = {
  cost_per_result: {
    label: "CPA（結果あたりコスト）",
    metric: "cost_per_action_type",
    direction: "lower_better",
  },
  ctr: {
    label: "CTR（クリック率）",
    metric: "ctr",
    direction: "higher_better",
  },
  conversion_rate: {
    label: "CVR（コンバージョン率）",
    metric: "conversion_rate",
    direction: "higher_better",
  },
  roas: {
    label: "ROAS（広告費用対効果）",
    metric: "purchase_roas",
    direction: "higher_better",
  },
  cpc: {
    label: "CPC（クリック単価）",
    metric: "cpc",
    direction: "lower_better",
  },
  cpm: {
    label: "CPM（1000インプレッション単価）",
    metric: "cpm",
    direction: "lower_better",
  },
};

// ── Confidence Levels ───────────────────────────────────────────────

export const CONFIDENCE_LEVELS = {
  65: { label: "65% (低)", description: "最低限の信頼度。素早い判定だが誤判定リスクあり" },
  80: { label: "80% (中)", description: "バランス型。多くのA/Bテストに推奨" },
  90: { label: "90% (高)", description: "Meta標準。高い信頼度" },
  95: { label: "95% (最高)", description: "学術レベル。大きな判断に推奨" },
};

// ── Duration Constraints ────────────────────────────────────────────

export const DURATION = {
  min_days: 4,
  max_days: 30,
  recommended_days: 7,
};

// ── Insights Fields for Experiment Analysis ─────────────────────────

export const EXPERIMENT_INSIGHTS_FIELDS =
  "campaign_name,adset_name,ad_name,spend,impressions,reach,clicks,ctr,cpc,cpm,actions,cost_per_action_type,purchase_roas,frequency,unique_clicks,cost_per_unique_click";

// ── Winner Actions ──────────────────────────────────────────────────

export const WINNER_ACTIONS = {
  scale_budget: {
    label: "予算スケール",
    description: "勝者の予算を増額し、敗者を停止",
  },
  pause_losers: {
    label: "敗者停止",
    description: "敗者バリアントのみ停止",
  },
  apply_and_end: {
    label: "適用＆終了",
    description: "勝者設定を本番に適用しテスト終了",
  },
  report_only: {
    label: "レポートのみ",
    description: "結果を記録するだけで変更なし",
  },
};
