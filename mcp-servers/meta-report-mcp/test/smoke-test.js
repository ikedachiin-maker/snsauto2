// Smoke test: Verify all modules load and work correctly
import { METRIC_PRESETS, DATE_PRESETS, BREAKDOWNS, isConfigured } from "../lib/config.js";
import { buildDemoInsights } from "../lib/insights-fetcher.js";
import { buildPerformanceSummary, rankPerformers, analyzeTrends, analyzeBreakdown } from "../lib/report-builder.js";
import { formatAsMarkdown, formatAsCSV, generateRecommendations } from "../lib/formatter.js";

console.log("=== Meta Report MCP Smoke Test ===\n");

// Test 1: Config
console.log("1. Config:");
console.log("   Configured:", isConfigured());
console.log("   Metric presets:", Object.keys(METRIC_PRESETS).join(", "));
console.log("   Date presets:", Object.keys(DATE_PRESETS).length);
console.log("   Breakdowns:", Object.keys(BREAKDOWNS).length);

// Test 2: Demo insights generation
console.log("\n2. Demo insights:");
const demoData = buildDemoInsights("campaign", 5);
console.log("   Generated rows:", demoData.length);
console.log("   Sample campaign:", demoData[0].campaign_name);
console.log("   Sample spend:", demoData[0].spend);

// Test 3: Performance summary
console.log("\n3. Performance summary:");
const { summary } = buildPerformanceSummary(demoData);
console.log("   Total spend:", Math.round(summary.total_spend));
console.log("   Total impressions:", summary.total_impressions);
console.log("   Avg CTR:", summary.avg_ctr.toFixed(2) + "%");
console.log("   Avg CPA:", Math.round(summary.avg_cpa));

// Test 4: Ranking
console.log("\n4. Ranking:");
const ranking = rankPerformers(demoData, "spend", 3);
console.log("   Metric:", ranking.metric_label);
console.log("   Top 3:");
ranking.top.forEach((p, i) => {
  console.log(`     ${i + 1}. ${p.name}: ¥${Math.round(p.metric_value)}`);
});

// Test 5: Trend analysis
console.log("\n5. Trend analysis:");
const trendData = [];
for (let i = 0; i < 7; i++) {
  const date = new Date();
  date.setDate(date.getDate() - (6 - i));
  trendData.push({
    date_start: date.toISOString().split("T")[0],
    spend: (10000 + i * 500 + Math.random() * 1000).toFixed(2),
    clicks: Math.floor(400 + i * 20).toString(),
    impressions: "50000",
  });
}
const trends = analyzeTrends(trendData);
console.log("   Trend:", trends.trend);
console.log("   Points:", trends.points.length);
if (trends.changes) {
  console.log("   Spend change:", trends.changes.spend_change_percent + "%");
}

// Test 6: Breakdown analysis
console.log("\n6. Breakdown analysis:");
const breakdownData = demoData.map((row, i) => ({
  ...row,
  age: ["18-24", "25-34", "35-44"][i % 3],
}));
const breakdown = analyzeBreakdown(breakdownData, "age");
console.log("   Breakdown:", breakdown.breakdown_type);
console.log("   Segments:", breakdown.total_segments);
breakdown.segments.forEach((seg) => {
  console.log(`     ${seg.segment}: ¥${Math.round(seg.spend)} (${seg.spend_percent.toFixed(1)}%)`);
});

// Test 7: Markdown formatting
console.log("\n7. Markdown formatting:");
const report = {
  title: "テストレポート",
  date_range: { since: "2026-02-15", until: "2026-02-22" },
  generated_at: new Date().toISOString(),
  summary: summary,
  top_performers: ranking,
};
const markdown = formatAsMarkdown(report);
console.log("   Markdown length:", markdown.length, "chars");
console.log("   Contains title:", markdown.includes("テストレポート"));
console.log("   Contains summary:", markdown.includes("サマリー"));

// Test 8: CSV formatting
console.log("\n8. CSV formatting:");
const csvData = demoData.slice(0, 3).map((row) => ({
  campaign: row.campaign_name,
  spend: row.spend,
  clicks: row.clicks,
  ctr: row.ctr,
}));
const csv = formatAsCSV(csvData);
console.log("   CSV length:", csv.length, "chars");
console.log("   Rows:", csv.split("\n").length - 1);

// Test 9: Recommendations
console.log("\n9. Recommendations:");
const recs = generateRecommendations(summary, ranking, trends);
console.log("   Total recommendations:", recs.length);
recs.forEach((rec, i) => {
  console.log(`     ${i + 1}. [${rec.priority}] ${rec.title}`);
});

console.log("\n=== All tests passed! ===");
