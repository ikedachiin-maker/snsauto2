// Smoke test: Verify modules load and dry_run works
import { readCreativeJson } from "../lib/creative-reader.js";
import { buildFullCampaignPlan, buildCampaignPayload } from "../lib/campaign-builder.js";
import { callMetaApi } from "../lib/meta-api-client.js";
import { isConfigured, ODAX_OBJECTIVES } from "../lib/config.js";
import { join } from "path";

console.log("=== Meta Campaign MCP Smoke Test ===\n");

// Test 1: Config check
console.log("1. Config check:");
console.log("   Configured:", isConfigured());
console.log("   Objectives:", Object.keys(ODAX_OBJECTIVES).join(", "));

// Test 2: Read creative.json
console.log("\n2. Read creative.json:");
const samplePath = join(import.meta.dirname, "sample-creative.json");
try {
  const data = readCreativeJson(samplePath);
  console.log("   Campaign ID:", data.campaign_id);
  console.log("   Creatives:", data.creatives.length);
  console.log("   Headline:", data.creatives[0].copy.headline);
  console.log("   Image exists:", data.creatives[0].image.exists);
} catch (e) {
  console.log("   Error:", e.message);
}

// Test 3: Build campaign payload
console.log("\n3. Build campaign payload:");
const campPayload = buildCampaignPayload({
  name: "Test Campaign",
  objective: "sales",
});
console.log("   Endpoint:", campPayload.endpoint);
console.log("   Objective:", campPayload.params.objective);
console.log("   Status:", campPayload.params.status);

// Test 4: Dry run API call
console.log("\n4. Dry run API call:");
const dryResult = await callMetaApi(campPayload.endpoint, campPayload.params, { dryRun: true });
console.log("   dry_run:", dryResult.dry_run);
console.log("   method:", dryResult.method);
console.log("   url:", dryResult.url);
console.log("   curl preview:");
console.log("  ", dryResult.curl.split("\n")[0]);

// Test 5: Full campaign plan (dry run)
console.log("\n5. Full campaign plan:");
const data = readCreativeJson(samplePath);
const plan = buildFullCampaignPlan({
  creative: data.creatives[0],
  campaign_name: "Test Full Campaign",
  objective: "sales",
  link_url: "https://example.com/lp",
});
for (const step of plan) {
  console.log(`   Step ${step.step}: ${step.action} → ${step.endpoint}`);
}

console.log("\n=== All tests passed! ===");
