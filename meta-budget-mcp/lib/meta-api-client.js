// ── Meta Graph API REST Client with dry_run support ─────────────────

import { GRAPH_API_BASE, getConfig } from "./config.js";
import { parseMetaError, withRetry } from "./errors.js";

function buildCurl(method, url, params, accessToken) {
  const masked = accessToken
    ? accessToken.slice(0, 8) + "..." + accessToken.slice(-4)
    : "<META_ACCESS_TOKEN>";

  if (method === "GET") {
    const qs = new URLSearchParams({ ...params, access_token: masked });
    return `curl -G "${url}" -d "${qs.toString()}"`;
  }

  const body = Object.entries({ ...params, access_token: masked })
    .map(([k, v]) => `-d "${k}=${typeof v === "object" ? JSON.stringify(v) : v}"`)
    .join(" \\\n  ");
  return `curl -X POST "${url}" \\\n  ${body}`;
}

export async function callMetaApi(endpoint, params = {}, options = {}) {
  const { method = "POST", dryRun = true } = options;
  const config = getConfig();
  const url = `${GRAPH_API_BASE}/${endpoint}`;

  if (dryRun) {
    return {
      dry_run: true,
      method,
      url,
      params,
      curl: buildCurl(method, url, params, config.accessToken),
    };
  }

  if (!config.accessToken) {
    throw new Error("META_ACCESS_TOKEN is not set. Use dry_run=true or set the env var.");
  }

  return withRetry(async () => {
    let response;
    if (method === "GET") {
      const qs = new URLSearchParams({ ...params, access_token: config.accessToken });
      response = await fetch(`${url}?${qs.toString()}`);
    } else {
      const body = new URLSearchParams({
        ...Object.fromEntries(
          Object.entries(params).map(([k, v]) => [
            k, typeof v === "object" ? JSON.stringify(v) : String(v),
          ])
        ),
        access_token: config.accessToken,
      });
      response = await fetch(url, { method: "POST", body });
    }

    const data = await response.json();
    if (!response.ok) {
      const apiError = parseMetaError(data);
      if (apiError) throw apiError;
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
    }
    return { dry_run: false, ...data };
  });
}

export async function getMetaApi(endpoint, params = {}, options = {}) {
  return callMetaApi(endpoint, params, { ...options, method: "GET" });
}
