import { NextRequest, NextResponse } from 'next/server';
import {
  generateMetrics,
  generateExcellentMetrics,
  generatePoorMetrics,
  generateDateRange,
  generateRecommendations,
  generateTimestamp,
  randomChoice,
  randomInt,
  DUMMY_CAMPAIGN_NAMES,
} from '@/lib/mock-data';
import type {
  PerformanceReport,
  CreativeReport,
  AudienceReport,
  TrendReport,
  ExportedReport,
  ReportLevel,
  DatePreset,
  MetricsPreset,
  Breakdown,
} from '@/lib/types';
import { callMCP, isDemoMode } from '@/lib/mcp-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, params } = body;

    if (isDemoMode()) {
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
    }

    const mcpResult = await callMCP('meta-report-mcp', action, params);

    if (!mcpResult.success) {
      return NextResponse.json(
        {
          action,
          params,
          result: {
            status: 'error',
            message: mcpResult.error?.message || 'MCP呼び出しに失敗しました',
            error: mcpResult.error,
          },
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      action,
      params,
      result: {
        status: 'success',
        message: 'MCP経由で実行されました',
        data: mcpResult.data,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function generateMockData(action: string, params: any) {
  switch (action) {
    case 'get_performance_report':
      return generatePerformanceReport(params);

    case 'get_creative_report':
      return generateCreativeReport(params);

    case 'get_audience_report':
      return generateAudienceReport(params);

    case 'get_trend_report':
      return generateTrendReport(params);

    case 'export_report':
      return generateExportReport(params);

    default:
      return { message: 'アクションが実装されていません' };
  }
}

// ===== Tool 1: get_performance_report =====

function generatePerformanceReport(params: any): { report: PerformanceReport } {
  const level: ReportLevel = params.level || 'campaign';
  const datePreset: DatePreset = params.date_preset || 'last_30d';
  const dateRange = generateDateRange(datePreset);

  // サマリーメトリクス
  const totalSpend = randomInt(100000, 500000);
  const summary = generateMetrics(totalSpend);

  // トップパフォーマー（3件）
  const topPerformers = [
    {
      id: `${level}_001`,
      name: randomChoice(DUMMY_CAMPAIGN_NAMES),
      metrics: generateExcellentMetrics(totalSpend * 0.4),
    },
    {
      id: `${level}_002`,
      name: randomChoice(DUMMY_CAMPAIGN_NAMES),
      metrics: generateMetrics(totalSpend * 0.35),
    },
    {
      id: `${level}_003`,
      name: randomChoice(DUMMY_CAMPAIGN_NAMES),
      metrics: generatePoorMetrics(totalSpend * 0.25),
    },
  ];

  const report: PerformanceReport = {
    level,
    date_preset: datePreset,
    date_range: dateRange,
    summary,
    top_performers: topPerformers,
    recommendations: generateRecommendations(summary),
  };

  return { report };
}

// ===== Tool 2: get_creative_report =====

function generateCreativeReport(params: any): { report: CreativeReport } {
  const creativeFormats = ['feed_square', 'feed_portrait', 'story', 'carousel'];
  const grades = ['A', 'B', 'C', 'D', 'F'] as const;

  const creativeAnalysis = creativeFormats.map((format, idx) => {
    const spend = randomInt(20000, 80000);
    const metrics = idx === 0 ? generateExcellentMetrics(spend) : idx === 3 ? generatePoorMetrics(spend) : generateMetrics(spend);

    return {
      creative_id: `creative_${idx + 1}`,
      creative_name: `${format.replace('_', ' ')} - バージョン${idx + 1}`,
      format,
      metrics,
      performance_grade: grades[idx] as 'A' | 'B' | 'C' | 'D' | 'F',
    };
  });

  const report: CreativeReport = {
    creative_analysis: creativeAnalysis,
    best_performing_elements: {
      headlines: ['期間限定50%オフ', '今だけ送料無料', '先着100名様限定'],
      images: ['商品単体（白背景）', 'ライフスタイルイメージ', 'ビフォーアフター'],
      ctas: ['今すぐ購入', '詳細を見る', '無料で試す'],
    },
    recommendations: [
      '📊 Feed Square フォーマットが最もパフォーマンスが高いです',
      '🎨 商品単体（白背景）画像のCTRが2.1倍高い結果です',
      '💡 「期間限定」を含む見出しのコンバージョン率が1.8倍向上しています',
      '⚠️ Carousel フォーマットのパフォーマンスが低下しています。クリエイティブの刷新を推奨します',
    ],
  };

  return { report };
}

// ===== Tool 3: get_audience_report =====

function generateAudienceReport(params: any): { report: AudienceReport } {
  const breakdown: Breakdown = params.breakdown || 'age';

  let audienceBreakdown: AudienceReport['audience_breakdown'] = [];

  if (breakdown === 'age') {
    const ageGroups = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
    audienceBreakdown = ageGroups.map((age) => {
      const spend = randomInt(10000, 80000);
      return {
        segment: 'age',
        value: age,
        metrics: generateMetrics(spend),
        percentage_of_total: randomInt(5, 35),
      };
    });
  } else if (breakdown === 'gender') {
    audienceBreakdown = [
      {
        segment: 'gender',
        value: '女性',
        metrics: generateMetrics(150000),
        percentage_of_total: 62,
      },
      {
        segment: 'gender',
        value: '男性',
        metrics: generateMetrics(100000),
        percentage_of_total: 38,
      },
    ];
  } else if (breakdown === 'country') {
    const countries = ['日本', 'アメリカ', 'イギリス', '韓国', '台湾'];
    audienceBreakdown = countries.map((country) => {
      const spend = randomInt(20000, 100000);
      return {
        segment: 'country',
        value: country,
        metrics: generateMetrics(spend),
        percentage_of_total: randomInt(10, 40),
      };
    });
  }

  // トップセグメント（パフォーマンス上位3件）
  const topSegments = audienceBreakdown
    .sort((a, b) => (b.metrics.roas || 0) - (a.metrics.roas || 0))
    .slice(0, 3)
    .map((seg) => ({
      dimension: seg.segment,
      value: seg.value,
      metrics: seg.metrics,
    }));

  const report: AudienceReport = {
    audience_breakdown: audienceBreakdown,
    top_segments: topSegments,
    recommendations: [
      `🎯 ${topSegments[0].value} セグメントのROASが${topSegments[0].metrics.roas}倍と最も高いです`,
      '💰 予算をトップパフォーマンスセグメントに配分することで全体ROASを向上できます',
      '📈 複数のセグメントでA/Bテストを実施し、最適なターゲットを特定しましょう',
    ],
  };

  return { report };
}

// ===== Tool 4: get_trend_report =====

function generateTrendReport(params: any): { report: TrendReport } {
  const datePreset: DatePreset = params.date_preset || 'last_30d';
  const days = datePreset === 'last_7d' ? 7 : datePreset === 'last_30d' ? 30 : 14;

  // 日別トレンドデータ生成
  const trendData = [];
  const baseSpend = randomInt(3000, 10000);

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    // トレンド: 徐々に増加（成長率 +2-5%/日）
    const daySpend = Math.floor(baseSpend * (1 + (days - 1 - i) * 0.03 + Math.random() * 0.02));

    trendData.push({
      date: date.toISOString().split('T')[0],
      metrics: generateMetrics(daySpend),
    });
  }

  // 成長率計算
  const firstWeekAvg = trendData.slice(0, 7).reduce((sum, d) => sum + d.metrics.spend, 0) / 7;
  const lastWeekAvg = trendData.slice(-7).reduce((sum, d) => sum + d.metrics.spend, 0) / 7;
  const growthRate = ((lastWeekAvg - firstWeekAvg) / firstWeekAvg) * 100;

  // 異常値検出（CTRが平均から±30%以上乖離）
  const avgCtr = trendData.reduce((sum, d) => sum + d.metrics.ctr, 0) / trendData.length;
  const anomalies = trendData
    .filter((d) => Math.abs(d.metrics.ctr - avgCtr) / avgCtr > 0.3)
    .map((d) => ({
      date: d.date,
      metric: 'CTR',
      value: d.metrics.ctr,
      deviation: ((d.metrics.ctr - avgCtr) / avgCtr) * 100,
    }));

  const report: TrendReport = {
    trend_data: trendData,
    insights: {
      growth_rate: parseFloat(growthRate.toFixed(2)),
      trend_direction: growthRate > 5 ? 'up' : growthRate < -5 ? 'down' : 'stable',
      anomalies,
    },
    recommendations: [
      growthRate > 0
        ? `📈 過去${days}日間で${growthRate.toFixed(1)}%の成長を記録しています`
        : `📉 過去${days}日間で${Math.abs(growthRate).toFixed(1)}%の減少が見られます`,
      anomalies.length > 0
        ? `⚠️ ${anomalies.length}件の異常値が検出されました。該当日のキャンペーン設定を確認してください`
        : '✅ 安定したパフォーマンス推移です',
      '💡 週末と平日でパフォーマンスが異なる場合、曜日別の予算配分を検討しましょう',
    ],
  };

  return { report };
}

// ===== Tool 5: export_report =====

function generateExportReport(params: any): { exported: ExportedReport } {
  const format = params.format || 'markdown';
  const reportType = params.report_type || 'performance';

  let content = '';
  let filename = '';

  if (format === 'markdown') {
    content = generateMarkdownReport(reportType);
    filename = `${reportType}_report_${new Date().toISOString().split('T')[0]}.md`;
  } else if (format === 'csv') {
    content = generateCSVReport(reportType);
    filename = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
  } else {
    content = generateTextReport(reportType);
    filename = `${reportType}_report_${new Date().toISOString().split('T')[0]}.txt`;
  }

  const exported: ExportedReport = {
    format: format as 'markdown' | 'csv' | 'text',
    content,
    filename,
    size_bytes: new Blob([content]).size,
  };

  return { exported };
}

// ===== レポート生成ヘルパー =====

function generateMarkdownReport(reportType: string): string {
  const metrics = generateMetrics(250000);

  return `# Meta広告 ${reportType === 'performance' ? 'パフォーマンス' : 'クリエイティブ'}レポート

**生成日時**: ${new Date().toLocaleString('ja-JP')}
**対象期間**: 過去30日間

---

## サマリー

| 指標 | 値 |
|------|-----|
| 広告費 | ¥${metrics.spend.toLocaleString()} |
| インプレッション | ${metrics.impressions.toLocaleString()} |
| クリック数 | ${metrics.clicks.toLocaleString()} |
| CTR | ${metrics.ctr}% |
| CPC | ¥${metrics.cpc} |
| コンバージョン数 | ${metrics.conversions} |
| CPA | ¥${metrics.cpa?.toLocaleString()} |
| ROAS | ${metrics.roas}x |

---

## 推奨事項

${generateRecommendations(metrics)
  .map((rec) => `- ${rec}`)
  .join('\n')}

---

*このレポートは Meta広告自動化ダッシュボード で生成されました*
`;
}

function generateCSVReport(reportType: string): string {
  const rows = [
    ['日付', '広告費', 'インプレッション', 'クリック数', 'CTR', 'CPC', 'コンバージョン数', 'CPA', 'ROAS'].join(','),
  ];

  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const metrics = generateMetrics(randomInt(30000, 50000));

    rows.push(
      [
        date.toISOString().split('T')[0],
        metrics.spend,
        metrics.impressions,
        metrics.clicks,
        metrics.ctr,
        metrics.cpc,
        metrics.conversions || 0,
        metrics.cpa || 0,
        metrics.roas || 0,
      ].join(',')
    );
  }

  return rows.join('\n');
}

function generateTextReport(reportType: string): string {
  const metrics = generateMetrics(250000);

  return `===========================================
Meta広告 ${reportType === 'performance' ? 'パフォーマンス' : 'クリエイティブ'}レポート
===========================================

生成日時: ${new Date().toLocaleString('ja-JP')}
対象期間: 過去30日間

-------------------------------------------
サマリー
-------------------------------------------
広告費: ¥${metrics.spend.toLocaleString()}
インプレッション: ${metrics.impressions.toLocaleString()}
クリック数: ${metrics.clicks.toLocaleString()}
CTR: ${metrics.ctr}%
CPC: ¥${metrics.cpc}
コンバージョン数: ${metrics.conversions}
CPA: ¥${metrics.cpa?.toLocaleString()}
ROAS: ${metrics.roas}x

-------------------------------------------
推奨事項
-------------------------------------------
${generateRecommendations(metrics)
  .map((rec, idx) => `${idx + 1}. ${rec}`)
  .join('\n')}

===========================================
このレポートは Meta広告自動化ダッシュボード で生成されました
===========================================
`;
}
