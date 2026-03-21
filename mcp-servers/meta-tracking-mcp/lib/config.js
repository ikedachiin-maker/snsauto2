// ── Meta Tracking (Pixel + CAPI) Configuration ─────────────────────

export const API_VERSION = "v25.0";
export const GRAPH_API_BASE = `https://graph.facebook.com/${API_VERSION}`;

// ── Environment Variables ────────────────────────────────────────────

export function getConfig() {
  return {
    accessToken: process.env.META_ACCESS_TOKEN || "",
    pixelId: process.env.META_PIXEL_ID || "",
    testEventCode: process.env.META_TEST_EVENT_CODE || "",
  };
}

export function isConfigured() {
  const cfg = getConfig();
  return !!(cfg.accessToken && cfg.pixelId);
}

// ── Standard Events ─────────────────────────────────────────────────

export const STANDARD_EVENTS = {
  PageView: {
    label: "ページビュー",
    description: "ページ閲覧",
    required_params: [],
    recommended_params: [],
  },
  ViewContent: {
    label: "コンテンツ閲覧",
    description: "商品・記事の閲覧",
    required_params: [],
    recommended_params: ["content_ids", "content_type", "value", "currency"],
  },
  Search: {
    label: "検索",
    description: "サイト内検索",
    required_params: [],
    recommended_params: ["search_string", "content_category"],
  },
  AddToCart: {
    label: "カート追加",
    description: "商品をカートに追加",
    required_params: [],
    recommended_params: ["content_ids", "content_type", "value", "currency"],
  },
  AddToWishlist: {
    label: "ウィッシュリスト追加",
    description: "お気に入りに追加",
    required_params: [],
    recommended_params: ["content_ids", "content_type", "value", "currency"],
  },
  InitiateCheckout: {
    label: "決済開始",
    description: "チェックアウト開始",
    required_params: [],
    recommended_params: ["content_ids", "value", "currency", "num_items"],
  },
  AddPaymentInfo: {
    label: "支払い情報追加",
    description: "支払い情報を入力",
    required_params: [],
    recommended_params: ["content_ids", "value", "currency"],
  },
  Purchase: {
    label: "購入",
    description: "購入完了",
    required_params: ["value", "currency"],
    recommended_params: ["content_ids", "content_type", "num_items", "order_id"],
  },
  Lead: {
    label: "リード",
    description: "リード獲得（フォーム送信等）",
    required_params: [],
    recommended_params: ["value", "currency", "content_name"],
  },
  CompleteRegistration: {
    label: "登録完了",
    description: "会員登録完了",
    required_params: [],
    recommended_params: ["value", "currency", "content_name", "status"],
  },
  Subscribe: {
    label: "サブスク登録",
    description: "サブスクリプション登録",
    required_params: ["value", "currency"],
    recommended_params: ["predicted_ltv"],
  },
  StartTrial: {
    label: "トライアル開始",
    description: "無料トライアル開始",
    required_params: ["value", "currency"],
    recommended_params: ["predicted_ltv"],
  },
  Contact: {
    label: "問い合わせ",
    description: "問い合わせフォーム送信",
    required_params: [],
    recommended_params: [],
  },
  Schedule: {
    label: "予約",
    description: "予約・アポイント",
    required_params: [],
    recommended_params: [],
  },
};

// ── User Data Parameters (for matching) ─────────────────────────────

export const USER_DATA_FIELDS = {
  em: { label: "メールアドレス", hash: true, description: "SHA-256ハッシュ推奨" },
  ph: { label: "電話番号", hash: true, description: "国コード付き、SHA-256ハッシュ推奨" },
  fn: { label: "名", hash: true },
  ln: { label: "姓", hash: true },
  ge: { label: "性別", hash: true, description: "m or f" },
  db: { label: "生年月日", hash: true, description: "YYYYMMDD" },
  ct: { label: "市区町村", hash: true },
  st: { label: "都道府県", hash: true },
  zp: { label: "郵便番号", hash: true },
  country: { label: "国", hash: true, description: "2文字コード (jp)" },
  external_id: { label: "外部ID", hash: true, description: "CRM等のユーザーID" },
  client_ip_address: { label: "IPアドレス", hash: false },
  client_user_agent: { label: "ユーザーエージェント", hash: false },
  fbc: { label: "Click ID", hash: false, description: "fb_click_id cookie" },
  fbp: { label: "Browser ID", hash: false, description: "_fbp cookie" },
};

// ── Action Sources ──────────────────────────────────────────────────

export const ACTION_SOURCES = {
  website: "ウェブサイト",
  app: "アプリ",
  phone_call: "電話",
  chat: "チャット",
  email: "メール",
  physical_store: "実店舗",
  system_generated: "システム生成",
  other: "その他",
};

// ── Data Processing Options ─────────────────────────────────────────

export const DATA_PROCESSING_OPTIONS = {
  none: { options: [], country: 0, state: 0 },
  ldu_california: {
    options: ["LDU"],
    country: 1,
    state: 1000,
    description: "Limited Data Use (California CCPA)",
  },
  ldu_colorado: {
    options: ["LDU"],
    country: 1,
    state: 1001,
    description: "Limited Data Use (Colorado CPA)",
  },
};
