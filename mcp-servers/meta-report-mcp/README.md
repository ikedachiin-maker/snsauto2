# Module 6: Meta Report MCP Server

Meta Marketing API v25.0 Insights API を使用したレポート自動生成モジュール。パフォーマンス分析、クリエイティブ分析、オーディエンス分析、トレンド分析、Markdown/CSV出力に対応します。

## 概要

このモジュールは、Meta広告のパフォーマンスレポートを自動生成します。Insights APIから18指標を取得し、トップパフォーマー抽出、トレンド検出、セグメント分析、自動推奨生成が可能です。

### 主な機能

- 📊 **4種類のレポート**: パフォーマンス/クリエイティブ/オーディエンス/トレンド
- 📈 **18の指標**: spend, impressions, clicks, ctr, cpc, cpm, cpa, conversions, roas等
- 🎯 **5つのメトリクスプリセット**: overview, conversions, engagement, video, full
- 📅 **11の期間プリセット**: today, yesterday, last_7d, last_30d, this_month等
- 🔍 **10の分析軸**: age, gender, country, region, placement, device等
- 💡 **自動推奨生成**: 高CPA警告、CTR改善、フリクエンシー管理等
- 📝 **3つの出力形式**: Markdown（表付き）、CSV、Plain Text
- 🧪 **dry_run モード**: API実行前にプレビュー（デフォルト有効）

## インストール

```bash
cd meta-report-mcp
npm install
```

## 必須環境変数

```.env
# Meta Marketing API アクセストークン
META_ACCESS_TOKEN=EAAxxxxxxxx

# 広告アカウント ID (act_ プレフィックス付き)
META_AD_ACCOUNT_ID=act_1234567890
```

**注意**: 環境変数が未設定でも全ツールは dry_run モードで動作し、デモデータと API プレビューを表示します。

## MCPツール

### 1. get_performance_report

包括的なパフォーマンスレポートを生成します。サマリー、トップパフォーマー、推奨を含みます。

**パラメータ**:
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| `level` | string | ❌ | レポートレベル（account/campaign/adset/ad、デフォルト: campaign） |
| `object_id` | string | ❌ | 特定オブジェクトID（省略時はアカウント全体） |
| `date_preset` | string | ❌ | 期間プリセット（today/yesterday/last_7d/last_30d等、デフォルト: last_7d） |
| `metric_preset` | string | ❌ | メトリクスプリセット（overview/conversions/engagement/video/full、デフォルト: overview） |
| `rank_by` | string | ❌ | ランキング基準（spend/impressions/clicks/ctr/conversions/cpa/roas、デフォルト: spend） |
| `dry_run` | boolean | ❌ | true=デモデータでプレビュー（デフォルト: true） |

**戻り値**:
```json
{
  "title": "パフォーマンスレポート（キャンペーン）",
  "date_range": { "since": "2026-02-16", "until": "2026-02-22" },
  "generated_at": "2026-02-23T15:30:45.123Z",
  "mode": "live",
  "level": "campaign",
  "summary": {
    "total_spend": 450000,
    "total_impressions": 1850000,
    "total_clicks": 28500,
    "total_conversions": 185,
    "avg_ctr": 1.54,
    "avg_cpc": 15.79,
    "avg_cpm": 243.24,
    "avg_cpa": 2432.43,
    "avg_roas": 3.2,
    "avg_frequency": 2.3
  },
  "top_performers": {
    "metric": "spend",
    "metric_label": "消費額",
    "top": [
      {
        "rank": 1,
        "name": "Winter Sale 2026",
        "metric_value": 120000,
        "ctr": 1.8,
        "cpc": 14.5,
        "conversions": 60,
        "cpa": 2000
      }
    ]
  },
  "recommendations": [
    {
      "priority": "high",
      "title": "高CPA広告セットを最適化",
      "description": "3つの広告セットでCPA > 3000円。クリエイティブ刷新またはターゲティング見直しを推奨。"
    },
    {
      "priority": "medium",
      "title": "好成績キャンペーンを拡大",
      "description": "「Winter Sale 2026」がCPA 2000円で好調。予算増額でさらなる成果を期待できます。"
    }
  ],
  "raw_data_count": 15
}
```

