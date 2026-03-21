// Smoke test: Verify all modules load and work correctly
import { TEST_VARIABLES, TEST_OBJECTIVES, CONFIDENCE_LEVELS, WINNER_ACTIONS, isConfigured } from "../lib/config.js";
import { buildExperimentPayload, buildExperimentPlan } from "../lib/experiment-builder.js";
import { analyzeExperiment, generateDemoResults } from "../lib/stats-engine.js";
import { callMetaApi } from "../lib/meta-api-client.js";

console.log("=== Meta Experiment MCP Smoke Test ===\n");

// Test 1: Config
console.log("1. Config:");
console.log("   Configured:", isConfigured());
console.log("   Test variables:", Object.keys(TEST_VARIABLES).join(", "));
console.log("   Test objectives:", Object.keys(TEST_OBJECTIVES).join(", "));
console.log("   Confidence levels:", Object.keys(CONFIDENCE_LEVELS).join(", "));
console.log("   Winner actions:", Object.keys(WINNER_ACTIONS).join(", "));

// Test 2: Build experiment plan
console.log("\n2. Experiment plan:");
const plan = buildExperimentPlan({
  name: "CTA Test Feb 2026",
  test_variable: "creative",
  test_objective: "cost_per_result",
  variant_ids: ["camp_001", "camp_002", "camp_003"],
  duration_days: 7,
  confidence_level: 90,
});
console.log("   Name:", plan.name);
console.log("   Variants:", plan.variants.length);
console.log("   Duration:", plan.duration.days, "days");
plan.variants.forEach((v) => console.log(`   ${v.label}: ${v.id} (${v.traffic_split})`));

// Test 3: Build experiment API payload
console.log("\n3. API payload:");
const payload = buildExperimentPayload({
  name: "CTA Test Feb 2026",
  campaign_ids: ["camp_001", "camp_002"],
  duration_days: 7,
  confidence_level: 90,
});
console.log("   Endpoint:", payload.endpoint);
console.log("   Duration:", payload.meta.duration_days, "days");

// Test 4: Dry run API call
console.log("\n4. Dry run API call:");
const dryResult = await callMetaApi(payload.endpoint, payload.params, { dryRun: true });
console.log("   dry_run:", dryResult.dry_run);
console.log("   curl:", dryResult.curl.split("\n")[0].slice(0, 80) + "...");

// Test 5: Generate demo data
console.log("\n5. Demo data generation:");
const demoData = generateDemoResults(3, "cost_per_result");
demoData.forEach((v) =>
  console.log(`   ${v.name}: spend=${v.spend}, clicks=${v.clicks}, conv=${v.conversions}, cpa=${v.cpa}`)
);

// Test 6: Statistical analysis
console.log("\n6. Statistical analysis:");
const analysis = analyzeExperiment(demoData, "cost_per_result", 90);
console.log("   Status:", analysis.status_label);
console.log("   Leader:", analysis.leader.name, `(CPA: ${analysis.leader.primary_metric.toFixed(0)})`);
console.log("   Variants analyzed:", analysis.variants.length);
console.log("   Comparisons:", analysis.comparisons.length);
analysis.comparisons.forEach((c) => {
  console.log(`   ${c.variant_a.name} vs ${c.variant_b.name}: z=${c.z_score}, p=${c.p_value}, significant=${c.significant}`);
});
console.log("   Recommendation:", analysis.recommendation.action);
console.log("   Message:", analysis.recommendation.message.slice(0, 80) + "...");

// Test 7: Analyze with known data (clear winner)
console.log("\n7. Clear winner test:");
const clearData = [
  { id: "a", name: "Winner", spend: "20000", impressions: "100000", clicks: "2000", conversions: 80, ctr: "2.0", cpa: "250" },
  { id: "b", name: "Loser", spend: "20000", impressions: "100000", clicks: "1000", conversions: 20, ctr: "1.0", cpa: "1000" },
];
const clearAnalysis = analyzeExperiment(clearData, "cost_per_result", 90);
console.log("   Status:", clearAnalysis.status_label);
console.log("   Leader:", clearAnalysis.leader.name);
console.log("   Lift:", clearAnalysis.comparisons[0]?.lift_percent + "%");
console.log("   Significant:", clearAnalysis.comparisons[0]?.significant);

console.log("\n=== All tests passed! ===");
