// ── Meta Graph API REST Client with dry_run support ─────────────────

import { GRAPH_API_BASE, getConfig } from "./config.js";
import { parseMetaError, withRetry } from "./errors.js";

// Build a curl command string for dry_run output
function buildCurl(method, url, params, accessToken) {
  const masked = accessToken
    ? accessToken.slice(0, 8) + "..." + accessToken.slice(-4)
    : "<META_ACCESS_TOKEN>";

  if (method === "GET") {
    const qs = new URLSearchParams({ ...params, access_token: masked });
    return `curl -G "${url}" -d "${qs.toString()}"`;
  }

  if (method === "POST" && params?._files) {
    // Multipart form (image upload)
    const { _files, ...rest } = params;
    const parts = Object.entries({ ...rest, access_token: masked })
      .map(([k, v]) => `-F "${k}=${typeof v === "object" ? JSON.stringify(v) : v}"`)
      .join(" \\\n  ");
    const fileParts = Object.entries(_files)
      .map(([k, v]) => `-F "${k}=@${v}"`)
      .join(" \\\n  ");
    return `curl -X POST "${url}" \\\n  ${parts} \\\n  ${fileParts}`;
  }

  // Standard POST with form-urlencoded
  const body = Object.entries({ ...params, access_token: masked })
    .map(([k, v]) => `-d "${k}=${typeof v === "object" ? JSON.stringify(v) : v}"`)
    .join(" \\\n  ");
  return `curl -X POST "${url}" \\\n  ${body}`;
}

// ── Main API call function ──────────────────────────────────────────

export async function callMetaApi(endpoint, params = {}, options = {}) {
  const { method = "POST", dryRun = true } = options;
  const config = getConfig();
  const url = `${GRAPH_API_BASE}/${endpoint}`;

  // Dry run: return the request payload without making the API call
  if (dryRun) {
    return {
      dry_run: true,
      method,
      url,
      params,
      curl: buildCurl(method, url, params, config.accessToken),
    };
  }

  // Live call
  if (!config.accessToken) {
    throw new Error(
      "META_ACCESS_TOKEN is not set. Set it in environment variables or use dry_run=true."
    );
  }

  return withRetry(async () => {
    let response;

    if (method === "GET") {
      const qs = new URLSearchParams({
        ...params,
        access_token: config.accessToken,
      });
      response = await fetch(`${url}?${qs.toString()}`);
    } else if (params?._files) {
      // Multipart upload
      const { _files, ...rest } = params;
      const formData = new FormData();
      for (const [k, v] of Object.entries(rest)) {
        formData.append(k, typeof v === "object" ? JSON.stringify(v) : String(v));
      }
      formData.append("access_token", config.accessToken);

      // For image upload from file path
      for (const [k, v] of Object.entries(_files)) {
        const { readFileSync } = await import("fs");
        const fileBuffer = readFileSync(v);
        formData.append(k, new Blob([fileBuffer]), v.split(/[\\/]/).pop());
      }

      response = await fetch(url, { method: "POST", body: formData });
    } else {
      // Standard POST
      const body = new URLSearchParams({
        ...Object.fromEntries(
          Object.entries(params).map(([k, v]) => [
            k,
            typeof v === "object" ? JSON.stringify(v) : String(v),
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

// Convenience: GET request
export async function getMetaApi(endpoint, params = {}, options = {}) {
  return callMetaApi(endpoint, params, { ...options, method: "GET" });
}