**使用例**:
```javascript
// キャンペーン全体のパフォーマンス（過去7日）
get_performance_report({
  level: "campaign",
  date_preset: "last_7d",
  metric_preset: "overview",
  rank_by: "spend",
  dry_run: false
})

// 特定キャンペーンの広告セット分析
get_performance_report({
  level: "adset",
  object_id: "120212345678901234",
  date_preset: "last_30d",
  metric_preset: "conversions",
  rank_by: "cpa",
  dry_run: false
})

// 広告レベルの詳細分析
get_performance_report({
  level: "ad",
  date_preset: "this_month",
  metric_preset: "full",
  rank_by: "conversions",
  dry_run: false
})
```

---

### 2. get_creative_report

クリエイティブ/広告のパフォーマンスを分析します。CTR、コンバージョン、CPAで比較し、勝者クリエイティブと疲弊クリエイティブを特定します。

**パラメータ**:
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| `adset_id` | string | ❌ | 広告セットID（省略時はアカウント全体） |
| `date_preset` | string | ❌ | 期間プリセット（デフォルト: last_7d） |
| `dry_run` | boolean | ❌ | true=デモデータでプレビュー（デフォルト: true） |

**戻り値**:
```json
{
  "title": "クリエイティブパフォーマンスレポート",
  "generated_at": "2026-02-23T15:30:45.123Z",
  "mode": "live",
  "total_creatives": 8,
  "top_performers": [
    {
      "rank": 1,
      "ad_id": "ad_001",
      "ad_name": "CTA: 今すぐ購入",
      "creative_id": "creative_001",
      "spend": 45000,
      "impressions": 180000,
      "clicks": 3200,
      "ctr": 1.78,
      "cpc": 14.06,
      "conversions": 25,
      "cpa": 1800
    }
  ],
  "fatigued_creatives": [
    {
      "ad_id": "ad_005",
      "ad_name": "古いクリエイティブ",
      "impressions": 120000,
      "clicks": 400,
      "ctr": 0.33,
      "frequency": 4.5,
      "reason": "CTR < 0.5% かつ Frequency > 3.5"
    }
  ],
  "recommendations": [
    {
      "priority": "high",
      "title": "勝者クリエイティブをスケール",
      "description": "「CTA: 今すぐ購入」が最高パフォーマンス（CV: 25）。予算増額または類似クリエイティブ制作を推奨。"
    },
    {
      "priority": "medium",
      "title": "疲弊クリエイティブを更新",
      "description": "1件の広告がCTR < 0.5%で疲弊の兆候。新規クリエイティブへの差し替えを検討。"
    }
  ]
}
```

**使用例**:
```javascript
// アカウント全体のクリエイティブ分析
get_creative_report({
  date_preset: "last_7d",
  dry_run: false
})

// 特定広告セットのクリエイティブ分析
get_creative_report({
  adset_id: "120212345678901235",
  date_preset: "last_14d",
  dry_run: false
})
```

---

### 3. get_audience_report

オーディエンスセグメント別のパフォーマンスを分析します。年齢、性別、地域、デバイス、配置等で分析できます。

**パラメータ**:
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| `breakdown_type` | string | ❌ | 分析軸（age/gender/age,gender/country/region/publisher_platform/platform_position/device_platform、デフォルト: age,gender） |
| `level` | string | ❌ | レポートレベル（campaign/adset/ad、デフォルト: campaign） |
| `date_preset` | string | ❌ | 期間プリセット（デフォルト: last_7d） |
| `dry_run` | boolean | ❌ | true=デモデータでプレビュー（デフォルト: true） |

