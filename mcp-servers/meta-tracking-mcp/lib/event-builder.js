// ── CAPI Event Payload Builder ──────────────────────────────────────

import { createHash, randomUUID } from "crypto";
import { STANDARD_EVENTS, USER_DATA_FIELDS } from "./config.js";

// ── SHA-256 Hash Helper ─────────────────────────────────────────────

function sha256(value) {
  if (!value) return undefined;
  const normalized = String(value).trim().toLowerCase();
  return createHash("sha256").update(normalized).digest("hex");
}

// ── Generate Event ID (for Pixel ↔ CAPI deduplication) ──────────────

export function generateEventId(prefix = "evt") {
  return `${prefix}_${Date.now()}_${randomUUID().slice(0, 8)}`;
}

// ── Hash User Data ──────────────────────────────────────────────────

export function hashUserData(userData) {
  const hashed = {};

  for (const [key, value] of Object.entries(userData)) {
    if (value == null || value === "") continue;

    const fieldDef = USER_DATA_FIELDS[key];
    if (fieldDef?.hash) {
      // Already hashed? (64 hex chars = SHA-256)
      if (/^[a-f0-9]{64}$/.test(String(value))) {
        hashed[key] = value;
      } else {
        hashed[key] = sha256(value);
      }
    } else {
      hashed[key] = value;
    }
  }

  return hashed;
}

// ── Build Single Event ──────────────────────────────────────────────

export function buildEvent({
  event_name,
  event_time,
  event_id,
  event_source_url,
  action_source = "website",
  user_data = {},
  custom_data = {},
  opt_out = false,
  data_processing_options,
  data_processing_options_country,
  data_processing_options_state,
}) {
  // Validate event name
  const isStandard = !!STANDARD_EVENTS[event_name];
  if (isStandard) {
    const eventDef = STANDARD_EVENTS[event_name];
    for (const req of eventDef.required_params) {
      if (custom_data[req] == null) {
        throw new Error(
          `Event "${event_name}" requires custom_data.${req}. ` +
          `Required: ${eventDef.required_params.join(", ")}`
        );
      }
    }
  }

  const event = {
    event_name,
    event_time: event_time || Math.floor(Date.now() / 1000),
    event_id: event_id || generateEventId(),
    action_source,
    user_data: hashUserData(user_data),
  };

  if (event_source_url) event.event_source_url = event_source_url;
  if (opt_out) event.opt_out = true;

  // Custom data (value, currency, content_ids, etc.)
  if (Object.keys(custom_data).length > 0) {
    event.custom_data = custom_data;
  }

  // Data processing options (LDU for CCPA etc.)
  if (data_processing_options) {
    event.data_processing_options = data_processing_options;
    if (data_processing_options_country != null) {
      event.data_processing_options_country = data_processing_options_country;
    }
    if (data_processing_options_state != null) {
      event.data_processing_options_state = data_processing_options_state;
    }
  }

  return event;
}

// ── Build Batch Payload ─────────────────────────────────────────────

export function buildBatchPayload(events, testEventCode) {
  const payload = {
    data: JSON.stringify(events),
  };

  if (testEventCode) {
    payload.test_event_code = testEventCode;
  }

  return payload;
}

// ── Build curl Command for Dry Run ──────────────────────────────────

export function buildEventCurl(pixelId, events, accessToken, testEventCode) {
  const masked = accessToken
    ? accessToken.slice(0, 8) + "..." + accessToken.slice(-4)
    : "<META_ACCESS_TOKEN>";

  const dataJson = JSON.stringify(events, null, 2);
  let cmd = `curl -X POST "https://graph.facebook.com/v25.0/${pixelId}/events" \\\n`;
  cmd += `  -d "access_token=${masked}" \\\n`;
  cmd += `  -d 'data=${dataJson}'`;

  if (testEventCode) {
    cmd += ` \\\n  -d "test_event_code=${testEventCode}"`;
  }

  return cmd;
}

// ── Validate Event Quality ──────────────────────────────────────────

export function validateEventQuality(event) {
  const issues = [];
  const warnings = [];

  // Check user data quality
  const ud = event.user_data || {};
  const hasEmail = !!ud.em;
  const hasPhone = !!ud.ph;
  const hasExternalId = !!ud.external_id;
  const hasFbc = !!ud.fbc;
  const hasFbp = !!ud.fbp;
  const hasIp = !!ud.client_ip_address;
  const hasUa = !!ud.client_user_agent;

  const matchKeys = [hasEmail, hasPhone, hasExternalId].filter(Boolean).length;

  if (matchKeys === 0) {
    issues.push("user_dataにマッチキー（em/ph/external_id）が含まれていません。マッチ率が低下します。");
  }
  if (!hasFbc && !hasFbp) {
    warnings.push("fbc/fbpが未設定。ブラウザCookieから取得するとマッチ率が向上します。");
  }
  if (!hasIp) {
    warnings.push("client_ip_addressが未設定。イベントマッチングに影響する可能性があります。");
  }
  if (!hasUa) {
    warnings.push("client_user_agentが未設定。");
  }

  // Check event data
  if (!event.event_source_url && event.action_source === "website") {
    warnings.push("event_source_urlが未設定。ウェブサイトイベントにはURL推奨。");
  }

  const eventDef = STANDARD_EVENTS[event.event_name];
  if (eventDef) {
    for (const rec of eventDef.recommended_params) {
      if (!event.custom_data?.[rec]) {
        warnings.push(`custom_data.${rec}が未設定（${event.event_name}イベントで推奨）。`);
      }
    }
  }

  // Quality score (0-10)
  let score = 5; // Base
  if (hasEmail) score += 1;
  if (hasPhone) score += 1;
  if (hasExternalId) score += 0.5;
  if (hasFbc || hasFbp) score += 1;
  if (hasIp && hasUa) score += 0.5;
  if (event.event_source_url) score += 0.5;
  if (issues.length > 0) score -= 2;
  score = Math.max(0, Math.min(10, score));

  return {
    score: Math.round(score * 10) / 10,
    grade: score >= 8 ? "A" : score >= 6 ? "B" : score >= 4 ? "C" : "D",
    match_keys: matchKeys,
    issues,
    warnings,
  };
}
