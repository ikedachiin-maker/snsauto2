// ── Statistical Significance Engine for A/B Testing ─────────────────

import { TEST_OBJECTIVES } from "./config.js";

// ── Z-Score Table (for significance calculation) ────────────────────

const Z_TABLE = {
  65: 0.935,
  80: 1.282,
  90: 1.645,
  95: 1.960,
  99: 2.576,
};

// ── Core Statistical Functions ──────────────────────────────────────

// Standard normal CDF approximation (Abramowitz & Stegun)
function normalCDF(z) {
  if (z < -6) return 0;
  if (z > 6) return 1;

  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

// Calculate Z-score for two proportions (e.g., CTR, CVR)
function zScoreProportions(p1, n1, p2, n2) {
  const pPool = (p1 * n1 + p2 * n2) / (n1 + n2);
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / n1 + 1 / n2));
  if (se === 0) return 0;
  return (p1 - p2) / se;
}

// Calculate Z-score for two means (e.g., CPA, ROAS)
function zScoreMeans(mean1, n1, std1, mean2, n2, std2) {
  const se = Math.sqrt((std1 * std1) / n1 + (std2 * std2) / n2);
  if (se === 0) return 0;
  return (mean1 - mean2) / se;
}

// ── Main Analysis Function ──────────────────────────────────────────

export function analyzeExperiment(variants, testObjective, confidenceLevel = 90) {
  const objDef = TEST_OBJECTIVES[testObjective];
  if (!objDef) {
    throw new Error(`Unknown test objective: ${testObjective}`);
  }

  const zThreshold = Z_TABLE[confidenceLevel] || Z_TABLE[90];
  const isHigherBetter = objDef.direction === "higher_better";

  // Extract metrics for each variant
  const analyzed = variants.map((v) => {
    const metrics = extractVariantMetrics(v);
    return {
      id: v.id || v.variant_id,
      name: v.name || v.label,
      ...metrics,
      primary_metric: metrics[testObjective] ?? 0,
    };
  });

  // Sort: best performer first
  analyzed.sort((a, b) =>
    isHigherBetter
      ? b.primary_metric - a.primary_metric
      : a.primary_metric - b.primary_metric
  );

  // Pairwise significance tests (each variant vs best)
  const best = analyzed[0];
  const comparisons = [];

  for (let i = 1; i < analyzed.length; i++) {
    const challenger = analyzed[i];
    const comparison = calculateSignificance(
      best, challenger, testObjective, zThreshold, isHigherBetter
    );
    comparisons.push(comparison);
  }

  // Determine winner
  const allSignificant = comparisons.length > 0 && comparisons.every((c) => c.significant);
  const anySignificant = comparisons.some((c) => c.significant);

  // Sample size check
  const minConversions = 50;
  const sufficientData = analyzed.every((v) => (v.conversions || v.clicks || 0) >= minConversions);

  let status;
  if (allSignificant && sufficientData) {
    status = "winner_found";
  } else if (anySignificant) {
    status = "partial_significance";
  } else if (!sufficientData) {
    status = "insufficient_data";
  } else {
    status = "no_significant_difference";
  }

  return {
    test_objective: testObjective,
    objective_label: objDef.label,
    direction: objDef.direction,
    confidence_level: confidenceLevel,
    z_threshold: zThreshold,
    status,
    status_label: STATUS_LABELS[status],
    leader: {
      id: best.id,
      name: best.name,
      primary_metric: best.primary_metric,
    },
    variants: analyzed.map((v) => ({
      id: v.id,
      name: v.name,
      primary_metric: v.primary_metric,
      spend: v.spend,
      impressions: v.impressions,
      clicks: v.clicks,
      conversions: v.conversions,
      ctr: v.ctr,
      cpc: v.cpc,
      cpa: v.cpa,
      roas: v.roas,
    })),
    comparisons,
    recommendation: generateRecommendation(status, best, analyzed, comparisons, objDef),
    sufficient_data: sufficientData,
  };
}

const STATUS_LABELS = {
  winner_found: "勝者確定 - 統計的有意差あり",
  partial_significance: "一部有意差あり - テスト継続推奨",
  insufficient_data: "データ不足 - テスト継続が必要",
  no_significant_difference: "有意差なし - 差がない可能性",
};

// ── Metric Extraction ───────────────────────────────────────────────

function extractVariantMetrics(variant) {
  // Handle both raw insights format and pre-processed format
  const spend = parseFloat(variant.spend || 0);
  const impressions = parseInt(variant.impressions || 0);
  const clicks = parseInt(variant.clicks || 0);
  const reach = parseInt(variant.reach || 0);

  // Extract conversions from actions array or direct field
  let conversions = 0;
  if (variant.conversions != null) {
    conversions = parseInt(variant.conversions);
  } else if (variant.actions) {
    const cvAction = variant.actions.find(
      (a) => a.action_type === "purchase" || a.action_type === "lead" || a.action_type === "offsite_conversion.fb_pixel_purchase"
    );
    conversions = parseInt(cvAction?.value || 0);
  }

  // CPA
  let cpa = 0;
  if (variant.cpa != null) {
    cpa = parseFloat(variant.cpa);
  } else if (variant.cost_per_action_type) {
    const cpaEntry = variant.cost_per_action_type.find(
      (c) => c.action_type === "purchase" || c.action_type === "lead"
    );
    cpa = parseFloat(cpaEntry?.value || 0);
  } else if (conversions > 0) {
    cpa = spend / conversions;
  }

  // ROAS
  let roas = 0;
  if (variant.roas != null) {
    roas = parseFloat(variant.roas);
  } else if (variant.purchase_roas) {
    roas = parseFloat(variant.purchase_roas[0]?.value || 0);
  }

  const ctr = impressions > 0 ? (clicks / impressions) * 100 : parseFloat(variant.ctr || 0);
  const cpc = clicks > 0 ? spend / clicks : parseFloat(variant.cpc || 0);
  const cpm = impressions > 0 ? (spend / impressions) * 1000 : parseFloat(variant.cpm || 0);
  const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;

  return {
    spend,
    impressions,
    clicks,
    reach,
    conversions,
    ctr,
    cpc,
    cpm,
    cpa,
    roas,
    conversion_rate: conversionRate,
    cost_per_result: cpa,
  };
}