**戻り値**:
```json
{
  "title": "オーディエンス分析レポート（年齢・性別）",
  "generated_at": "2026-02-23T15:30:45.123Z",
  "mode": "live",
  "breakdown_type": "age,gender",
  "summary": {
    "total_spend": 450000,
    "total_impressions": 1850000,
    "total_conversions": 185
  },
  "breakdown": {
    "breakdown_type": "age",
    "total_segments": 6,
    "segments": [
      {
        "rank": 1,
        "segment": "25-34",
        "spend": 180000,
        "spend_percent": 40.0,
        "impressions": 720000,
        "clicks": 12800,
        "ctr": 1.78,
        "conversions": 85,
        "cpa": 2117.65
      },
      {
        "rank": 2,
        "segment": "35-44",
        "spend": 135000,
        "spend_percent": 30.0,
        "impressions": 540000,
        "clicks": 8100,
        "ctr": 1.50,
        "conversions": 55,
        "cpa": 2454.55
      }
    ]
  },
  "recommendations": [
    {
      "priority": "high",
      "title": "トップセグメント: 25-34",
      "description": "「25-34」が最も高いシェア（40.0%）。このセグメントに注力することでROI向上が見込めます。"
    }
  ]
}
```

**使用例**:
```javascript
// 年齢・性別分析
get_audience_report({
  breakdown_type: "age,gender",
  level: "campaign",
  date_preset: "last_7d",
  dry_run: false
})

// 国別分析
get_audience_report({
  breakdown_type: "country",
  level: "adset",
  date_preset: "last_30d",
  dry_run: false
})

// 配置別分析（Facebook vs Instagram）
get_audience_report({
  breakdown_type: "publisher_platform",
  level: "campaign",
  date_preset: "last_14d",
  dry_run: false
})

// デバイス別分析
get_audience_report({
  breakdown_type: "device_platform",
  level: "campaign",
  date_preset: "last_7d",
  dry_run: false
})
```

---

### 4. get_trend_report

時系列のパフォーマンストレンドを分析します。日次/週次/月次で推移を確認し、改善/低下パターンを検出します。

**パラメータ**:
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| `level` | string | ❌ | レポートレベル（campaign/adset/ad、デフォルト: campaign） |
| `date_preset` | string | ❌ | 期間プリセット（デフォルト: last_14d） |
| `time_increment` | string | ❌ | 時系列の粒度（1=日次/7=週次/monthly=月次、デフォルト: 1） |
| `dry_run` | boolean | ❌ | true=デモデータでプレビュー（デフォルト: true） |

**戻り値**:
```json
{
  "title": "トレンド分析レポート",
  "generated_at": "2026-02-23T15:30:45.123Z",
  "mode": "live",
  "time_period": "過去14日間",
  "time_increment": "日次",
  "summary": {
    "total_spend": 450000,
    "total_impressions": 1850000,
    "total_conversions": 185
  },
  "trends": {
    "trend": "improving",
    "trend_label": "改善傾向",
    "points": [
      {
        "date": "2026-02-16",
        "spend": 28000,
        "clicks": 1800,
        "ctr": 1.45
      },
      {
        "date": "2026-02-17",
        "spend": 30000,
        "clicks": 2000,
        "ctr": 1.52
      }
    ],
    "changes": {
      "spend_change_percent": 12.5,
      "clicks_change_percent": 18.2,
      "ctr_change_percent": 4.8
    }
  },
  "recommendations": [
    {
      "priority": "high",
      "title": "改善トレンド継続",
      "description": "パフォーマンスが改善傾向です。現在の戦略を維持しつつ、予算増額でさらなる成果を狙いましょう。"
    }
  ]
}
```

**使用例**:
```javascript
// 日次トレンド分析（過去14日）
get_trend_report({
  level: "campaign",
  date_preset: "last_14d",
  time_increment: "1",
  dry_run: false
})

// 週次トレンド分析（過去30日）
get_trend_report({
  level: "adset",
  date_preset: "last_30d",
  time_increment: "7",
  dry_run: false
})

// 月次トレンド分析
get_trend_report({
  level: "campaign",
  date_preset: "maximum",
  time_increment: "monthly",
  dry_run: false
})
```

---

### 5. export_report

JSONレポートをMarkdown、CSV、テキスト形式にエクスポートします。

