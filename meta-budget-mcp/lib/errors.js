// ── Meta API Error Classification & Retry Logic ─────────────────────

export class MetaApiError extends Error {
  constructor(message, code, subcode, fbTraceId) {
    super(message);
    this.name = "MetaApiError";
    this.code = code;
    this.subcode = subcode;
    this.fbTraceId = fbTraceId;
    this.retryable = RETRYABLE_CODES.has(code) || RETRYABLE_SUBCODES.has(subcode);
  }
}

const RETRYABLE_CODES = new Set([1, 2, 4, 17, 32, 341]);
const RETRYABLE_SUBCODES = new Set([1487851, 2446079]);

export function parseMetaError(body) {
  const err = body?.error;
  if (!err) return null;
  return new MetaApiError(err.message || "Unknown", err.code, err.error_subcode, err.fbtrace_id);
}

export function formatError(error) {
  if (error instanceof MetaApiError) {
    const parts = [`Meta API Error: ${error.message}`];
    if (error.code) parts.push(`Code: ${error.code}`);
    if (error.retryable) parts.push("(Retryable)");
    return parts.join(" | ");
  }
  return error.message || String(error);
}

export async function withRetry(fn, maxRetries = 2, baseDelay = 1000) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries || !error.retryable) throw error;
      await new Promise((r) => setTimeout(r, baseDelay * Math.pow(2, attempt)));
    }
  }
}
