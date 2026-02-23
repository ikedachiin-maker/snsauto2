// ── Meta Marketing API Configuration ──────────────────────────────────

export const API_VERSION = "v25.0";
export const GRAPH_API_BASE = `https://graph.facebook.com/${API_VERSION}`;

// ── Environment Variables ────────────────────────────────────────────

export function getConfig() {
  return {
    accessToken: process.env.META_ACCESS_TOKEN || "",
    adAccountId: process.env.META_AD_ACCOUNT_ID || "",
    pageId: process.env.META_PAGE_ID || "",
  };
}

export function isConfigured() {
  const cfg = getConfig();
  return !!(cfg.accessToken && cfg.adAccountId && cfg.pageId);
}

// ── ODAX Objectives (2026 Advantage+ mandatory) ─────────────────────

export const ODAX_OBJECTIVES = {
  sales: {
    objective: "OUTCOME_SALES",
    description: "コンバージョン・カタログ販売",
    optimization_goals: [
      "OFFSITE_CONVERSIONS",
      "VALUE",
      "CONVERSATIONS",
      "LINK_CLICKS",
    ],
  },
  leads: {
    objective: "OUTCOME_LEADS",
    description: "リード獲得（フォーム・電話・メッセージ）",
    optimization_goals: [
      "LEAD_GENERATION",
      "QUALITY_LEAD",
      "OFFSITE_CONVERSIONS",
      "CONVERSATIONS",
    ],
  },
  awareness: {
    objective: "OUTCOME_AWARENESS",
    description: "ブランド認知・リーチ",
    optimization_goals: [
      "REACH",
      "AD_RECALL_LIFT",
      "IMPRESSIONS",
      "THRUPLAY",
    ],
  },
  traffic: {
    objective: "OUTCOME_TRAFFIC",
    description: "ウェブサイト・アプリへの誘導",
    optimization_goals: [
      "LINK_CLICKS",
      "LANDING_PAGE_VIEWS",
      "REACH",
      "CONVERSATIONS",
    ],
  },
  engagement: {
    objective: "OUTCOME_ENGAGEMENT",
    description: "エンゲージメント（動画再生・投稿交流）",
    optimization_goals: [
      "THRUPLAY",
      "POST_ENGAGEMENT",
      "REACH",
      "CONVERSATIONS",
    ],
  },
  app_promotion: {
    objective: "OUTCOME_APP_PROMOTION",
    description: "アプリインストール・アプリ内イベント",
    optimization_goals: ["APP_INSTALLS", "OFFSITE_CONVERSIONS", "VALUE"],
  },
};

// ── CTA Type Mapping (Module 1 cta_type → Meta API call_to_action_type) ──

export const CTA_MAP = {
  shop_now: "SHOP_NOW",
  learn_more: "LEARN_MORE",
  sign_up: "SIGN_UP",
  download: "DOWNLOAD",
  contact_us: "CONTACT_US",
  get_offer: "GET_OFFER",
  book_now: "BOOK_TRAVEL",
  watch_more: "WATCH_MORE",
  subscribe: "SUBSCRIBE",
  apply_now: "APPLY_NOW",
  order_now: "ORDER_NOW",
  get_quote: "GET_QUOTE",
};

// ── Placement Defaults ──────────────────────────────────────────────

export const ADVANTAGE_PLUS_PLACEMENTS = {
  // Advantage+ uses automatic placements by default
  targeting_automation: {
    advantage_audience: 1, // Advantage+ audience
  },
};

// ── Billing Events ──────────────────────────────────────────────────

export const BILLING_EVENTS = {
  IMPRESSIONS: "IMPRESSIONS",
  LINK_CLICKS: "LINK_CLICKS",
  APP_INSTALLS: "APP_INSTALLS",
  THRUPLAY: "THRUPLAY",
};

// ── Default Campaign Settings ───────────────────────────────────────

export const DEFAULTS = {
  daily_budget_cents: 2000, // ¥2,000 / $20.00
  currency: "JPY",
  bid_strategy: "LOWEST_COST_WITHOUT_CAP",
  billing_event: "IMPRESSIONS",
  status: "PAUSED",
};
