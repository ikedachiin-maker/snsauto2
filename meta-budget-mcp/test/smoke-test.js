// Smoke test: Verify all modules load and work correctly
import { BID_STRATEGIES, METRICS, RULE_TEMPLATES, EVAL_WINDOWS, isConfigured } from "../lib/config.js";
import { createRule, listRules, evaluateRule, buildActionApiCall, formatRuleSummary, deleteRule } from "../lib/rule-engine.js";
import { buildBudgetOverviewDryRun, buildInsightsDryRun } from "../lib/budget-analyzer.js";
import { callMetaApi } from "../lib/meta-api-client.js";

console.log("=== Meta Budget MCP Smoke Test ===\n");

// Test 1: Config
console.log("1. Config:");
console.log("   Configured:", isConfigured());
console.log("   Bid strategies:", Object.keys(BID_STRATEGIES).join(", "));
console.log("   Metrics:", Object.keys(METRICS).join(", "));
console.log("   Templates:", Object.keys(RULE_TEMPLATES).join(", "));
console.log("   Eval windows:", Object.keys(EVAL_WINDOWS).join(", "));

// Test 2: Create rule
console.log("\n2. Create rule:");
const rule = createRule({
  name: "テスト: 高CPA停止",
  conditions: [
    { metric: "cpa", operator: "gt", value: 3000 },
    { metric: "spend", operator: "gte", value: 5000 },
  ],
  action: { type: "pause" },
  evaluation_window: "last_7d",
});
console.log("   Rule ID:", rule.id);
console.log("   Summary:", formatRuleSummary(rule));

// Test 3: List rules
console.log("\n3. List rules:");
const rules = listRules();
console.log("   Total rules:", rules.length);

// Test 4: Evaluate rule
console.log("\n4. Evaluate rule against sample data:");
const sampleRow = {
  adset_id: "test_adset_001",
  adset_name: "Test AdSet",
  spend: "8000",
  ctr: "0.8",
  frequency: "2.1",
  actions: [{ action_type: "purchase", value: "2" }],
  cost_per_action_type: [{ action_type: "purchase", value: "4000" }],
};
const evalResult = evaluateRule(rule, sampleRow);
console.log("   Target:", evalResult.target_name);
console.log("   All conditions met:", evalResult.all_conditions_met);
for (const c of evalResult.conditions_evaluated) {
  console.log(`   ${c.metric_label}: ${c.actual} ${c.operator} ${c.threshold} → ${c.passed ? "PASS" : "FAIL"}`);
}

// Test 5: Build API call for action
console.log("\n5. Build action API call:");
if (evalResult.all_conditions_met) {
  const apiCall = buildActionApiCall(rule, "test_adset_001", 5000);
  console.log("   Endpoint:", apiCall.endpoint);
  console.log("   Params:", JSON.stringify(apiCall.params));
  console.log("   Description:", apiCall.description);
}

// Test 6: Dry run API call
console.log("\n6. Dry run budget update:");
const dryResult = await callMetaApi("test_adset_001", { daily_budget: "3000" }, { dryRun: true });
console.log("   dry_run:", dryResult.dry_run);
console.log("   curl:", dryResult.curl.split("\n")[0]);

// Test 7: Budget overview dry run
console.log("\n7. Budget overview dry run:");
const overview = buildBudgetOverviewDryRun();
console.log("   Requests:", overview.requests.length);

// Test 8: Insights dry run
console.log("\n8. Insights dry run:");
const insights = buildInsightsDryRun({ level: "adset", window: "last_7d" });
console.log("   Endpoint:", insights.endpoint);

// Cleanup: delete test rule
deleteRule(rule.id);
console.log("\n9. Cleanup: deleted test rule", rule.id);

console.log("\n=== All tests passed! ===");
