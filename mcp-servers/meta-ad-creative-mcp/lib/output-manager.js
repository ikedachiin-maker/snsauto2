import { writeFileSync, mkdirSync, existsSync, statSync } from "fs";
import { join } from "path";

const BASE_DIR = import.meta.dirname;
const OUTPUT_DIR = join(BASE_DIR, "..", "output");

export function createOutputDir(campaignId) {
  const timestamp = Date.now();
  const dirName = campaignId || "_no_campaign";
  const outputPath = join(OUTPUT_DIR, dirName, String(timestamp));

  mkdirSync(outputPath, { recursive: true });

  return { outputPath, timestamp };
}

export function saveImageFile(outputPath, base64Data, filename) {
  const filePath = join(outputPath, filename);
  writeFileSync(filePath, Buffer.from(base64Data, "base64"));

  const stats = statSync(filePath);
  return {
    filename,
    path: filePath,
    size_bytes: stats.size,
  };
}

export function saveCreativeManifest(outputPath, creative) {
  const manifestPath = join(outputPath, "creative.json");
  const manifest = {
    version: "1.0",
    created_at: new Date().toISOString(),
    ...creative,
  };

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
  return manifestPath;
}

export function saveVariationsManifest(outputPath, variations) {
  const manifestPath = join(outputPath, "variations.json");
  const manifest = {
    version: "1.0",
    created_at: new Date().toISOString(),
    ...variations,
  };

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
  return manifestPath;
}

export { OUTPUT_DIR };
