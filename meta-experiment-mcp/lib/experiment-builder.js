// ── Experiment Payload Builders ──────────────────────────────────────

import { getConfig, DURATION } from "./config.js";

// ── Build Experiment Creation Payload ───────────────────────────────

export function buildExperimentPayload({
  name,
  description,
  campaign_ids,
  start_time,
  end_time,
  duration_days,
  confidence_level = 90,
}) {
  const config = getConfig();

  // Calculate end time from duration if not specified
  const start = start_time ? new Date(start_time) : new Date();
  let end;
  if (end_time) {
    end = new Date(end_time);
  } else {
    const days = Math.max(DURATION.min_days, Math.min(DURATION.max_days, duration_days || DURATION.recommended_days));
    end = new Date(start);
    end.setDate(end.getDate() + days);
  }

  if (!campaign_ids || campaign_ids.length < 2) {
    throw new Error("最低2つのキャンペーンIDが必要です（バリアントA/B）");
  }
  if (campaign_ids.length > 5) {
    throw new Error("最大5つのバリアントまでです");
  }

  // Validate duration
  const durationMs = end.getTime() - start.getTime();
  const durationDays = durationMs / (1000 * 60 * 60 * 24);
  if (durationDays < DURATION.min_days) {
    throw new Error(`テスト期間は最低${DURATION.min_days}日必要です（指定: ${Math.round(durationDays)}日）`);
  }

  const payload = {
    name: name || `Experiment_${Date.now()}`,
    description: description || "",
    start_time: Math.floor(start.getTime() / 1000),
    end_time: Math.floor(end.getTime() / 1000),
    // Campaigns to compare as cells
    cells: JSON.stringify(
      campaign_ids.map((id, i) => ({
        name: `Variant ${String.fromCharCode(65 + i)}`,
        treatment_percentage: Math.floor(100 / campaign_ids.length),
        campaigns: [{ campaign_id: id }],
      }))
    ),
    confidence_level,
    objective: "CONVERSIONS",
  };

  return {
    endpoint: `act_${config.adAccountId}/experiments`,
    params: payload,
    meta: {
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      duration_days: Math.round(durationDays),
      variants: campaign_ids.length,
    },
  };
}

// ── Build Ad Set Level Experiment ───────────────────────────────────

export function buildAdSetExperimentPayload({
  name,
  campaign_id,
  adset_ids,
  duration_days,
  confidence_level = 90,
}) {
  const config = getConfig();

  if (!adset_ids || adset_ids.length < 2) {
    throw new Error("最低2つの広告セットIDが必要です");
  }

  const start = new Date();
  const days = Math.max(DURATION.min_days, Math.min(DURATION.max_days, duration_days || DURATION.recommended_days));
  const end = new Date(start);
  end.setDate(end.getDate() + days);

  const payload = {
    name: name || `AdSet_Experiment_${Date.now()}`,
    start_time: Math.floor(start.getTime() / 1000),
    end_time: Math.floor(end.getTime() / 1000),
    cells: JSON.stringify(
      adset_ids.map((id, i) => ({
        name: `Variant ${String.fromCharCode(65 + i)}`,
        treatment_percentage: Math.floor(100 / adset_ids.length),
        adsets: [{ adset_id: id }],
      }))
    ),
    confidence_level,
    objective: "CONVERSIONS",
  };

  return {
    endpoint: `act_${config.adAccountId}/experiments`,
    params: payload,
    meta: {
      campaign_id,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      duration_days: days,
      variants: adset_ids.length,
    },
  };
}

// ── Build Experiment Plan (dry_run overview) ────────────────────────

export function buildExperimentPlan({
  name,
  test_variable,
  test_objective,
  variant_ids,
  level = "campaign",
  duration_days = 7,
  confidence_level = 90,
  daily_budget_per_variant,
}) {
  return {
    name: name || `Experiment_${Date.now()}`,
    test_variable,
    test_objective,
    level,
    variants: variant_ids.map((id, i) => ({
      label: `Variant ${String.fromCharCode(65 + i)}`,
      id,
      traffic_split: `${Math.floor(100 / variant_ids.length)}%`,
      daily_budget: daily_budget_per_variant || "CBO任せ",
    })),
    duration: {
      days: duration_days,
      start: new Date().toISOString(),
      end: new Date(Date.now() + duration_days * 86400000).toISOString(),
    },
    confidence_level: `${confidence_level}%`,
    statistical_requirements: {
      min_conversions_per_variant: 50,
      min_impressions_per_variant: 5000,
      note: "統計的有意差判定には各バリアント最低50CVが推奨",
    },
  };
}
