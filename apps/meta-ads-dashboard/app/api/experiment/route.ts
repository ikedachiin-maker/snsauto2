import { NextRequest, NextResponse } from 'next/server';
import {
  generateMetrics,
  generateExcellentMetrics,
  generatePoorMetrics,
  generateExperimentId,
  generateAdSetId,
  generateTimestamp,
  randomChoice,
  randomInt,
  randomFloat,
} from '@/lib/mock-data';
import type {
  Experiment,
  ExperimentResults,
  TestVariable,
  TestObjective,
  ConfidenceLevel,
  WinnerAction,
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

    const mcpResult = await callMCP('meta-experiment-mcp', action, params);

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
    case 'create_experiment':
      return generateCreateExperiment(params);

    case 'list_experiments':
      return generateListExperiments(params);

    case 'get_experiment_results':
      return generateExperimentResults(params);

    case 'end_experiment':
      return generateEndExperiment(params);

    case 'analyze_winner':
      return generateAnalyzeWinner(params);

    default:
      return { message: 'アクションが実装されていません' };
  }
}

// ===== Tool 1: create_experiment =====

function generateCreateExperiment(params: any): {
  experiment: Experiment;
  variants: Array<{ id: string; name: string; adset_id: string }>;
  dry_run: boolean;
} {
  const experimentId = generateExperimentId();
  const experimentName = params.experiment_name || 'A/Bテスト実験';
  const testVariable: TestVariable = params.test_variable || 'creative';
  const objective: TestObjective = params.objective || 'cost_per_result';
  const confidenceLevel: ConfidenceLevel = params.confidence_level || 90;

  // バリアント生成（2-4個）
  const variantCount = params.variant_count || 2;
  const variants = Array.from({ length: variantCount }, (_, i) => ({
    id: `variant_${i + 1}`,
    name: `バリアント${String.fromCharCode(65 + i)}`, // A, B, C, D
    adset_id: generateAdSetId(),
  }));

  const experiment: Experiment = {
    id: experimentId,
    name: experimentName,
    test_variable: testVariable,
    objective,
    confidence_level: confidenceLevel,
    variants,
    status: 'RUNNING',
    start_time: generateTimestamp(),
  };

  return {
    experiment,
    variants,
    dry_run: params.dry_run !== false,
  };
}

// ===== Tool 2: list_experiments =====

function generateListExperiments(params: any): { experiments: Experiment[] } {
  const testVariables: TestVariable[] = [
    'creative',
    'audience',
    'placement',
    'optimization',
    'bid_strategy',
  ];

  const experiments: Experiment[] = Array.from({ length: 3 }, (_, i) => {
    const variantCount = randomInt(2, 3);
    const variants = Array.from({ length: variantCount }, (_, j) => ({
      id: `variant_${j + 1}`,
      name: `バリアント${String.fromCharCode(65 + j)}`,
      adset_id: generateAdSetId(),
    }));

    const status = i === 0 ? 'RUNNING' : i === 1 ? 'COMPLETED' : 'PAUSED';
    const daysAgo = i * 7;

    return {
      id: generateExperimentId(),
      name: `${randomChoice(testVariables)}テスト ${i + 1}`,
      test_variable: randomChoice(testVariables),
      objective: 'cost_per_result' as TestObjective,
      confidence_level: 90 as ConfidenceLevel,
      variants,
      status: status as 'RUNNING' | 'PAUSED' | 'COMPLETED',
      start_time: generateTimestamp(daysAgo + 14),
      end_time: status === 'COMPLETED' ? generateTimestamp(daysAgo) : undefined,
    };
  });

  return { experiments };
}

// ===== Tool 3: get_experiment_results =====

function generateExperimentResults(params: any): { results: ExperimentResults } {
  const experimentId = params.experiment_id || generateExperimentId();
  const variantCount = params.variant_count || 2;

  // バリアント別メトリクス生成
  const variants = Array.from({ length: variantCount }, (_, i) => {
    const spend = randomInt(80000, 120000);
    let metrics;

    if (i === 0) {
      // 勝者: 優れたメトリクス
      metrics = generateExcellentMetrics(spend);
    } else if (i === variantCount - 1) {
      // 敗者: 劣ったメトリクス
      metrics = generatePoorMetrics(spend);
    } else {
      // 中間: 標準メトリクス
      metrics = generateMetrics(spend);
    }

    // 統計分析
    const isWinner = i === 0;
    const confidence = isWinner ? randomInt(85, 98) : randomInt(30, 70);
    const pValue = isWinner ? randomFloat(0.001, 0.05, 3) : randomFloat(0.1, 0.5, 3);

    return {
      id: `variant_${i + 1}`,
      name: `バリアント${String.fromCharCode(65 + i)}`,
      metrics,
      is_winner: isWinner,
      confidence,
      p_value: pValue,
    };
  });

  // 勝者情報
  const winner = variants[0];
  const loser = variants[variants.length - 1];
  const lift = ((winner.metrics.roas! - loser.metrics.roas!) / loser.metrics.roas!) * 100;

  const results: ExperimentResults = {
    experiment_id: experimentId,
    variants,
    winner: {
      variant_id: winner.id,
      lift: parseFloat(lift.toFixed(2)),
      confidence: winner.confidence,
    },
    statistical_significance: winner.p_value < 0.05,
  };

  return { results };
}

