import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

import {
  getConfig,
  isConfigured,
  METRIC_PRESETS,
  DATE_PRESETS,
  BREAKDOWNS,
  REPORT_LEVELS,
  TIME_INCREMENTS,
} from "./lib/config.js";
import {
  fetchInsights,
  fetchCampaigns,
  fetchAdSets,
  fetchAds,
  buildDemoInsights,
} from "./lib/insights-fetcher.js";
import {
  buildPerformanceSummary,
  rankPerformers,
  analyzeTrends,
  analyzeBreakdown,
  analyzeCreativePerformance,
} from "./lib/report-builder.js";
import {
  formatAsMarkdown,
  formatAsCSV,
  formatAsTextTable,
  generateRecommendations,
} from "./lib/formatter.js";
import { formatError } from "./lib/errors.js";

// ── Output ──────────────────────────────────────────────────────────

const OUTPUT_DIR = join(import.meta.dirname, "output");

function saveOutput(name, data, ext = "json") {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const filePath = join(OUTPUT_DIR, `${name}_${ts}.${ext}`);

  if (ext === "json") {
    writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } else {
    writeFileSync(filePath, data, "utf-8");
  }

  return filePath;
}

// ── MCP Server ──────────────────────────────────────────────────────

const server = new McpServer({
  name: "meta-report",
  version: "1.0.0",
});

// ── Tool 1: get_performance_report ──────────────────────────────────

