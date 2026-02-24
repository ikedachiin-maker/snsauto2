import { NextRequest, NextResponse } from 'next/server';
import {
  generateMetrics,
  generateCampaignId,
  generateRuleId,
  generateCurlPreview,
  generateTimestamp,
  generateRecommendations,
  randomChoice,
  randomInt,
  DUMMY_CAMPAIGN_NAMES,
} from '@/lib/mock-data';
import type { BudgetOverview, BudgetRule, RuleTemplate, BidStrategy } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, params } = body;

    // デモモード: 実際のMCP呼び出しの代わりにモックデータを返す
    const mockResponse = {
      action,
      params,
      result: {
        status: 'success',
        message: 'デモモード: 実際のAPI呼び出しは行われていません',
        data: generateMockData(action, params),
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(mockResponse);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function generateMockData(action: string, params: any) {
  switch (action) {
    case 'get_budget_overview':
      return generateBudgetOverview(params);

    case 'update_budget':
      return generateUpdateBudget(params);

    case 'create_rule':
      return generateCreateRule(params);

    case 'list_rules':
      return generateListRules(params);

    case 'evaluate_rules':
      return generateEvaluateRules(params);

    default:
      return { message: 'アクションが実装されていません' };
  }
}

// ===== Tool 1: get_budget_overview =====

function generateBudgetOverview(params: any): { overview: BudgetOverview } {
  const totalBudget = 500000;
  const totalSpend = randomInt(300000, 450000);
  const remaining = totalBudget - totalSpend;

  // キャンペーン一覧（5件）
  const campaigns = Array.from({ length: 5 }, (_, i) => {
    const budget = randomInt(50000, 150000);
    const spend = randomInt(budget * 0.5, budget * 0.95);

    return {
      id: generateCampaignId(),
      name: randomChoice(DUMMY_CAMPAIGN_NAMES),
      budget,
      spend: Math.floor(spend),
      status: i < 3 ? ('ACTIVE' as const) : ('PAUSED' as const),
    };
  });

  const overview: BudgetOverview = {
    account_id: `act_${process.env.META_AD_ACCOUNT_ID || '0000000000'}`,
    total_budget: totalBudget,
    total_spend: totalSpend,
    remaining,
    campaigns,
    recommendations: [
      `💰 予算残高: ¥${remaining.toLocaleString()} (${((remaining / totalBudget) * 100).toFixed(1)}%)`,
      totalSpend / totalBudget > 0.8
        ? '⚠️ 予算消化率が80%を超えています。追加予算の検討を推奨します'
        : '✅ 予算消化は健全なペースです',
      '📊 パフォーマンスの高いキャンペーンに予算を再配分することでROASを向上できます',
      '🎯 CPA目標を設定してcost_cap入札戦略の導入を検討しましょう',
    ],
  };

  return { overview };
}

// ===== Tool 2: update_budget =====

function generateUpdateBudget(params: any): {
  campaign_id: string;
  previous_budget: number;
  new_budget: number;
  previous_bid_strategy?: BidStrategy;
  new_bid_strategy?: BidStrategy;
  updated_time: string;
  curl_preview: string;
  dry_run: boolean;
} {
  const campaignId = params.campaign_id || generateCampaignId();
  const previousBudget = 50000;
  const newBudget = params.daily_budget || 80000;
  const previousBidStrategy: BidStrategy = 'lowest_cost';
  const newBidStrategy: BidStrategy = params.bid_strategy || previousBidStrategy;

  const curlParams: any = {};
  if (newBudget !== previousBudget) {
    curlParams.daily_budget = newBudget * 100; // JPYセント単位
  }
  if (newBidStrategy !== previousBidStrategy) {
    curlParams.bid_strategy = newBidStrategy.toUpperCase();
  }
  if (params.bid_amount) {
    curlParams.bid_amount = params.bid_amount * 100;
  }

  const curlPreview = generateCurlPreview(campaignId, 'POST', curlParams);

  return {
    campaign_id: campaignId,
    previous_budget: previousBudget,
    new_budget: newBudget,
    previous_bid_strategy: previousBidStrategy,
    new_bid_strategy: newBidStrategy,
    updated_time: generateTimestamp(),
    curl_preview: curlPreview,
    dry_run: params.dry_run !== false,
  };
}

// ===== Tool 3: create_rule =====

function generateCreateRule(params: any): {
  rule: BudgetRule;
  dry_run: boolean;
} {
  const ruleId = generateRuleId();
  const ruleName = params.rule_name || 'カスタムルール';
  const entityType = params.entity_type || 'campaign';
  const entityId = params.entity_id || generateCampaignId();

  // テンプレートからルールを生成
  let conditions, action, actionParams;

  if (params.template_id) {
    const template = getRuleTemplate(params.template_id);
    conditions = template.conditions;
    action = template.action;
    actionParams = template.action_params;
  } else {
    // カスタムルール
    conditions = params.conditions || [
      { metric: 'cpa', operator: '>' as const, value: 5000 },
    ];
    action = params.action || 'pause';
    actionParams = params.action_params || {};
  }

  const rule: BudgetRule = {
    id: ruleId,
    name: ruleName,
    entity_type: entityType as 'campaign' | 'adset' | 'ad',
    entity_id: entityId,
    conditions,
    action: action as 'pause' | 'scale' | 'alert' | 'adjust_budget' | 'adjust_bid',
    action_params: actionParams,
    enabled: params.enabled !== false,
    created_at: generateTimestamp(),
  };

  return {
    rule,
    dry_run: params.dry_run !== false,
  };
}

// ===== Tool 4: list_rules =====

function generateListRules(params: any): { rules: BudgetRule[] } {
  const ruleTemplates = [
    {
      id: 'pause_high_cpa',
      name: '高CPA一時停止ルール',
      conditions: [{ metric: 'cpa', operator: '>' as const, value: 5000 }],
      action: 'pause' as const,
    },
    {
      id: 'scale_winner',
      name: '勝者予算拡大ルール',
      conditions: [
        { metric: 'roas', operator: '>' as const, value: 5 },
        { metric: 'conversions', operator: '>' as const, value: 10 },
      ],
      action: 'scale' as const,
      action_params: { scale_factor: 1.5 },
    },
    {
      id: 'frequency_cap',
      name: 'フリクエンシー上限ルール',
      conditions: [{ metric: 'frequency', operator: '>' as const, value: 5 }],
      action: 'pause' as const,
    },
  ];

  const rules: BudgetRule[] = ruleTemplates.map((template, idx) => ({
    id: generateRuleId(),
    name: template.name,
    entity_type: 'campaign' as const,
    entity_id: generateCampaignId(),
    conditions: template.conditions,
    action: template.action,
    action_params: template.action_params,
    enabled: idx < 2, // 最初の2つは有効
    created_at: generateTimestamp(idx * 7), // 1週間ごとに作成
  }));

  return { rules };
}

// ===== Tool 5: evaluate_rules =====

function generateEvaluateRules(params: any): {
  evaluation_results: Array<{
    rule_id: string;
    rule_name: string;
    triggered: boolean;
    reason: string;
    action_taken?: string;
    affected_entities: string[];
  }>;
  summary: {
    total_rules: number;
    rules_triggered: number;
    entities_affected: number;
  };
} {
  const rules = generateListRules({}).rules;

  const evaluationResults = rules.map((rule) => {
    // ランダムにトリガー判定（30%の確率）
    const triggered = Math.random() < 0.3;
    const affectedCount = triggered ? randomInt(1, 3) : 0;

    let reason = '';
    let actionTaken = '';

    if (triggered) {
      const condition = rule.conditions[0];
      reason = `${condition.metric.toUpperCase()} ${condition.operator} ${condition.value} の条件を満たしました`;

      switch (rule.action) {
        case 'pause':
          actionTaken = `${affectedCount}件のエンティティを一時停止しました`;
          break;
        case 'scale':
          const scaleFactor = rule.action_params?.scale_factor || 1.5;
          actionTaken = `${affectedCount}件のエンティティの予算を${scaleFactor}倍に拡大しました`;
          break;
        case 'alert':
          actionTaken = `アラート通知を送信しました`;
          break;
        case 'adjust_budget':
          actionTaken = `${affectedCount}件のエンティティの予算を調整しました`;
          break;
        case 'adjust_bid':
          actionTaken = `${affectedCount}件のエンティティの入札額を調整しました`;
          break;
      }
    } else {
      reason = '条件を満たしていません';
    }

    return {
      rule_id: rule.id,
      rule_name: rule.name,
      triggered,
      reason,
      action_taken: triggered ? actionTaken : undefined,
      affected_entities: triggered
        ? Array.from({ length: affectedCount }, () => generateCampaignId())
        : [],
    };
  });

  const triggeredCount = evaluationResults.filter((r) => r.triggered).length;
  const affectedCount = evaluationResults.reduce((sum, r) => sum + r.affected_entities.length, 0);

  return {
    evaluation_results: evaluationResults,
    summary: {
      total_rules: rules.length,
      rules_triggered: triggeredCount,
      entities_affected: affectedCount,
    },
  };
}

// ===== ヘルパー関数 =====

function getRuleTemplate(templateId: string): RuleTemplate {
  const templates: Record<string, RuleTemplate> = {
    pause_high_cpa: {
      id: 'pause_high_cpa',
      name: '高CPA一時停止',
      description: 'CPAが目標値を超えた場合に広告を一時停止',
      conditions: [{ metric: 'cpa', operator: '>', value: 5000 }],
      action: 'pause',
    },
    scale_winner: {
      id: 'scale_winner',
      name: '勝者予算拡大',
      description: 'ROASが高く、コンバージョンが発生している広告の予算を拡大',
      conditions: [
        { metric: 'roas', operator: '>', value: 5 },
        { metric: 'conversions', operator: '>', value: 10 },
      ],
      action: 'scale',
      action_params: { scale_factor: 1.5 },
    },
    frequency_cap: {
      id: 'frequency_cap',
      name: 'フリクエンシー上限',
      description: 'フリクエンシーが高すぎる場合に一時停止',
      conditions: [{ metric: 'frequency', operator: '>', value: 5 }],
      action: 'pause',
    },
    low_ctr_alert: {
      id: 'low_ctr_alert',
      name: '低CTRアラート',
      description: 'CTRが低い場合にアラート送信',
      conditions: [{ metric: 'ctr', operator: '<', value: 1.0 }],
      action: 'alert',
    },
    roas_scaledown: {
      id: 'roas_scaledown',
      name: 'ROAS低下時予算削減',
      description: 'ROASが目標を下回る場合に予算を削減',
      conditions: [{ metric: 'roas', operator: '<', value: 2 }],
      action: 'adjust_budget',
      action_params: { scale_factor: 0.7 },
    },
  };

  return templates[templateId] || templates.pause_high_cpa;
}
