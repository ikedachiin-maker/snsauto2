// モックデータ生成ユーティリティ - Meta広告自動化ダッシュボード

import type { PerformanceMetrics } from './types';

// ===== ID生成 =====

export function generateCampaignId(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

export function generateAdSetId(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

export function generateAdId(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

export function generateRuleId(): string {
  return `rule_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

export function generateExperimentId(): string {
  return `exp_${Date.now()}`;
}

// ===== メトリクス生成 =====

/**
 * リアルな広告メトリクスを生成
 * @param spend 広告費用（JPY）
 * @returns PerformanceMetrics
 */
export function generateMetrics(spend: number): PerformanceMetrics {
  // インプレッション: 1円あたり800-1200回（業界平均）
  const impressions = Math.floor(spend * (800 + Math.random() * 400));

  // CTR: 2.5-5.5%（Facebookフィード平均）
  const ctr = 0.025 + Math.random() * 0.03;
  const clicks = Math.floor(impressions * ctr);

  // リーチ: インプレッションの60-80%
  const reach = Math.floor(impressions * (0.6 + Math.random() * 0.2));

  // フリクエンシー: インプレッション/リーチ
  const frequency = impressions / reach;

  // コンバージョン率: 2-8%（EC平均）
  const conversion_rate = 0.02 + Math.random() * 0.06;
  const conversions = Math.floor(clicks * conversion_rate);

  // CPC: 総費用/クリック数
  const cpc = clicks > 0 ? spend / clicks : 0;

  // CPM: 総費用/インプレッション数 * 1000
  const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;

  // CPA: 総費用/コンバージョン数
  const cpa = conversions > 0 ? spend / conversions : 0;

  // ROAS: 3-7倍（健全な広告）
  const roas = conversions > 0 ? 3 + Math.random() * 4 : 0;

  // エンゲージメント: いいね、コメント、シェアの合計
  const engagement = Math.floor(impressions * (0.01 + Math.random() * 0.02));
  const engagement_rate = (engagement / impressions) * 100;

  // リンククリック: クリックの70-90%
  const link_clicks = Math.floor(clicks * (0.7 + Math.random() * 0.2));
  const cost_per_link_click = link_clicks > 0 ? spend / link_clicks : 0;

  // 動画視聴（動画広告の場合）
  const video_views = Math.floor(impressions * (0.3 + Math.random() * 0.2));
  const video_view_rate = (video_views / impressions) * 100;

  return {
    spend: Math.round(spend),
    impressions,
    clicks,
    ctr: parseFloat((ctr * 100).toFixed(2)),
    cpc: parseFloat(cpc.toFixed(0)),
    cpm: parseFloat(cpm.toFixed(0)),
    reach,
    frequency: parseFloat(frequency.toFixed(2)),
    conversions,
    conversion_rate: parseFloat((conversion_rate * 100).toFixed(2)),
    cpa: conversions > 0 ? parseFloat(cpa.toFixed(0)) : undefined,
    roas: conversions > 0 ? parseFloat(roas.toFixed(2)) : undefined,
    video_views,
    video_view_rate: parseFloat(video_view_rate.toFixed(2)),
    engagement,
    engagement_rate: parseFloat(engagement_rate.toFixed(2)),
    link_clicks,
    cost_per_link_click: parseFloat(cost_per_link_click.toFixed(0)),
  };
}

/**
 * 低パフォーマンスのメトリクスを生成（警告用）
 */
export function generatePoorMetrics(spend: number): PerformanceMetrics {
  const impressions = Math.floor(spend * (500 + Math.random() * 200));
  const ctr = 0.005 + Math.random() * 0.01; // 0.5-1.5% (低い)
  const clicks = Math.floor(impressions * ctr);
  const reach = Math.floor(impressions * (0.5 + Math.random() * 0.15));
  const frequency = impressions / reach;
  const conversion_rate = 0.005 + Math.random() * 0.015; // 0.5-2% (低い)
  const conversions = Math.floor(clicks * conversion_rate);
  const cpc = clicks > 0 ? spend / clicks : 0;
  const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
  const cpa = conversions > 0 ? spend / conversions : 0;
  const roas = conversions > 0 ? 0.5 + Math.random() * 1.5 : 0; // 0.5-2倍 (低い)

  return {
    spend: Math.round(spend),
    impressions,
    clicks,
    ctr: parseFloat((ctr * 100).toFixed(2)),
    cpc: parseFloat(cpc.toFixed(0)),
    cpm: parseFloat(cpm.toFixed(0)),
    reach,
    frequency: parseFloat(frequency.toFixed(2)),
    conversions,
    conversion_rate: parseFloat((conversion_rate * 100).toFixed(2)),
    cpa: conversions > 0 ? parseFloat(cpa.toFixed(0)) : undefined,
    roas: conversions > 0 ? parseFloat(roas.toFixed(2)) : undefined,
  };
}

/**
 * 高パフォーマンスのメトリクスを生成（成功事例用）
 */
export function generateExcellentMetrics(spend: number): PerformanceMetrics {
  const impressions = Math.floor(spend * (1000 + Math.random() * 500));
  const ctr = 0.05 + Math.random() * 0.05; // 5-10% (高い)
  const clicks = Math.floor(impressions * ctr);
  const reach = Math.floor(impressions * (0.7 + Math.random() * 0.2));
  const frequency = impressions / reach;
  const conversion_rate = 0.08 + Math.random() * 0.12; // 8-20% (高い)
  const conversions = Math.floor(clicks * conversion_rate);
  const cpc = clicks > 0 ? spend / clicks : 0;
  const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
  const cpa = conversions > 0 ? spend / conversions : 0;
  const roas = conversions > 0 ? 8 + Math.random() * 7 : 0; // 8-15倍 (高い)

  return {
    spend: Math.round(spend),
    impressions,
    clicks,
    ctr: parseFloat((ctr * 100).toFixed(2)),
    cpc: parseFloat(cpc.toFixed(0)),
    cpm: parseFloat(cpm.toFixed(0)),
    reach,
    frequency: parseFloat(frequency.toFixed(2)),
    conversions,
    conversion_rate: parseFloat((conversion_rate * 100).toFixed(2)),
    cpa: conversions > 0 ? parseFloat(cpa.toFixed(0)) : undefined,
    roas: conversions > 0 ? parseFloat(roas.toFixed(2)) : undefined,
  };
}

// ===== curl コマンドプレビュー生成 =====

/**
 * Meta Graph API呼び出しのcurlプレビューを生成
 */
export function generateCurlPreview(
  endpoint: string,
  method: 'GET' | 'POST' | 'DELETE',
  params: Record<string, any>
): string {
  const accessToken = 'EAABwz...（実際のトークンに置換）';
  const baseUrl = `https://graph.facebook.com/v25.0/${endpoint}`;

  if (method === 'GET') {
    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(JSON.stringify(value))}`)
      .join('&');
    return `curl -X GET "${baseUrl}?${queryString}&access_token=${accessToken}"`;
  } else if (method === 'POST') {
    const formData = Object.entries(params)
      .map(([key, value]) => `-F "${key}=${JSON.stringify(value)}"`)
      .join(' \\\n  ');
    return `curl -X POST "${baseUrl}" \\\n  ${formData} \\\n  -F "access_token=${accessToken}"`;
  } else if (method === 'DELETE') {
    return `curl -X DELETE "${baseUrl}?access_token=${accessToken}"`;
  }

  return '';
}

// ===== 日本語ダミーデータ =====

export const DUMMY_CAMPAIGN_NAMES = [
  'ウィンターセール2026',
  '新商品プロモーション',
  'ブランド認知キャンペーン',
  'リターゲティング広告',
  'アプリダウンロード促進',
  '期間限定オファー',
];

export const DUMMY_ADSET_NAMES = [
  '25-34歳 女性 ファッション関心層',
  '35-44歳 男性 ビジネス関心層',
  'リマーケティングリスト',
  '類似オーディエンス 1%',
  'Instagram Stories配置',
  'Facebook Feed配置',
];

export const DUMMY_AD_NAMES = [
  '画像広告 - バージョンA',
  '動画広告 - 15秒',
  'カルーセル広告 - 5枚',
  'コレクション広告',
  'ストーリーズ広告',
];

export const DUMMY_PRODUCT_NAMES = [
  'ウィンターコート',
  'スマートウォッチ',
  'オンラインコース',
  'サプリメント',
  '化粧品セット',
  '家電製品',
];

// ===== 日付・時刻ユーティリティ =====

/**
 * ISO 8601形式の日時文字列を生成
 */
export function generateTimestamp(daysAgo: number = 0): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

/**
 * 日付範囲を生成
 */
export function generateDateRange(preset: string): { since: string; until: string } {
  const today = new Date();
  const until = today.toISOString().split('T')[0];
  let since: string;

  switch (preset) {
    case 'today':
      since = until;
      break;
    case 'yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      since = yesterday.toISOString().split('T')[0];
      break;
    case 'last_7d':
      const week = new Date(today);
      week.setDate(week.getDate() - 7);
      since = week.toISOString().split('T')[0];
      break;
    case 'last_30d':
      const month = new Date(today);
      month.setDate(month.getDate() - 30);
      since = month.toISOString().split('T')[0];
      break;
    case 'last_90d':
      const quarter = new Date(today);
      quarter.setDate(quarter.getDate() - 90);
      since = quarter.toISOString().split('T')[0];
      break;
    default:
      const defaultWeek = new Date(today);
      defaultWeek.setDate(defaultWeek.getDate() - 7);
      since = defaultWeek.toISOString().split('T')[0];
  }

  return { since, until };
}

// ===== 推奨事項生成 =====

/**
 * パフォーマンスに基づいた推奨事項を生成
 */
export function generateRecommendations(metrics: PerformanceMetrics): string[] {
  const recommendations: string[] = [];

  // CTRが低い場合
  if (metrics.ctr < 1.5) {
    recommendations.push('📉 CTRが業界平均（2-3%）を下回っています。広告クリエイティブの見直しを推奨します。');
  }

  // CPAが高い場合
  if (metrics.cpa && metrics.cpa > 3000) {
    recommendations.push('💰 CPAが高めです。ターゲティングの精度向上または入札戦略の見直しをご検討ください。');
  }

  // フリクエンシーが高い場合
  if (metrics.frequency && metrics.frequency > 5) {
    recommendations.push('🔄 フリクエンシーが5回を超えています。広告疲労の可能性があるため、クリエイティブの更新を推奨します。');
  }

  // ROASが低い場合
  if (metrics.roas && metrics.roas < 3) {
    recommendations.push('📊 ROASが3倍を下回っています。ランディングページの最適化やオファーの見直しを推奨します。');
  }

  // コンバージョン率が低い場合
  if (metrics.conversion_rate && metrics.conversion_rate < 2) {
    recommendations.push('🎯 コンバージョン率が低めです。LP最適化、フォーム簡略化、オファー強化を検討してください。');
  }

  // 良好なパフォーマンスの場合
  if (metrics.ctr > 4 && metrics.roas && metrics.roas > 5) {
    recommendations.push('✅ 優れたパフォーマンスです！予算を拡大して成功を加速させることを検討してください。');
  }

  // デフォルト推奨
  if (recommendations.length === 0) {
    recommendations.push('📈 パフォーマンスは標準的です。A/Bテストで継続的な改善を目指しましょう。');
  }

  return recommendations;
}

// ===== ランダム選択ユーティリティ =====

export function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}