**パラメータ**:
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| `report_data` | object | ✅ | エクスポートするレポートデータ（JSON） |
| `format` | string | ❌ | 出力フォーマット（markdown/csv/text、デフォルト: markdown） |
| `include_raw_data` | boolean | ❌ | CSVエクスポート時に生データを含める（デフォルト: false） |

**戻り値**:
```json
{
  "success": true,
  "format": "markdown",
  "exported_length": 2450,
  "saved_to": "meta-report-mcp/output/export_2026-02-23T15-30-45.md",
  "preview": "# パフォーマンスレポート（キャンペーン）\n\n**期間**: 2026-02-16 ~ 2026-02-22\n**生成日時**: 2026-02-23T15:30:45.123Z\n\n## サマリー\n\n| メトリクス | 値 |\n|----------|----|\n| 総消費額 | ¥450,000 |\n...(truncated)"
}
```

**使用例**:
```javascript
// パフォーマンスレポートをMarkdownエクスポート
const report = get_performance_report({
  level: "campaign",
  date_preset: "last_7d",
  dry_run: false
});

export_report({
  report_data: report,
  format: "markdown"
})

// CSVエクスポート（生データ含む）
export_report({
  report_data: report,
  format: "csv",
  include_raw_data: true
})
```

## メトリクスプリセット

### 1. overview（概要）

**メトリクス**: spend, impressions, clicks, ctr, cpc, cpm, conversions, cpa
**用途**: 日常的なパフォーマンス確認
**推奨**: デフォルトプリセット

---

### 2. conversions（コンバージョン）

**メトリクス**: spend, impressions, clicks, conversions, cpa, roas, cost_per_conversion
**用途**: CV最適化キャンペーン
**推奨**: EC、リード獲得

---

### 3. engagement（エンゲージメント）

**メトリクス**: impressions, reach, frequency, clicks, ctr, link_clicks, post_engagement
**用途**: ブランド認知、エンゲージメント重視
**推奨**: SNSキャンペーン

---

### 4. video（動画）

**メトリクス**: impressions, reach, video_views, video_p25_watched, video_p50_watched, video_p75_watched, video_p100_watched
**用途**: 動画広告分析
**推奨**: ブランディング、ストーリー広告

---

### 5. full（全指標）

**メトリクス**: 18指標すべて
**用途**: 詳細分析、レポート作成
**推奨**: 月次レビュー

## 期間プリセット

| プリセット | 説明 | 日数 |
|-----------|------|------|
| `today` | 本日 | 1 |
| `yesterday` | 昨日 | 1 |
| `last_3d` | 過去3日間 | 3 |
| `last_7d` | 過去7日間 | 7 |
| `last_14d` | 過去14日間 | 14 |
| `last_30d` | 過去30日間 | 30 |
| `this_month` | 今月 | 変動 |
| `last_month` | 先月 | 変動 |
| `this_quarter` | 今四半期 | 変動 |
| `last_quarter` | 前四半期 | 変動 |
| `maximum` | アカウント開設以降 | 変動 |

## 分析軸（Breakdowns）

| 分析軸 | 説明 | 用途 |
|--------|------|------|
| `age` | 年齢（18-24, 25-34等） | ターゲット年齢特定 |
| `gender` | 性別（male, female） | 性別別パフォーマンス |
| `age,gender` | 年齢 x 性別 | 詳細デモグラ分析 |
| `country` | 国（JP, US等） | 国別展開判断 |
| `region` | 地域（都道府県） | エリアマーケティング |
| `dma` | DMA（米国市場圏） | 米国広告 |
| `publisher_platform` | プラットフォーム（facebook, instagram） | FB vs IG比較 |
| `platform_position` | 配置（feed, story, reels） | 配置最適化 |
| `device_platform` | デバイス（mobile, desktop） | デバイス戦略 |
| `impression_device` | 表示デバイス | クロスデバイス分析 |

## 自動推奨の種類

レポート生成時、パフォーマンスデータを自動分析し、以下の推奨を生成します。

### 高優先度（high）

