// ── Report Analysis & Builder ───────────────────────────────────────

import { METRICS } from "./config.js";

// ── Extract Action Value ────────────────────────────────────────────

function extractActionValue(row, actionType) {
  if (!row.actions) return 0;
  const action = row.actions.find((a) => a.action_type === actionType);
  return parseInt(action?.value || 0);
}

function extractActionCost(row, actionType) {
  if (!row.cost_per_action_type) return 0;
  const cost = row.cost_per_action_type.find((c) => c.action_type === actionType);
  return parseFloat(cost?.value || 0);
}

// ── Build Performance Summary ───────────────────────────────────────

export function buildPerformanceSummary(insightsData) {
  const rows = insightsData.data || insightsData;
  if (!rows || rows.length === 0) {
    return { total_rows: 0, summary: null };
  }

  // Aggregate totals
  const totals = {
    spend: 0,
    impressions: 0,
    reach: 0,
    clicks: 0,
    conversions: 0,
    purchases: 0,
    leads: 0,
    add_to_cart: 0,
  };

  for (const row of rows) {
    totals.spend += parseFloat(row.spend || 0);
    totals.impressions += parseInt(row.impressions || 0);
    totals.reach += parseInt(row.reach || 0);
    totals.clicks += parseInt(row.clicks || 0);
    totals.purchases += extractActionValue(row, "purchase");
    totals.leads += extractActionValue(row, "lead");
    totals.add_to_cart += extractActionValue(row, "add_to_cart");
    totals.conversions += totals.purchases + totals.leads;
  }

  // Calculate averages
  const summary = {
    total_spend: totals.spend,
    total_impressions: totals.impressions,
    total_reach: totals.reach,
    total_clicks: totals.clicks,
    total_conversions: totals.conversions,
    total_purchases: totals.purchases,
    total_leads: totals.leads,
    avg_ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
    avg_cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
    avg_cpm: totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0,
    avg_cpa: totals.conversions > 0 ? totals.spend / totals.conversions : 0,
    avg_frequency: totals.reach > 0 ? totals.impressions / totals.reach : 0,
  };

  return { total_rows: rows.length, summary };
}

// ── Rank & Identify Top/Bottom Performers ──────────────────────────

export function rankPerformers(insightsData, metric = "spend", limit = 10) {
  const rows = insightsData.data || insightsData;
  if (!rows || rows.length === 0) return { top: [], bottom: [] };

  // Calculate metric for each row
  const scored = rows.map((row) => {
    let value = 0;
    switch (metric) {
      case "spend":
        value = parseFloat(row.spend || 0);
        break;
      case "impressions":
        value = parseInt(row.impressions || 0);
        break;
      case "clicks":
        value = parseInt(row.clicks || 0);
        break;
      case "ctr":
        value = parseFloat(row.ctr || 0);
        break;
      case "cpc":
        value = parseFloat(row.cpc || 0);
        break;
      case "conversions":
        value = extractActionValue(row, "purchase") + extractActionValue(row, "lead");
        break;
      case "cpa":
        value = extractActionCost(row, "purchase") || extractActionCost(row, "lead");
        break;
      case "roas":
        value = parseFloat(row.purchase_roas?.[0]?.value || 0);
        break;
      default:
        value = parseFloat(row[metric] || 0);
    }

    return {
      name: row.campaign_name || row.adset_name || row.ad_name || "Unnamed",
      id: row.campaign_id || row.adset_id || row.ad_id,
      metric_value: value,
      spend: row.spend,
      impressions: row.impressions,
      clicks: row.clicks,
    };
  });

  // Sort descending
  const higherBetter = ["ctr", "conversions", "roas", "clicks", "impressions"];
  const isHigherBetter = higherBetter.includes(metric);

  scored.sort((a, b) =>
    isHigherBetter
      ? b.metric_value - a.metric_value
      : a.metric_value - b.metric_value
  );

  return {
    top: scored.slice(0, limit),
    bottom: scored.slice(-limit).reverse(),
    metric,
    metric_label: METRICS[metric]?.label || metric,
    direction: isHigherBetter ? "higher_better" : "lower_better",
  };
}

// ── Analyze Trends (time series) ────────────────────────────────────

