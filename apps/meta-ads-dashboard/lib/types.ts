// 共通型定義 - Meta広告自動化ダッシュボード

// ===== API共通型 =====

export interface ApiRequest {
  action: string;
  params: Record<string, any>;
}

export interface ApiResponse<T = any> {
  action: string;
  params: Record<string, any>;
  result: {
    status: 'success' | 'error';
    message: string;
    data: T;
  };
  timestamp: string;
}

// ===== Module 1: クリエイティブ自動生成 =====

export interface AdTemplate {
  id: string;
  name: string;
  description: string;
  best_for: string;
}

export interface AdCopy {
  headline: string;
  primary_text: string;
  description: string;
  cta: string;
}

export interface AdImage {
  image_url: string;
  format: 'feed_square' | 'feed_portrait' | 'story' | 'carousel';
  aspect_ratio: string;
  pixels: string;
}

export interface AdCreative {
  image_url: string;
  copy: AdCopy;
  format: string;
  template: string;
}

// ===== Module 2: キャンペーン自動作成 =====

export type CampaignObjective =
  | 'sales'
  | 'leads'
  | 'awareness'
  | 'traffic'
  | 'engagement'
  | 'app_promotion';

export type CampaignStatus = 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';

export interface Campaign {
  id: string;
  name: string;
  objective: CampaignObjective;
  status: CampaignStatus;
  daily_budget?: number;
  lifetime_budget?: number;
  special_ad_categories?: string[];
  created_time: string;
}

export interface AdSet {
  id: string;
  name: string;
  campaign_id: string;
  status: CampaignStatus;
  daily_budget?: number;
  bid_amount?: number;
  optimization_goal: string;
  billing_event: string;
}

export interface Ad {
  id: string;
  name: string;
  adset_id: string;
  status: CampaignStatus;
  creative: {
    image_hash?: string;
    image_url?: string;
    body?: string;
    link_url?: string;
  };
}

export interface SetupCheck {
  env_vars: {
    META_ACCESS_TOKEN: boolean;
    META_AD_ACCOUNT_ID: boolean;
    META_PAGE_ID: boolean;
  };
  recommendations: string[];
}

// ===== Module 3: 予算最適化 =====

export type BidStrategy = 'lowest_cost' | 'cost_cap' | 'bid_cap' | 'roas_goal';

export interface BudgetOverview {
  account_id: string;
  total_budget: number;
  total_spend: number;
  remaining: number;
  campaigns: Array<{
    id: string;
    name: string;
    budget: number;
    spend: number;
    status: CampaignStatus;
  }>;
  recommendations: string[];
}

export interface BudgetRule {
  id: string;
  name: string;
  entity_type: 'campaign' | 'adset' | 'ad';
  entity_id: string;
  conditions: Array<{
    metric: string;
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
    value: number;
  }>;
  action: 'pause' | 'scale' | 'alert' | 'adjust_budget' | 'adjust_bid';
  action_params?: Record<string, any>;
  enabled: boolean;
  created_at: string;
}

export interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  conditions: Array<{ metric: string; operator: string; value: number }>;
  action: string;
  action_params?: Record<string, any>;
}

// ===== Module 4: A/Bテスト自動化 =====

export type TestVariable =
  | 'creative'
  | 'audience'
  | 'placement'
  | 'optimization'
  | 'bid_strategy'
  | 'landing_page';

export type TestObjective =
  | 'cost_per_result'
  | 'ctr'
  | 'conversion_rate'
  | 'roas'
  | 'cpc'
  | 'cpm';

export type ConfidenceLevel = 65 | 80 | 90 | 95;

export type WinnerAction =
  | 'scale_budget'
  | 'pause_losers'
  | 'apply_and_end'
  | 'report_only';

export interface Experiment {
  id: string;
  name: string;
  test_variable: TestVariable;
  objective: TestObjective;
  confidence_level: ConfidenceLevel;
  variants: Array<{
    id: string;
    name: string;
    adset_id: string;
  }>;
  status: 'RUNNING' | 'PAUSED' | 'COMPLETED';
  start_time: string;
  end_time?: string;
}

export interface ExperimentResults {
  experiment_id: string;
  variants: Array<{
    id: string;
    name: string;
    metrics: PerformanceMetrics;
    is_winner: boolean;
    confidence: number;
    p_value: number;
  }>;
  winner?: {
    variant_id: string;
    lift: number;
    confidence: number;
  };
  statistical_significance: boolean;
}

// ===== Module 5: トラッキング =====

