// ── Meta Conversions API Client ─────────────────────────────────────

import { GRAPH_API_BASE, getConfig } from "./config.js";
import { parseMetaError, withRetry } from "./errors.js";
import { buildBatchPayload, buildEventCurl } from "./event-builder.js";

// ── Send Events to Conversions API ──────────────────────────────────

export async function sendEvents(events, options = {}) {
  const { dryRun = true, testMode = false } = options;
  const config = getConfig();
  const testEventCode = testMode ? (config.testEventCode || "TEST_" + Date.now()) : "";

  const url = `${GRAPH_API_BASE}/${config.pixelId}/events`;

  if (dryRun) {
    return {
      dry_run: true,
      url,
      events_count: events.length,
      events,
      test_event_code: testEventCode || undefined,
      curl: buildEventCurl(config.pixelId, events, config.accessToken, testEventCode),
    };
  }

  if (!config.accessToken) {
    throw new Error("META_ACCESS_TOKEN is not set. Use dry_run=true or set the env var.");
  }
  if (!config.pixelId) {
    throw new Error("META_PIXEL_ID is not set.");
  }

  return withRetry(async () => {
    const payload = buildBatchPayload(events, testEventCode);

    const body = new URLSearchParams({
      ...payload,
      access_token: config.accessToken,
    });

    const response = await fetch(url, { method: "POST", body });
    const data = await response.json();

    if (!response.ok) {
      const apiError = parseMetaError(data);
      if (apiError) throw apiError;
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
    }

    return {
      dry_run: false,
      ...data,
      events_received: data.events_received || events.length,
      test_event_code: testEventCode || undefined,
    };
  });
}

// ── Fetch Event Diagnostics ─────────────────────────────────────────

export async function getEventDiagnostics(options = {}) {
  const { dryRun = true } = options;
  const config = getConfig();

  const url = `${GRAPH_API_BASE}/${config.pixelId}/event_diagnostics`;

  if (dryRun) {
    const masked = config.accessToken
      ? config.accessToken.slice(0, 8) + "..."
      : "<META_ACCESS_TOKEN>";
    return {
      dry_run: true,
      url,
      curl: `curl -G "${url}" -d "access_token=${masked}"`,
    };
  }

  if (!config.accessToken || !config.pixelId) {
    throw new Error("META_ACCESS_TOKEN and META_PIXEL_ID are required.");
  }

  const qs = new URLSearchParams({ access_token: config.accessToken });
  const response = await fetch(`${url}?${qs.toString()}`);
  const data = await response.json();

  if (!response.ok) {
    const apiError = parseMetaError(data);
    if (apiError) throw apiError;
    throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
  }

  return { dry_run: false, ...data };
}

// ── Fetch Pixel Stats ───────────────────────────────────────────────

export async function getPixelStats(options = {}) {
  const { dryRun = true } = options;
  const config = getConfig();

  const url = `${GRAPH_API_BASE}/${config.pixelId}`;
  const fields = "name,is_created_by_business,last_fired_time,owner_ad_account,data_use_setting";

  if (dryRun) {
    const masked = config.accessToken
      ? config.accessToken.slice(0, 8) + "..."
      : "<META_ACCESS_TOKEN>";
    return {
      dry_run: true,
      url,
      fields,
      curl: `curl -G "${url}" -d "fields=${fields}" -d "access_token=${masked}"`,
    };
  }

  if (!config.accessToken || !config.pixelId) {
    throw new Error("META_ACCESS_TOKEN and META_PIXEL_ID are required.");
  }

  const qs = new URLSearchParams({ fields, access_token: config.accessToken });
  const response = await fetch(`${url}?${qs.toString()}`);
  const data = await response.json();

  if (!response.ok) {
    const apiError = parseMetaError(data);
    if (apiError) throw apiError;
  }

  return { dry_run: false, ...data };
}