// ===== Tool 4: end_experiment =====

function generateEndExperiment(params: any): {
  experiment_id: string;
  previous_status: string;
  new_status: string;
  end_time: string;
  final_results: ExperimentResults;
} {
  const experimentId = params.experiment_id || generateExperimentId();
  const finalResults = generateExperimentResults({ experiment_id: experimentId }).results;

  return {
    experiment_id: experimentId,
    previous_status: 'RUNNING',
    new_status: 'COMPLETED',
    end_time: generateTimestamp(),
    final_results: finalResults,
  };
}

// ===== Tool 5: analyze_winner =====

function generateAnalyzeWinner(params: any): {
  experiment_id: string;
  winner: {
    variant_id: string;
    variant_name: string;
    metrics: any;
    improvement_over_baseline: {
      ctr: number;
      cpc: number;
      cpa: number;
      roas: number;
    };
  };
  action_taken: string;
  recommendations: string[];
} {
  const experimentId = params.experiment_id || generateExperimentId();
  const winnerAction: WinnerAction = params.winner_action || 'scale_budget';

  const results = generateExperimentResults({ experiment_id: experimentId }).results;
  const winner = results.variants[0];

  // ベースラインとの改善率
  const baseline = results.variants[results.variants.length - 1];
  const improvement = {
    ctr: parseFloat((((winner.metrics.ctr - baseline.metrics.ctr) / baseline.metrics.ctr) * 100).toFixed(2)),
    cpc: parseFloat((((baseline.metrics.cpc - winner.metrics.cpc) / baseline.metrics.cpc) * 100).toFixed(2)),
    cpa: winner.metrics.cpa && baseline.metrics.cpa
      ? parseFloat((((baseline.metrics.cpa - winner.metrics.cpa) / baseline.metrics.cpa) * 100).toFixed(2))
      : 0,
    roas: winner.metrics.roas && baseline.metrics.roas
      ? parseFloat((((winner.metrics.roas - baseline.metrics.roas) / baseline.metrics.roas) * 100).toFixed(2))
      : 0,
  };

  let actionTaken = '';
  const recommendations: string[] = [];

  switch (winnerAction) {
    case 'scale_budget':
      actionTaken = `勝者バリアント（${winner.name}）の予算を1.5倍に拡大しました`;
      recommendations.push('✅ 勝者バリアントに予算を集中させることでROASを最大化できます');
      recommendations.push('📊 1週間後にパフォーマンスを再評価することを推奨します');
      break;
    case 'pause_losers':
      actionTaken = `敗者バリアントを一時停止し、勝者のみを配信しています`;
      recommendations.push('✅ 不要な広告費削減に成功しました');
      recommendations.push('🔄 新しいバリアントでさらなる改善を目指しましょう');
      break;
    case 'apply_and_end':
      actionTaken = `勝者バリアントを適用し、実験を終了しました`;
      recommendations.push('✅ A/Bテストの知見を次のキャンペーンに活用しましょう');
      break;
    case 'report_only':
      actionTaken = `レポートのみ生成しました。アクションは実行されていません`;
      recommendations.push('💡 結果を確認の上、手動でアクションを実行してください');
      break;
  }

  recommendations.push(
    `📈 CTRが${improvement.ctr}%向上しました`,
    `💰 CPCが${improvement.cpc}%削減されました`,
    winner.metrics.roas && baseline.metrics.roas
      ? `🎯 ROASが${improvement.roas}%向上しました`
      : '📊 継続的なA/Bテストで最適化を進めましょう'
  );

  return {
    experiment_id: experimentId,
    winner: {
      variant_id: winner.id,
      variant_name: winner.name,
      metrics: winner.metrics,
      improvement_over_baseline: improvement,
    },
    action_taken: actionTaken,
    recommendations,
  };
}