1. **高CPA警告**: CPA > 3000円の広告セット/キャンペーンがある場合
2. **低CTR警告**: CTR < 0.5%かつIMP > 5000の場合
3. **トレンド低下**: 前期比でspend増、conversion減の場合
4. **フリクエンシー過多**: Frequency > 3.5の場合

### 中優先度（medium）

1. **好成績スケール**: CPA < 1500円かつCV >= 10件の場合
2. **勝者クリエイティブ**: トップパフォーマンス広告の予算増額提案
3. **トップセグメント注力**: 最大シェアセグメントへの集中提案

### 低優先度（low）

1. **データ不足警告**: IMP < 1000の場合
2. **テスト期間延長**: A/Bテストでサンプル不足の場合

## 出力フォーマット

### Markdown形式

```markdown
# パフォーマンスレポート（キャンペーン）

**期間**: 2026-02-16 ~ 2026-02-22
**生成日時**: 2026-02-23T15:30:45.123Z
**モード**: live

## サマリー

| メトリクス | 値 |
|----------|-----|
| 総消費額 | ¥450,000 |
| 総インプレッション | 1,850,000 |
| 総クリック数 | 28,500 |
| 総コンバージョン数 | 185 |
| 平均CTR | 1.54% |
| 平均CPC | ¥15.79 |
| 平均CPA | ¥2,432.43 |
| 平均ROAS | 3.2 |

## トップパフォーマー（消費額順）

| ランク | 名前 | 消費額 | CTR | CPC | CV数 | CPA |
|--------|------|--------|-----|-----|------|-----|
| 1 | Winter Sale 2026 | ¥120,000 | 1.8% | ¥14.5 | 60 | ¥2,000 |
| 2 | Spring Campaign | ¥95,000 | 1.6% | ¥16.2 | 40 | ¥2,375 |

## 推奨アクション

### 🔴 高優先度

- **高CPA広告セットを最適化**: 3つの広告セットでCPA > 3000円。クリエイティブ刷新またはターゲティング見直しを推奨。

### 🟡 中優先度

- **好成績キャンペーンを拡大**: 「Winter Sale 2026」がCPA 2000円で好調。予算増額でさらなる成果を期待できます。
```

### CSV形式

```csv
campaign_name,spend,impressions,clicks,ctr,cpc,conversions,cpa
Winter Sale 2026,120000,650000,11700,1.8,14.5,60,2000
Spring Campaign,95000,590000,9440,1.6,16.2,40,2375
...
```

## 他モジュールとの連携

### 全モジュール連携の完全ワークフロー

```javascript
// ========================================
// Step 1: クリエイティブ生成 (Module 1)
// ========================================
generate_ad_creative({
  campaign_id: "winter_sale",
  template_id: "discount",
  product_name: "ウィンターコート",
  target_audience: "25-45歳女性",
  key_message: "50%オフ",
  ad_format: "feed_square"
})

// ========================================
// Step 2: キャンペーン作成 (Module 2)
// ========================================
create_full_campaign({
  campaign_name: "Winter Sale 2026",
  objective: "sales",
  daily_budget: 10000,
  creative_path: "output/winter_sale/.../creative.json",
  link_url: "https://example.com/sale",
  dry_run: false
})
// → campaign_id: "120212345678901234"

// ========================================
// Step 3: トラッキング設定 (Module 5)
// ========================================
get_pixel_code({
  include: ["base_code", "event_snippets", "dedup_snippets"],
  events: ["Purchase", "AddToCart"]
})
// → コードをサイトに実装

// ========================================
// Step 4: 予算最適化ルール設定 (Module 3)
// ========================================
create_rule({
  template_id: "pause_high_cpa",
  conditions: [
    { value: 3000 },
    { value: 5000 }
  ]
})

// ========================================
// Step 5: 7日後にパフォーマンスレポート確認 (Module 6)
// ========================================
get_performance_report({
  level: "campaign",
  object_id: "120212345678901234",
  date_preset: "last_7d",
  metric_preset: "conversions",
  dry_run: false
})

// ========================================
// Step 6: クリエイティブ分析 (Module 6)
// ========================================
get_creative_report({
  adset_id: "120212345678901235",
  date_preset: "last_7d",
  dry_run: false
})
// → 勝者クリエイティブを特定

// ========================================
// Step 7: A/Bテスト実施 (Module 4)
// ========================================
create_experiment({
  name: "CTA Test",
  test_variable: "creative",
  test_objective: "cost_per_result",
  variant_ids: ["adset_001", "adset_002"],
  duration_days: 7,
  dry_run: false
})

// ========================================
// Step 8: 14日後にトレンド分析 (Module 6)
// ========================================
get_trend_report({
  level: "campaign",
  date_preset: "last_14d",
  time_increment: "1",
  dry_run: false
})

// ========================================
// Step 9: オーディエンス分析 (Module 6)
// ========================================
get_audience_report({
  breakdown_type: "age,gender",
  level: "campaign",
  date_preset: "last_14d",
  dry_run: false
})

// ========================================
// Step 10: レポート出力 (Module 6)
// ========================================
export_report({
  report_data: performance_report,
  format: "markdown"
})
// → Markdownレポートを保存
```