// ── Significance Calculation ────────────────────────────────────────

function calculateSignificance(varA, varB, testObjective, zThreshold, isHigherBetter) {
  let zScore = 0;
  let pValue = 1;

  switch (testObjective) {
    case "ctr":
    case "conversion_rate": {
      const pA = (varA[testObjective] || 0) / 100;
      const pB = (varB[testObjective] || 0) / 100;
      const nA = testObjective === "ctr" ? varA.impressions : varA.clicks;
      const nB = testObjective === "ctr" ? varB.impressions : varB.clicks;
      if (nA > 0 && nB > 0) {
        zScore = zScoreProportions(pA, nA, pB, nB);
      }
      break;
    }

    case "cost_per_result":
    case "cpc":
    case "cpm":
    case "roas": {
      const mA = varA[testObjective] || varA.primary_metric || 0;
      const mB = varB[testObjective] || varB.primary_metric || 0;
      // Estimate std dev as ~30% of mean (heuristic for ad metrics)
      const stdA = mA * 0.3 || 1;
      const stdB = mB * 0.3 || 1;
      const nA = varA.conversions || varA.clicks || 1;
      const nB = varB.conversions || varB.clicks || 1;
      zScore = zScoreMeans(mA, nA, stdA, mB, nB, stdB);
      break;
    }

    default:
      break;
  }

  // Absolute z-score for two-tailed test
  const absZ = Math.abs(zScore);
  pValue = 2 * (1 - normalCDF(absZ));
  const significant = absZ >= zThreshold;

  const lift = varA.primary_metric !== 0
    ? ((varA.primary_metric - varB.primary_metric) / Math.abs(varB.primary_metric)) * 100
    : 0;

  return {
    variant_a: { id: varA.id, name: varA.name, value: varA.primary_metric },
    variant_b: { id: varB.id, name: varB.name, value: varB.primary_metric },
    z_score: Math.round(zScore * 1000) / 1000,
    p_value: Math.round(pValue * 10000) / 10000,
    significant,
    lift_percent: Math.round(lift * 100) / 100,
    interpretation: significant
      ? `${varA.name}は${varB.name}より${isHigherBetter ? "高い" : "低い"}パフォーマンス（有意差あり, p=${pValue.toFixed(4)}）`
      : `${varA.name}と${varB.name}の間に統計的有意差なし（p=${pValue.toFixed(4)}）`,
  };
}

// ── Recommendation Generation ───────────────────────────────────────

function generateRecommendation(status, best, analyzed, comparisons, objDef) {
  switch (status) {
    case "winner_found":
      return {
        action: "scale_winner",
        message: `「${best.name}」が明確な勝者です。${objDef.label}: ${best.primary_metric.toFixed(2)}。予算スケールと敗者停止を推奨します。`,
        winner_id: best.id,
        loser_ids: analyzed.slice(1).map((v) => v.id),
      };

    case "partial_significance":
      return {
        action: "continue_test",
        message: `一部有意差あり。「${best.name}」がリード中ですが、全バリアント間の有意差確認にはテスト継続が必要です。`,
        leader_id: best.id,
      };

    case "insufficient_data":
      return {
        action: "continue_test",
        message: "データが不足しています。各バリアントで最低50コンバージョン達成までテストを継続してください。",
        needed: analyzed.map((v) => ({
          name: v.name,
          current_conversions: v.conversions || 0,
          needed: Math.max(0, 50 - (v.conversions || 0)),
        })),
      };

    case "no_significant_difference":
      return {
        action: "no_action",
        message: "統計的有意差が見られません。バリアント間に大きな差がない可能性があります。テスト変数を変更するか、より大きな差のあるバリエーションを試してください。",
      };

    default:
      return { action: "review", message: "結果を確認してください。" };
  }
}

// ── Generate Demo Results ───────────────────────────────────────────

export function generateDemoResults(variantCount = 2, testObjective = "cost_per_result") {
  const variants = [];
  for (let i = 0; i < variantCount; i++) {
    const multiplier = i === 0 ? 1 : 0.7 + Math.random() * 0.6; // Random performance variation
    const baseSpend = 15000 + Math.random() * 10000;
    const baseImpressions = 40000 + Math.random() * 30000;
    const baseClicks = baseImpressions * (0.008 + Math.random() * 0.015);
    const baseConversions = Math.floor(baseClicks * (0.02 + Math.random() * 0.05) * multiplier);

    variants.push({
      id: `demo_variant_${String.fromCharCode(65 + i).toLowerCase()}`,
      name: `Variant ${String.fromCharCode(65 + i)}`,
      spend: Math.round(baseSpend).toString(),
      impressions: Math.round(baseImpressions).toString(),
      clicks: Math.round(baseClicks).toString(),
      reach: Math.round(baseImpressions * 0.7).toString(),
      conversions: baseConversions,
      ctr: ((baseClicks / baseImpressions) * 100).toFixed(2),
      cpc: (baseSpend / baseClicks).toFixed(2),
      cpa: baseConversions > 0 ? (baseSpend / baseConversions).toFixed(2) : "0",
      roas: baseConversions > 0 ? ((baseConversions * 5000) / baseSpend).toFixed(2) : "0",
    });
  }
  return variants;
}