server.tool(
  "get_performance_report",
  "Generate comprehensive performance report for campaigns, ad sets, or ads. Includes summary, top performers, and recommendations. Works in dry_run mode with demo data.",
  {
    level: z
      .enum(["account", "campaign", "adset", "ad"])
      .optional()
      .default("campaign")
      .describe("レポートレベル"),
    object_id: z
      .string()
      .optional()
      .describe("特定オブジェクトID（省略時はアカウント全体）"),
    date_preset: z
      .enum(["today", "yesterday", "last_3d", "last_7d", "last_14d", "last_30d", "this_month", "last_month", "maximum"])
      .optional()
      .default("last_7d")
      .describe("期間プリセット"),
    metric_preset: z
      .enum(["overview", "conversions", "engagement", "video", "full"])
      .optional()
      .default("overview")
      .describe("メトリクスプリセット"),
    rank_by: z
      .enum(["spend", "impressions", "clicks", "ctr", "conversions", "cpa", "roas"])
      .optional()
      .default("spend")
      .describe("ランキング基準"),
    dry_run: z
      .boolean()
      .optional()
      .default(true)
      .describe("true=デモデータでプレビュー（デフォルト）"),
  },
  async ({ level, object_id, date_preset, metric_preset, rank_by, dry_run }) => {
    try {
      let insightsData;

      if (!isConfigured() || dry_run) {
        // Demo mode
        insightsData = buildDemoInsights(level, 10);
      } else {
        // Live mode
        const result = await fetchInsights({
          level,
          objectId: object_id,
          datePreset: date_preset,
          metricPreset: metric_preset,
          dryRun: false,
        });
        insightsData = result.data || [];
      }

      // Build report
      const { summary } = buildPerformanceSummary(insightsData);
      const topPerformers = rankPerformers(insightsData, rank_by, 10);
      const recommendations = generateRecommendations(summary, topPerformers, null);

      const report = {
        title: `パフォーマンスレポート（${REPORT_LEVELS[level]?.label || level}）`,
        date_range: dry_run ? { since: "2026-02-16", until: "2026-02-22" } : null,
        generated_at: new Date().toISOString(),
        mode: dry_run ? "demo" : "live",
        level,
        summary,
        top_performers: topPerformers,
        recommendations,
        raw_data_count: insightsData.length,
      };

      const savedPath = saveOutput("performance_report", report);
      report.saved_to = savedPath;

      return {
        content: [{ type: "text", text: JSON.stringify(report, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${formatError(error)}` }],
        isError: true,
      };
    }
  }
);

// ── Tool 2: get_creative_report ─────────────────────────────────────

server.tool(
  "get_creative_report",
  "Analyze creative/ad performance. Compares ads by CTR, conversions, and CPA. Identifies winning creatives and creative fatigue.",
  {
    adset_id: z
      .string()
      .optional()
      .describe("広告セットID（省略時はアカウント全体）"),
    date_preset: z
      .enum(["last_7d", "last_14d", "last_30d"])
      .optional()
      .default("last_7d"),
    dry_run: z
      .boolean()
      .optional()
      .default(true),
  },
  async ({ adset_id, date_preset, dry_run }) => {
    try {
      let adsData, insightsData;

      if (!isConfigured() || dry_run) {
        // Demo mode
        adsData = Array.from({ length: 8 }, (_, i) => ({
          id: `demo_ad_${i + 1}`,
          name: `広告 ${i + 1}`,
          creative: { id: `demo_creative_${i + 1}` },
        }));
        insightsData = buildDemoInsights("ad", 8);
      } else {
        // Live mode
        const [ads, insights] = await Promise.all([
          fetchAds({ adSetId: adset_id, dryRun: false }),
          fetchInsights({ level: "ad", objectId: adset_id, datePreset: date_preset, dryRun: false }),
        ]);
        adsData = ads.data || [];
        insightsData = insights.data || [];
      }

      const analysis = analyzeCreativePerformance(adsData, insightsData);

      // Identify fatigue (high frequency, low CTR)
      const fatiguedCreatives = analysis.creatives.filter(
        (c) => c.impressions > 5000 && c.ctr < 0.5
      );

      const report = {
        title: "クリエイティブパフォーマンスレポート",
        generated_at: new Date().toISOString(),
        mode: dry_run ? "demo" : "live",
        total_creatives: analysis.total_creatives,
        top_performers: analysis.creatives.slice(0, 5),
        fatigued_creatives: fatiguedCreatives.slice(0, 5),
        recommendations: [],
      };

      if (analysis.creatives.length > 0) {
        const best = analysis.creatives[0];
        report.recommendations.push({
          priority: "high",
          title: "勝者クリエイティブをスケール",
          description: `「${best.ad_name}」が最高パフォーマンス（CV: ${best.conversions}）。予算増額または類似クリエイティブ制作を推奨。`,
        });
      }

      if (fatiguedCreatives.length > 0) {
        report.recommendations.push({
          priority: "medium",
          title: "疲弊クリエイティブを更新",
          description: `${fatiguedCreatives.length}件の広告がCTR < 0.5%で疲弊の兆候。新規クリエイティブへの差し替えを検討。`,
        });
      }

      const savedPath = saveOutput("creative_report", report);
      report.saved_to = savedPath;

      return {
        content: [{ type: "text", text: JSON.stringify(report, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${formatError(error)}` }],
        isError: true,
      };
    }
  }
);

// ── Tool 3: get_audience_report ─────────────────────────────────────

server.tool(
  "get_audience_report",
  "Analyze performance by audience segments (age, gender, location, device, placement). Identifies best-performing demographics.",
  {
    breakdown_type: z
      .enum(["age", "gender", "age,gender", "country", "region", "publisher_platform", "platform_position", "device_platform"])
      .optional()
      .default("age,gender")
      .describe("分析軸"),
    level: z
      .enum(["campaign", "adset", "ad"])
      .optional()
      .default("campaign"),
    date_preset: z
      .enum(["last_7d", "last_14d", "last_30d"])
      .optional()
      .default("last_7d"),
    dry_run: z
      .boolean()
      .optional()
      .default(true),
  },
  async ({ breakdown_type, level, date_preset, dry_run }) => {
    try {
      let insightsData;

      if (!isConfigured() || dry_run) {
        // Demo mode with breakdown
        const demoData = buildDemoInsights(level, 15);
        const ages = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"];
        const genders = ["male", "female"];

        insightsData = demoData.map((row, i) => ({
          ...row,
          age: ages[i % ages.length],
          gender: genders[i % genders.length],
          country: i % 3 === 0 ? "JP" : i % 3 === 1 ? "US" : "GB",
          publisher_platform: i % 2 === 0 ? "facebook" : "instagram",
        }));
      } else {
        // Live mode
        const result = await fetchInsights({
          level,
          datePreset: date_preset,
          breakdowns: breakdown_type.split(","),
          dryRun: false,
        });
        insightsData = result.data || [];
      }

      const breakdownAnalysis = analyzeBreakdown(insightsData, breakdown_type.includes(",") ? breakdown_type.split(",")[0] : breakdown_type);
      const { summary } = buildPerformanceSummary(insightsData);

      const report = {
        title: `オーディエンス分析レポート（${BREAKDOWNS[breakdown_type]?.label || breakdown_type}）`,
        generated_at: new Date().toISOString(),
        mode: dry_run ? "demo" : "live",
        breakdown_type: breakdown_type,
        summary,
        breakdown: breakdownAnalysis,
        recommendations: [],
      };

      // Top segment recommendation
      if (breakdownAnalysis.segments.length > 0) {
        const top = breakdownAnalysis.segments[0];
        report.recommendations.push({
          priority: "high",
          title: `トップセグメント: ${top.segment}`,
          description: `「${top.segment}」が最も高いシェア（${top.spend_percent.toFixed(1)}%）。このセグメントに注力することでROI向上が見込めます。`,
        });
      }

      const savedPath = saveOutput("audience_report", report);
      report.saved_to = savedPath;

      return {
        content: [{ type: "text", text: JSON.stringify(report, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${formatError(error)}` }],
        isError: true,
      };
    }
  }
);

// ── Tool 4: get_trend_report ────────────────────────────────────────

server.tool(
  "get_trend_report",
  "Analyze performance trends over time (daily/weekly breakdown). Detects improving/declining patterns and seasonality.",
  {
    level: z
      .enum(["campaign", "adset", "ad"])
      .optional()
      .default("campaign"),
    date_preset: z
      .enum(["last_7d", "last_14d", "last_30d"])
      .optional()
      .default("last_14d"),
    time_increment: z
      .enum(["1", "7", "monthly"])
      .optional()
      .default("1")
      .describe("時系列の粒度（1=日次、7=週次、monthly=月次）"),
    dry_run: z
      .boolean()
      .optional()
      .default(true),
  },
  async ({ level, date_preset, time_increment, dry_run }) => {
    try {
      let insightsData;

      if (!isConfigured() || dry_run) {
        // Demo time series
        const days = date_preset === "last_30d" ? 30 : date_preset === "last_14d" ? 14 : 7;
        const data = [];
        for (let i = 0; i < days; i++) {
          const date = new Date();
          date.setDate(date.getDate() - (days - i));
          const dateStr = date.toISOString().split("T")[0];

          const baseSpend = 10000 + Math.random() * 5000 + i * 200; // Slight upward trend
          const baseImpressions = 40000 + Math.random() * 20000;
          const baseClicks = baseImpressions * (0.008 + Math.random() * 0.01);

          data.push({
            date_start: dateStr,
            campaign_name: "デモキャンペーン",
            spend: baseSpend.toFixed(2),
            impressions: Math.floor(baseImpressions).toString(),
            clicks: Math.floor(baseClicks).toString(),
            ctr: ((baseClicks / baseImpressions) * 100).toFixed(2),
          });
        }
        insightsData = data;
      } else {
        // Live mode
        const result = await fetchInsights({
          level,
          datePreset: date_preset,
          timeIncrement: time_increment,
          dryRun: false,
        });
        insightsData = result.data || [];
      }

      const trendAnalysis = analyzeTrends(insightsData);
      const { summary } = buildPerformanceSummary(insightsData);

      const report = {
        title: "トレンド分析レポート",
        generated_at: new Date().toISOString(),
        mode: dry_run ? "demo" : "live",
        time_period: DATE_PRESETS[date_preset]?.label || date_preset,
        time_increment: TIME_INCREMENTS[time_increment]?.label || time_increment,
        summary,
        trends: trendAnalysis,
        recommendations: [],
      };

      if (trendAnalysis.trend === "improving") {
        report.recommendations.push({
          priority: "high",
          title: "改善トレンド継続",
          description: "パフォーマンスが改善傾向です。現在の戦略を維持しつつ、予算増額でさらなる成果を狙いましょう。",
        });
      } else if (trendAnalysis.trend === "declining") {
        report.recommendations.push({
          priority: "high",
          title: "低下トレンド改善",
          description: "パフォーマンスが低下しています。クリエイティブ刷新、ターゲティング見直し、またはA/Bテスト実施を推奨します。",
        });
      }

      const savedPath = saveOutput("trend_report", report);
      report.saved_to = savedPath;

      return {
        content: [{ type: "text", text: JSON.stringify(report, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${formatError(error)}` }],
        isError: true,
      };
    }
  }
);

// ── Tool 5: export_report ───────────────────────────────────────────

server.tool(
  "export_report",
  "Export any report to Markdown, CSV, or plain text format. Converts JSON report data into human-readable or machine-readable formats.",
  {
    report_data: z
      .object({})
      .passthrough()
      .describe("エクスポートするレポートデータ（JSON）"),
    format: z
      .enum(["markdown", "csv", "text"])
      .optional()
      .default("markdown")
      .describe("出力フォーマット"),
    include_raw_data: z
      .boolean()
      .optional()
      .default(false)
      .describe("CSVエクスポート時に生データを含める"),
  },
  async ({ report_data, format, include_raw_data }) => {
    try {
      let exported;
      let ext;

      if (format === "markdown") {
        exported = formatAsMarkdown(report_data);
        ext = "md";
      } else if (format === "csv" && include_raw_data && report_data.raw_data) {
        exported = formatAsCSV(report_data.raw_data);
        ext = "csv";
      } else if (format === "text") {
        exported = JSON.stringify(report_data, null, 2);
        ext = "txt";
      } else {
        throw new Error(`Format "${format}" not supported or raw_data missing for CSV export`);
      }

      const savedPath = saveOutput("export", exported, ext);

      const output = {
        success: true,
        format,
        exported_length: exported.length,
        saved_to: savedPath,
        preview: exported.slice(0, 500) + (exported.length > 500 ? "\n...(truncated)" : ""),
      };

      return {
        content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${formatError(error)}` }],
        isError: true,
      };
    }
  }
);

// ── Start ────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