export function analyzeTrends(insightsData) {
  const rows = insightsData.data || insightsData;
  if (!rows || rows.length === 0) return { trend: "insufficient_data", points: [] };

  // Sort by date
  const timeSeries = rows
    .filter((r) => r.date_start)
    .sort((a, b) => new Date(a.date_start) - new Date(b.date_start))
    .map((r) => ({
      date: r.date_start,
      spend: parseFloat(r.spend || 0),
      impressions: parseInt(r.impressions || 0),
      clicks: parseInt(r.clicks || 0),
      ctr: parseFloat(r.ctr || 0),
      conversions: extractActionValue(r, "purchase") + extractActionValue(r, "lead"),
    }));

  if (timeSeries.length < 2) {
    return { trend: "insufficient_data", points: timeSeries };
  }

  // Simple trend analysis (first vs last)
  const first = timeSeries[0];
  const last = timeSeries[timeSeries.length - 1];

  const spendChange = first.spend > 0 ? ((last.spend - first.spend) / first.spend) * 100 : 0;
  const clickChange = first.clicks > 0 ? ((last.clicks - first.clicks) / first.clicks) * 100 : 0;
  const convChange = first.conversions > 0 ? ((last.conversions - first.conversions) / first.conversions) * 100 : 0;

  return {
    trend: convChange > 10 ? "improving" : convChange < -10 ? "declining" : "stable",
    points: timeSeries,
    changes: {
      spend_change_percent: Math.round(spendChange * 10) / 10,
      click_change_percent: Math.round(clickChange * 10) / 10,
      conversion_change_percent: Math.round(convChange * 10) / 10,
    },
  };
}

// ── Breakdown Analysis (age, gender, placement, etc.) ───────────────

export function analyzeBreakdown(insightsData, breakdownType) {
  const rows = insightsData.data || insightsData;
  if (!rows || rows.length === 0) return { breakdown_type: breakdownType, segments: [] };

  // Group by breakdown value
  const grouped = {};
  for (const row of rows) {
    const key = row[breakdownType] || "unknown";
    if (!grouped[key]) {
      grouped[key] = {
        segment: key,
        spend: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
      };
    }

    grouped[key].spend += parseFloat(row.spend || 0);
    grouped[key].impressions += parseInt(row.impressions || 0);
    grouped[key].clicks += parseInt(row.clicks || 0);
    grouped[key].conversions += extractActionValue(row, "purchase") + extractActionValue(row, "lead");
  }

  // Convert to array and calculate percentages
  const total = Object.values(grouped).reduce((sum, g) => sum + g.spend, 0);
  const segments = Object.values(grouped).map((g) => ({
    ...g,
    spend_percent: total > 0 ? (g.spend / total) * 100 : 0,
    ctr: g.impressions > 0 ? (g.clicks / g.impressions) * 100 : 0,
    cpa: g.conversions > 0 ? g.spend / g.conversions : 0,
  }));

  // Sort by spend desc
  segments.sort((a, b) => b.spend - a.spend);

  return {
    breakdown_type: breakdownType,
    total_segments: segments.length,
    segments,
  };
}

// ── Creative Performance Analysis ───────────────────────────────────

export function analyzeCreativePerformance(adsData, insightsData) {
  const ads = adsData.data || adsData || [];
  const insights = insightsData.data || insightsData || [];

  if (ads.length === 0 || insights.length === 0) {
    return { total_creatives: 0, creatives: [] };
  }

  // Match ads with insights
  const creatives = ads.map((ad) => {
    const adInsights = insights.find((ins) => ins.ad_id === ad.id);

    return {
      ad_id: ad.id,
      ad_name: ad.name,
      creative_id: ad.creative?.id || "unknown",
      spend: parseFloat(adInsights?.spend || 0),
      impressions: parseInt(adInsights?.impressions || 0),
      clicks: parseInt(adInsights?.clicks || 0),
      ctr: parseFloat(adInsights?.ctr || 0),
      conversions: extractActionValue(adInsights, "purchase") + extractActionValue(adInsights, "lead"),
      cpa: extractActionCost(adInsights, "purchase") || extractActionCost(adInsights, "lead") || 0,
    };
  });

  // Sort by performance
  creatives.sort((a, b) => b.conversions - a.conversions);

  return {
    total_creatives: creatives.length,
    creatives: creatives.slice(0, 20), // Top 20
  };
}