export type StandardEvent =
  | 'Purchase'
  | 'Lead'
  | 'CompleteRegistration'
  | 'AddPaymentInfo'
  | 'AddToCart'
  | 'AddToWishlist'
  | 'InitiateCheckout'
  | 'Search'
  | 'ViewContent'
  | 'Contact'
  | 'CustomizeProduct'
  | 'Donate'
  | 'FindLocation'
  | 'Schedule'
  | 'StartTrial'
  | 'SubmitApplication'
  | 'Subscribe';

export type MatchQuality = 'A' | 'B' | 'C' | 'D';

export interface UserData {
  em?: string; // email (hashed)
  ph?: string; // phone (hashed)
  fn?: string; // first name (hashed)
  ln?: string; // last name (hashed)
  ct?: string; // city (hashed)
  st?: string; // state (hashed)
  zp?: string; // zip code (hashed)
  country?: string; // country code
  ge?: string; // gender (hashed)
  db?: string; // date of birth (hashed)
  external_id?: string; // user ID
  client_ip_address?: string;
  client_user_agent?: string;
  fbc?: string; // Facebook click ID
  fbp?: string; // Facebook browser ID
}

export interface ConversionEvent {
  event_name: StandardEvent | string;
  event_time: number;
  event_id?: string;
  user_data: UserData;
  custom_data?: Record<string, any>;
  action_source: 'website' | 'app' | 'email' | 'phone_call' | 'chat' | 'physical_store' | 'system_generated' | 'other';
}

export interface EventDiagnostics {
  pixel_id: string;
  event_count: number;
  match_quality: MatchQuality;
  matched_parameters: number;
  total_parameters: number;
  issues: string[];
  recommendations: string[];
}

export interface PixelCode {
  base_code: string;
  event_snippet: string;
  capi_handler: string;
  gtm_tag: string;
}

// ===== Module 6: レポート自動生成 =====

export type ReportLevel = 'account' | 'campaign' | 'adset' | 'ad';

export type MetricsPreset = 'overview' | 'conversions' | 'engagement' | 'video' | 'full';

export type DatePreset =
  | 'today'
  | 'yesterday'
  | 'last_3d'
  | 'last_7d'
  | 'last_14d'
  | 'last_30d'
  | 'last_90d'
  | 'this_week'
  | 'this_month'
  | 'this_quarter'
  | 'this_year';

export type Breakdown =
  | 'age'
  | 'gender'
  | 'country'
  | 'region'
  | 'dma'
  | 'placement'
  | 'device_platform'
  | 'publisher_platform'
  | 'platform_position'
  | 'impression_device';

export interface PerformanceMetrics {
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number; // %
  cpc: number;
  cpm: number;
  reach?: number;
  frequency?: number;
  conversions?: number;
  conversion_rate?: number; // %
  cpa?: number;
  roas?: number;
  video_views?: number;
  video_view_rate?: number; // %
  engagement?: number;
  engagement_rate?: number; // %
  link_clicks?: number;
  cost_per_link_click?: number;
}

export interface PerformanceReport {
  level: ReportLevel;
  date_preset: DatePreset;
  date_range: {
    since: string;
    until: string;
  };
  summary: PerformanceMetrics;
  top_performers: Array<{
    id: string;
    name: string;
    metrics: PerformanceMetrics;
  }>;
  recommendations: string[];
}

export interface CreativeReport {
  creative_analysis: Array<{
    creative_id: string;
    creative_name: string;
    format: string;
    metrics: PerformanceMetrics;
    performance_grade: 'A' | 'B' | 'C' | 'D' | 'F';
  }>;
  best_performing_elements: {
    headlines: string[];
    images: string[];
    ctas: string[];
  };
  recommendations: string[];
}

export interface AudienceReport {
  audience_breakdown: Array<{
    segment: string;
    value: string;
    metrics: PerformanceMetrics;
    percentage_of_total: number;
  }>;
  top_segments: Array<{
    dimension: string;
    value: string;
    metrics: PerformanceMetrics;
  }>;
  recommendations: string[];
}

export interface TrendReport {
  trend_data: Array<{
    date: string;
    metrics: PerformanceMetrics;
  }>;
  insights: {
    growth_rate: number;
    trend_direction: 'up' | 'down' | 'stable';
    anomalies: Array<{
      date: string;
      metric: string;
      value: number;
      deviation: number;
    }>;
  };
  recommendations: string[];
}

export interface ExportedReport {
  format: 'markdown' | 'csv' | 'text';
  content: string;
  filename: string;
  size_bytes: number;
}