## テスト

```bash
# スモークテスト実行
cd meta-report-mcp
node test/smoke-test.js
```

期待される出力：
```
=== Meta Report MCP Smoke Test ===

1. Config:
   Configured: false
   Metric presets: overview, conversions, engagement, video, full
   ...

=== All tests passed! ===
```

## トラブルシューティング

### レポートが空（データなし）

**原因1**: date_preset が未来日または遠すぎる過去

**解決策**: 適切な期間を指定（last_7d, last_30d等）

**原因2**: object_id が存在しない

**解決策**: object_id を省略してアカウント全体を取得

**原因3**: キャンペーンが未配信

**解決策**: 配信中のキャンペーンを確認

### エラー: (#100) Invalid parameter

**原因**: breakdown_type が不正

**解決策**: 許可されている分析軸を使用
- OK: `age`, `gender`, `age,gender`, `country`, `publisher_platform`
- NG: `age+gender`（カンマ区切り以外はNG）

### CSV出力エラー: raw_data missing

**原因**: `include_raw_data: true` だが report_data に raw_data フィールドがない

**解決策1**: Markdownまたはテキスト形式を使用
```javascript
export_report({
  report_data: report,
  format: "markdown"
})
```

**解決策2**: CSVは生データ配列を直接渡す
```javascript
// get_performance_report の raw_data を抽出
export_report({
  report_data: { raw_data: [...] },
  format: "csv",
  include_raw_data: true
})
```

### トレンド分析で "trend: stable" ばかり

**原因**: データ変動が小さい、またはサンプル期間が短い

**解決策**:
- 期間を延長（last_30d以上）
- time_increment を週次（7）に変更

### Markdown出力が文字化け

**原因**: ファイルエンコーディングの問題

**解決策**: UTF-8で保存されていることを確認

## API仕様

- **Meta Marketing API**: v25.0
- **エンドポイント**:
  - Insights: `act_{ad_account_id}/insights`
  - Campaign Insights: `{campaign_id}/insights`
  - AdSet Insights: `{adset_id}/insights`
  - Ad Insights: `{ad_id}/insights`
- **認証**: OAuth 2.0 Access Token
- **レート制限**: 200 calls / hour / user
- **必須スコープ**: `ads_read`, `business_management`

## 出力ファイル

すべてのツールは実行結果を `output/` ディレクトリに保存します。

```
meta-report-mcp/
└── output/
    ├── performance_report_2026-02-23T15-30-45.json
    ├── creative_report_2026-02-23T16-00-00.json
    ├── audience_report_2026-02-23T16-30-00.json
    ├── trend_report_2026-02-23T17-00-00.json
    ├── export_2026-02-23T17-30-00.md
    └── export_2026-02-23T17-35-00.csv
```

## ライセンス

MIT License

---

**作成日**: 2026-02-23
**バージョン**: 1.0.0
