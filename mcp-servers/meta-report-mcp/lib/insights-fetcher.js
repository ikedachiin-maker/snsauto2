// ── Meta Insights API Fetcher ───────────────────────────────────────

import { getConfig, METRIC_PRESETS } from "./config.js";
import { getMetaApi } from "./meta-api-client.js";

// ── Build Date Range ────────────────────────────────────────────────

function buildDateRange(datePreset, customRange) {
  if (customRange?.since && customRange?.until) {
    return {
      since: customRange.since,
      until: customRange.until,
    };
  }

  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() - 1); // Yesterday

  let start;
  switch (datePreset) {
    case "today":
      start = new Date(now);
      break;
    case "yesterday":
      start = new Date(end);
      break;
    case "last_3d":
      start = new Date(end);
      start.setDate(start.getDate() - 2);
      break;
    case "last_7d":
      start = new Date(end);
      start.setDate(start.getDate() - 6);
      break;
    case "last_14d":
      start = new Date(end);
      start.setDate(start.getDate() - 13);
      break;
    case "last_30d":
      start = new Date(end);
      start.setDate(start.getDate() - 29);
      break;
    case "this_month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "last_month":
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end.setDate(0); // Last day of previous month
      break;
    default:
      start = new Date(end);
      start.setDate(start.getDate() - 6);
  }

  return {
    since: start.toISOString().split("T")[0],
    until: end.toISOString().split("T")[0],
  };
}

// ── Fetch Insights ──────────────────────────────────────────────────

export async function fetchInsights({
  level = "campaign",
  objectId,
  datePreset = "last_7d",
  customDateRange,
  metricPreset = "overview",
  customFields,
  breakdowns,
  timeIncrement,
  limit = 100,
  dryRun = true,
}) {
  const config = getConfig();
  const dateRange = buildDateRange(datePreset, customDateRange);

  // Build endpoint
  let endpoint;
  if (objectId) {
    // Specific object insights (campaign/adset/ad)
    endpoint = `${objectId}/insights`;
  } else {
    // Account-level insights
    endpoint = `act_${config.adAccountId}/insights`;
  }

  // Build fields
  const fields = customFields || METRIC_PRESETS[metricPreset]?.fields || METRIC_PRESETS.overview.fields;

  // Build params
  const params = {
    fields,
    time_range: JSON.stringify(dateRange),
    level: objectId ? undefined : level, // Level only for account-level queries
    limit: String(limit),
  };

  if (breakdowns && breakdowns.length > 0) {
    params.breakdowns = breakdowns.join(",");
  }

  if (timeIncrement && timeIncrement !== "all_days") {
    params.time_increment = timeIncrement === "monthly" ? "monthly" : String(timeIncrement);
  }

  return getMetaApi(endpoint, params, { dryRun });
}

// ── Fetch Campaign List ─────────────────────────────────────────────

export async function fetchCampaigns({ dryRun = true }) {
  const config = getConfig();
  return getMetaApi(
    `act_${config.adAccountId}/campaigns`,
    {
      fields: "name,status,objective,effective_status,created_time,updated_time",
      limit: "100",
    },
    { dryRun }
  );
}

// ── Fetch Ad Set List ───────────────────────────────────────────────

export async function fetchAdSets({ campaignId, dryRun = true }) {
  const config = getConfig();
  const endpoint = campaignId
    ? `${campaignId}/adsets`
    : `act_${config.adAccountId}/adsets`;

  return getMetaApi(
    endpoint,
    {
      fields: "name,status,campaign_id,effective_status,targeting,optimization_goal,created_time",
      limit: "100",
    },
    { dryRun }
  );
}

// ── Fetch Ad List ───────────────────────────────────────────────────

export async function fetchAds({ adSetId, dryRun = true }) {
  const config = getConfig();
  const endpoint = adSetId
    ? `${adSetId}/ads`
    : `act_${config.adAccountId}/ads`;

  return getMetaApi(
    endpoint,
    {
      fields: "name,status,adset_id,creative,effective_status,created_time",
      limit: "100",
    },
    { dryRun }
  );
}

// ── Build Demo Insights Data ────────────────────────────────────────

export function buildDemoInsights(level = "campaign", rows = 5) {
  const data = [];

  for (let i = 0; i < rows; i++) {
    const baseSpend = 15000 + Math.random() * 20000;
    const baseImpressions = 50000 + Math.random() * 100000;
    const baseClicks = baseImpressions * (0.005 + Math.random() * 0.02);
    const baseConversions = Math.floor(baseClicks * (0.01 + Math.random() * 0.08));

    const row = {
      campaign_name: `キャンペーン ${i + 1}`,
      campaign_id: `demo_camp_${i + 1}`,
      spend: baseSpend.toFixed(2),
      impressions: Math.floor(baseImpressions).toString(),
      reach: Math.floor(baseImpressions * 0.7).toString(),
      frequency: (baseImpressions / (baseImpressions * 0.7)).toFixed(2),
      clicks: Math.floor(baseClicks).toString(),
      ctr: ((baseClicks / baseImpressions) * 100).toFixed(2),
      cpc: (baseSpend / baseClicks).toFixed(2),
      cpm: ((baseSpend / baseImpressions) * 1000).toFixed(2),
      actions: [
        { action_type: "purchase", value: baseConversions.toString() },
        { action_type: "add_to_cart", value: (baseConversions * 3).toString() },
      ],
      cost_per_action_type: [
        { action_type: "purchase", value: (baseSpend / baseConversions).toFixed(2) },
      ],
      purchase_roas: [
        { value: (baseConversions * 5000 / baseSpend).toFixed(2) },
      ],
    };

    if (level === "adset") {
      row.adset_name = `広告セット ${String.fromCharCode(65 + i)}`;
      row.adset_id = `demo_adset_${i + 1}`;
    } else if (level === "ad") {
      row.ad_name = `広告 ${i + 1}`;
      row.ad_id = `demo_ad_${i + 1}`;
    }

    data.push(row);
  }

  return data;
}
