// ── Module 1 creative.json Reader & Validator ───────────────────────

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";

// Read and validate creative.json from Module 1 output
export function readCreativeJson(path) {
  const resolved = resolve(path);

  if (!existsSync(resolved)) {
    throw new Error(`creative.json not found: ${resolved}`);
  }

  const raw = readFileSync(resolved, "utf-8");
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`Invalid JSON in creative.json: ${resolved}`);
  }

  // Validate structure
  if (!data.creatives || !Array.isArray(data.creatives) || data.creatives.length === 0) {
    throw new Error(
      "creative.json must have a non-empty 'creatives' array. " +
      "Generate one using the meta-ad-creative MCP server first."
    );
  }

  const baseDir = dirname(resolved);
  const creatives = data.creatives.map((c, i) => validateCreative(c, i, baseDir));

  return {
    campaign_id: data.campaign_id || null,
    version: data.version || "1.0",
    created_at: data.created_at || null,
    creatives,
    source_path: resolved,
  };
}

function validateCreative(creative, index, baseDir) {
  const prefix = `creatives[${index}]`;

  // Required: copy with headline and primary_text
  if (!creative.copy) {
    throw new Error(`${prefix}.copy is required`);
  }
  if (!creative.copy.headline) {
    throw new Error(`${prefix}.copy.headline is required`);
  }
  if (!creative.copy.primary_text) {
    throw new Error(`${prefix}.copy.primary_text is required`);
  }

  // Required: image with path
  if (!creative.image) {
    throw new Error(`${prefix}.image is required`);
  }
  if (!creative.image.path) {
    throw new Error(`${prefix}.image.path is required`);
  }

  // Check image file exists
  const imagePath = resolve(baseDir, creative.image.path);
  const imageExists = existsSync(imagePath);

  return {
    creative_id: creative.creative_id || `crt_${index}`,
    format: creative.format || "feed_square",
    image: {
      path: imagePath,
      exists: imageExists,
      filename: creative.image.filename || imagePath.split(/[\\/]/).pop(),
      mime_type: creative.image.mime_type || "image/jpeg",
    },
    copy: {
      headline: creative.copy.headline,
      primary_text: creative.copy.primary_text,
      description: creative.copy.description || "",
      cta_type: creative.copy.cta_type || "learn_more",
    },
    metadata: creative.metadata || {},
  };
}

// Read variations.json (for multi-creative campaigns)
export function readVariationsJson(path) {
  const resolved = resolve(path);

  if (!existsSync(resolved)) {
    throw new Error(`variations.json not found: ${resolved}`);
  }

  const raw = readFileSync(resolved, "utf-8");
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`Invalid JSON in variations.json: ${resolved}`);
  }

  if (!data.variations || !Array.isArray(data.variations)) {
    throw new Error("variations.json must have a 'variations' array");
  }

  const baseDir = dirname(resolved);
  const variations = data.variations.map((v, i) => validateCreative(v, i, baseDir));

  return {
    campaign_id: data.campaign_id || null,
    num_variations: data.num_variations || variations.length,
    variations,
    source_path: resolved,
  };
}
