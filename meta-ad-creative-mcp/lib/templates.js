// Meta Ad format specifications (2026)
export const AD_FORMATS = {
  feed_square: {
    id: "feed_square",
    name: "Feed Square (1:1)",
    pixels: "1080x1080",
    aspect_ratio: "1:1",
    best_for: "商品紹介、ブランド認知、汎用",
    placements: ["Facebook Feed", "Instagram Feed", "Audience Network"],
    text_limits: { headline: 40, primary_text: 125, description: 25 },
  },
  feed_portrait: {
    id: "feed_portrait",
    name: "Feed Portrait (4:5)",
    pixels: "1080x1350",
    aspect_ratio: "3:4",
    best_for: "ファッション、ビフォーアフター、高CTR狙い",
    placements: ["Facebook Feed", "Instagram Feed"],
    text_limits: { headline: 40, primary_text: 125, description: 25 },
  },
  story: {
    id: "story",
    name: "Stories / Reels (9:16)",
    pixels: "1080x1920",
    aspect_ratio: "9:16",
    best_for: "UGC風、限定オファー、2026年最推奨フォーマット",
    placements: [
      "Instagram Stories",
      "Instagram Reels",
      "Facebook Stories",
      "Facebook Reels",
    ],
    text_limits: { headline: 40, primary_text: 125, description: 25 },
  },
  carousel: {
    id: "carousel",
    name: "Carousel (1:1 x 複数枚)",
    pixels: "1080x1080 per card",
    aspect_ratio: "1:1",
    best_for: "ステップ解説、商品一覧、ストーリー型、機能紹介",
    placements: ["Facebook Feed", "Instagram Feed"],
    text_limits: { headline: 40, primary_text: 125, description: 25 },
    max_cards: 10,
  },
};

export const CTA_OPTIONS = [
  { id: "shop_now", label: "今すぐ購入", label_en: "Shop Now" },
  { id: "learn_more", label: "詳しくはこちら", label_en: "Learn More" },
  { id: "sign_up", label: "登録する", label_en: "Sign Up" },
  { id: "download", label: "ダウンロード", label_en: "Download" },
  { id: "contact_us", label: "お問い合わせ", label_en: "Contact Us" },
  { id: "get_offer", label: "特典を受け取る", label_en: "Get Offer" },
];

export const IMAGE_STYLES = [
  {
    id: "photo_realistic",
    name: "写真リアル",
    description: "プロフェッショナルな商品写真・スタジオ撮影風",
  },
  {
    id: "illustration",
    name: "イラスト",
    description: "モダンなデジタルイラスト・ベクター風",
  },
  {
    id: "ugc_style",
    name: "UGC風",
    description: "ユーザー投稿風のリアルな写真。2026年最高パフォーマンス",
  },
  {
    id: "minimal",
    name: "ミニマル",
    description: "シンプル・クリーン・余白を活かしたデザイン",
  },
  {
    id: "bold_graphic",
    name: "ボールドグラフィック",
    description: "高コントラスト・目を引くグラフィックデザイン",
  },
];

export const COPY_TONES = [
  { id: "professional", name: "プロフェッショナル" },
  { id: "casual", name: "カジュアル" },
  { id: "urgent", name: "緊急性" },
  { id: "emotional", name: "感情訴求" },
  { id: "ugc", name: "UGC/口コミ風" },
];

export function getTemplate(formatId) {
  return AD_FORMATS[formatId] || null;
}

export function getAllTemplates(category = "all") {
  if (category === "all") return Object.values(AD_FORMATS);
  return Object.values(AD_FORMATS).filter((f) => f.id.startsWith(category));
}
