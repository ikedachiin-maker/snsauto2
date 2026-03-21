// ── Campaign / AdSet / AdCreative / Ad Payload Builders ─────────────

import {
  ODAX_OBJECTIVES,
  CTA_MAP,
  DEFAULTS,
  getConfig,
} from "./config.js";

// ── 1. Campaign Payload ─────────────────────────────────────────────

export function buildCampaignPayload({
  name,
  objective = "sales",
  daily_budget_cents,
  special_ad_categories = [],
  smart_promotion_type,
}) {
  const odax = ODAX_OBJECTIVES[objective];
  if (!odax) {
    throw new Error(
      `Invalid objective: "${objective}". Valid: ${Object.keys(ODAX_OBJECTIVES).join(", ")}`
    );
  }

  const payload = {
    name: name || `Campaign_${Date.now()}`,
    objective: odax.objective,
    status: DEFAULTS.status,
    special_ad_categories: JSON.stringify(special_ad_categories),
    // Advantage+ Campaign Budget (CBO)
    daily_budget: String(daily_budget_cents || DEFAULTS.daily_budget_cents),
    bid_strategy: DEFAULTS.bid_strategy,
  };

  // Advantage+ Shopping/App (smart_promotion_type)
  if (smart_promotion_type) {
    payload.smart_promotion_type = smart_promotion_type;
  }

  return {
    endpoint: `act_${getConfig().adAccountId}/campaigns`,
    params: payload,
  };
}

// ── 2. Ad Set Payload ───────────────────────────────────────────────

export function buildAdSetPayload({
  campaign_id,
  name,
  objective = "sales",
  optimization_goal,
  daily_budget_cents,
  targeting,
  start_time,
  end_time,
  instagram_actor_id,
}) {
  const odax = ODAX_OBJECTIVES[objective];
  const optGoal = optimization_goal || odax?.optimization_goals[0] || "LINK_CLICKS";

  const payload = {
    campaign_id,
    name: name || `AdSet_${Date.now()}`,
    status: DEFAULTS.status,
    optimization_goal: optGoal,
    billing_event: DEFAULTS.billing_event,
    // Advantage+ Audience (auto-targeting)
    targeting: JSON.stringify(
      targeting || {
        geo_locations: { countries: ["JP"] },
        // Advantage+ audience: let Meta optimize
      }
    ),
    // Advantage+ placements (automatic)
    // No manual placement_positions = automatic placements
  };

  // Budget at AdSet level (if not using CBO)
  if (daily_budget_cents) {
    payload.daily_budget = String(daily_budget_cents);
  }

  if (start_time) payload.start_time = start_time;
  if (end_time) payload.end_time = end_time;

  // Instagram actor (page) for Instagram placements
  if (instagram_actor_id) {
    payload.instagram_actor_id = instagram_actor_id;
  }

  return {
    endpoint: `act_${getConfig().adAccountId}/adsets`,
    params: payload,
  };
}

// ── 3. Image Upload Payload ─────────────────────────────────────────

export function buildImageUploadPayload({ image_path }) {
  return {
    endpoint: `act_${getConfig().adAccountId}/adimages`,
    params: {
      _files: { filename: image_path },
    },
  };
}

// ── 4. Ad Creative Payload ──────────────────────────────────────────

export function buildAdCreativePayload({
  name,
  image_hash,
  image_url,
  headline,
  primary_text,
  description,
  cta_type = "learn_more",
  link_url = "https://example.com",
  page_id,
}) {
  const config = getConfig();
  const ctaValue = CTA_MAP[cta_type] || CTA_MAP.learn_more;

  const payload = {
    name: name || `Creative_${Date.now()}`,
    object_story_spec: JSON.stringify({
      page_id: page_id || config.pageId,
      link_data: {
        image_hash: image_hash || undefined,
        picture: image_url || undefined,
        link: link_url,
        message: primary_text,
        name: headline,
        description: description || undefined,
        call_to_action: {
          type: ctaValue,
          value: { link: link_url },
        },
      },
    }),
    // Advantage+ creative enhancements
    degrees_of_freedom_spec: JSON.stringify({
      creative_features_spec: {
        standard_enhancements: { enroll_status: "OPT_IN" },
      },
    }),
  };

  return {
    endpoint: `act_${getConfig().adAccountId}/adcreatives`,
    params: payload,
  };
}

// ── 5. Ad Payload ───────────────────────────────────────────────────

export function buildAdPayload({ name, adset_id, creative_id }) {
  return {
    endpoint: `act_${getConfig().adAccountId}/ads`,
    params: {
      name: name || `Ad_${Date.now()}`,
      adset_id,
      creative: JSON.stringify({ creative_id }),
      status: DEFAULTS.status,
    },
  };
}

// ── Helper: Build full campaign creation plan ───────────────────────

export function buildFullCampaignPlan({
  creative,
  campaign_name,
  objective = "sales",
  daily_budget_cents,
  link_url,
  targeting,
}) {
  const steps = [];

  // Step 1: Upload image
  steps.push({
    step: 1,
    action: "upload_image",
    ...buildImageUploadPayload({ image_path: creative.image.path }),
  });

  // Step 2: Create campaign
  steps.push({
    step: 2,
    action: "create_campaign",
    ...buildCampaignPayload({
      name: campaign_name || `Campaign_${creative.creative_id}`,
      objective,
      daily_budget_cents,
    }),
  });

  // Step 3: Create ad set (campaign_id will be filled from step 2)
  steps.push({
    step: 3,
    action: "create_adset",
    ...buildAdSetPayload({
      campaign_id: "<campaign_id from step 2>",
      name: `AdSet_${creative.creative_id}`,
      objective,
      targeting,
    }),
  });

  // Step 4: Create ad creative (image_hash from step 1)
  steps.push({
    step: 4,
    action: "create_adcreative",
    ...buildAdCreativePayload({
      name: `Creative_${creative.creative_id}`,
      image_hash: "<image_hash from step 1>",
      headline: creative.copy.headline,
      primary_text: creative.copy.primary_text,
      description: creative.copy.description,
      cta_type: creative.copy.cta_type,
      link_url,
    }),
  });

  // Step 5: Create ad (adset_id from step 3, creative_id from step 4)
  steps.push({
    step: 5,
    action: "create_ad",
    ...buildAdPayload({
      name: `Ad_${creative.creative_id}`,
      adset_id: "<adset_id from step 3>",
      creative_id: "<creative_id from step 4>",
    }),
  });

  return steps;
}
