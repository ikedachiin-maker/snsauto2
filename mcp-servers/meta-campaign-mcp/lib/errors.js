// ── Meta API Error Classification & Retry Logic ─────────────────────

export class MetaApiError extends Error {
  constructor(message, code, subcode, fbTraceId) {
    super(message);
    this.name = "MetaApiError";
    this.code = code;
    this.subcode = subcode;
    this.fbTraceId = fbTraceId;
    this.retryable = isRetryable(code, subcode);
  }
}

// Meta API error codes that are safe to retry
const RETRYABLE_CODES = new Set([
  1,    // Unknown error (transient)
  2,    // Temporary service error
  4,    // Too many calls (rate limit)
  17,   // User request limit reached
  32,   // Page request limit reached
  341,  // Temporary application error
]);

const RETRYABLE_SUBCODES = new Set([
  1487851, // Temporary failure, retry
  2446079, // Too many calls to ad account
]);

function isRetryable(code, subcode) {
  return RETRYABLE_CODES.has(code) || RETRYABLE_SUBCODES.has(subcode);
}

// Parse Meta API error response
export function parseMetaError(responseBody) {
  const err = responseBody?.error;
  if (!err) return null;

  return new MetaApiError(
    err.message || "Unknown Meta API error",
    err.code,
    err.error_subcode,
    err.fbtrace_id
  );
}

// Format error for user display
export function formatError(error) {
  if (error instanceof MetaApiError) {
    const parts = [`Meta API Error: ${error.message}`];
    if (error.code) parts.push(`Code: ${error.code}`);
    if (error.subcode) parts.push(`Subcode: ${error.subcode}`);
    if (error.fbTraceId) parts.push(`Trace: ${error.fbTraceId}`);
    if (error.retryable) parts.push("(Retryable - try again later)");
    return parts.join("\n");
  }
  return error.message || String(error);
}

// Retry with exponential backoff
export async function withRetry(fn, maxRetries = 2, baseDelay = 1000) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries || !error.retryable) throw error;
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}
