# Module 4: Meta Experiment MCP Server

Meta Marketing API v25.0 Experiments API を使用したA/Bテスト自動化モジュール。統計的有意差判定、勝者スケール、自動終了を実現します。

## 概要

このモジュールは、Meta広告のA/Bテストを自動化します。2-5個のバリアント（キャンペーンまたは広告セット）を比較し、統計エンジンで勝者を判定、自動的に予算スケールや敗者停止が可能です。

### 主な機能

- 🧪 **A/Bテスト作成**: 2-5バリアントの比較実験を自動作成
- 📊 **統計分析エンジン**: Z-score、p値、信頼区間による有意差判定
- 🏆 **勝者判定**: 6つのテスト目的（CPA/CTR/CV率/ROAS/CPC/CPM）
- ⚙️ **6つのテスト変数**: creative/audience/placement/optimization/bid_strategy/landing_page
- 🎯 **4つの信頼度レベル**: 65%/80%/90%/95%
- 🔄 **勝者アクション**: scale_budget/pause_losers/apply_and_end/report_only
- 🧪 **dry_run モード**: API実行前にプレビュー（デフォルト有効）

## インストール

```bash
cd meta-experiment-mcp
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

### 1. create_experiment

A/Bテスト実験を作成します。2-5個のバリアントを比較し、指定期間後に統計分析で勝者を判定します。

**パラメータ**:
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| `name` | string | ✅ | 実験名（例: 'CTA比較テスト_2月'） |
| `description` | string | ❌ | テスト目的の説明 |
| `test_variable` | string | ❌ | テスト変数（creative/audience/placement/optimization/bid_strategy/landing_page、デフォルト: creative） |
| `test_objective` | string | ❌ | 判定基準（cost_per_result/ctr/conversion_rate/roas/cpc/cpm、デフォルト: cost_per_result） |
| `level` | string | ❌ | テストレベル（campaign/adset、デフォルト: campaign） |
| `variant_ids` | array | ✅ | 比較するキャンペーンIDまたは広告セットIDの配列（2-5個） |
| `campaign_id` | string | ❌ | 親キャンペーンID（level=adsetの場合） |
| `duration_days` | number | ❌ | テスト期間（4-30日、推奨7日、デフォルト: 7） |
| `confidence_level` | number | ❌ | 信頼度レベル（65/80/90/95、デフォルト: 90） |
| `daily_budget_per_variant` | number | ❌ | バリアントごとの日予算（通貨最小単位） |
| `dry_run` | boolean | ❌ | true=プレビューモード（デフォルト: true） |

**戻り値**:
```json
{
  "success": true,
  "mode": "live",
  "experiment_id": "120212345678901234",
  "experiment_plan": {
    "name": "CTA比較テスト_2月",
    "test_variable": "creative",
    "test_objective": "cost_per_result",
    "variants": [
      { "id": "camp_001", "label": "Variant A", "traffic_split": "33.3%" },
      { "id": "camp_002", "label": "Variant B", "traffic_split": "33.3%" },
      { "id": "camp_003", "label": "Variant C", "traffic_split": "33.4%" }
    ],
    "duration": {
      "days": 7,
      "start": "2026-02-23",
      "end": "2026-03-02"
    },
    "confidence_level": 90,
    "success_criteria": "勝者は統計的に有意（p < 0.10）かつCPAが最低"
  },
  "note": "実験が作成されました。7日後にget_experiment_resultsで結果を確認してください。"
}
```

**使用例**:
```javascript
// クリエイティブA/Bテスト（CPA比較）
create_experiment({
  name: "CTA A/B Test - Feb 2026",
  description: "「今すぐ購入」vs「詳細を見る」のCTA比較",
  test_variable: "creative",
  test_objective: "cost_per_result",
  level: "campaign",
  variant_ids: ["120212345678901234", "120212345678901235"],
  duration_days: 7,
  confidence_level: 90,
  dry_run: false
})

// オーディエンステスト（CTR比較）
create_experiment({
  name: "Audience Test - 25-34 vs 35-44",
  test_variable: "audience",
  test_objective: "ctr",
  level: "adset",
  campaign_id: "120212345678901234",
  variant_ids: ["adset_001", "adset_002", "adset_003"],
  duration_days: 10,
  confidence_level: 95,
  dry_run: false
})

// 入札戦略テスト（ROAS比較）
create_experiment({
  name: "Bid Strategy Test",
  test_variable: "bid_strategy",
  test_objective: "roas",
  level: "campaign",
  variant_ids: ["camp_lowest", "camp_cost_cap", "camp_roas"],
  duration_days: 14,
  dry_run: false
})
```

---

### 2. list_experiments

アカウント内のA/Bテスト実験一覧を取得します。

**パラメータ**:
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| `status_filter` | string | ❌ | ステータスフィルタ（all/active/completed/scheduled、デフォルト: all） |

**戻り値**:
```json
{
  "success": true,
  "mode": "live",
  "total": 3,
  "filter": "all",
  "experiments": [
    {
      "id": "120212345678901234",
      "name": "CTA A/B Test - Feb 2026",
      "status": "ACTIVE",
      "start_time": "2026-02-23T00:00:00+0000",
      "end_time": "2026-03-02T23:59:59+0000",
      "cells": [
        { "name": "Cell 1", "campaigns": [...] },
        { "name": "Cell 2", "campaigns": [...] }
      ],
      "winner_cell": null
    }
  ]
}
```

**使用例**:
```javascript
// 全実験を取得
list_experiments()

// 進行中の実験のみ
list_experiments({
  status_filter: "active"
})

// 完了した実験のみ
list_experiments({
  status_filter: "completed"
})
```

---

### 3. get_experiment_results

実験の詳細結果を取得し、統計分析を実行します。サンプルデータでのテストも可能です。

**パラメータ**:
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| `experiment_id` | string | ❌ | 実験ID（live取得用。省略時はデモデータを使用） |
| `test_objective` | string | ❌ | 判定基準メトリクス（デフォルト: cost_per_result） |
| `confidence_level` | number | ❌ | 信頼度レベル（デフォルト: 90） |
| `sample_data` | array | ❌ | テスト用サンプルデータ（省略時はデモデータ） |

**戻り値**:
```json
{
  "success": true,
  "mode": "live",
  "experiment_id": "120212345678901234",
  "data_source": "meta_api",
  "analysis": {
    "test_objective": "cost_per_result",
    "confidence_level": 90,
    "status": "clear_winner",
    "status_label": "統計的有意な勝者あり",
    "leader": {
      "id": "camp_002",
      "name": "Variant B",
      "primary_metric": 1820.5,
      "metric_label": "CPA: ¥1,821"
    },
    "variants": [
      {
        "id": "camp_002",
        "name": "Variant B",
        "spend": 68500,
        "impressions": 285000,
        "clicks": 4200,
        "conversions": 38,
        "ctr": 1.47,
        "cpc": 16.31,
        "cpa": 1802.63,
        "roas": 3.2,
        "primary_metric": 1802.63
      },
      {
        "id": "camp_001",
        "name": "Variant A",
        "spend": 70000,
        "impressions": 290000,
        "clicks": 3800,
        "conversions": 28,
        "ctr": 1.31,
        "cpc": 18.42,
        "cpa": 2500.00,
        "roas": 2.4,
        "primary_metric": 2500.00
      }
    ],
    "comparisons": [
      {
        "variant_a": { "id": "camp_002", "name": "Variant B" },
        "variant_b": { "id": "camp_001", "name": "Variant A" },
        "z_score": 2.35,
        "p_value": 0.0188,
        "confidence_level": 90,
        "significant": true,
        "lift_percent": -27.9,
        "conclusion": "Variant B は Variant A より 27.9% 優れています（p=0.0188, 90%信頼度で有意）"
      }
    ],
    "recommendation": {
      "action": "apply_winner",
      "winner_id": "camp_002",
      "winner_name": "Variant B",
      "message": "Variant Bが明確な勝者です（CPA: ¥1,821、Variant Aより27.9%改善）。このバリアントに予算を集中することを推奨します。"
    }
  }
}
```

**使用例**:
```javascript
// 実験結果を取得（API）
get_experiment_results({
  experiment_id: "120212345678901234",
  test_objective: "cost_per_result",
  confidence_level: 90,
  dry_run: false
})

// デモデータでテスト
get_experiment_results({
  test_objective: "ctr",
  confidence_level: 95
})

// カスタムデータで分析
get_experiment_results({
  test_objective: "cost_per_result",
  sample_data: [
    {
      name: "Variant A",
      spend: "50000",
      impressions: "200000",
      clicks: "2000",
      conversions: 20,
      actions: [{ action_type: "purchase", value: "20" }],
      cost_per_action_type: [{ action_type: "purchase", value: "2500" }]
    },
    {
      name: "Variant B",
      spend: "50000",
      impressions: "200000",
      clicks: "3000",
      conversions: 30,
      actions: [{ action_type: "purchase", value: "30" }],
      cost_per_action_type: [{ action_type: "purchase", value: "1667" }]
    }
  ]
})
```

---

### 4. end_experiment

実験を終了し、オプションで勝者アクション（予算スケール、敗者停止）を実行します。

**パラメータ**:
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| `experiment_id` | string | ✅ | 終了する実験ID |
| `winner_action` | string | ❌ | 勝者に対するアクション（scale_budget/pause_losers/apply_and_end/report_only、デフォルト: report_only） |
| `winner_id` | string | ❌ | 勝者バリアントのキャンペーン/AdSet ID（scale_budget/apply_and_end時に必要） |
| `loser_ids` | array | ❌ | 敗者バリアントのID配列（pause_losers時に使用） |
| `scale_percent` | number | ❌ | 勝者の予算増額率（%、デフォルト: 50） |
| `dry_run` | boolean | ❌ | true=プレビューモード（デフォルト: true） |

**戻り値**:
```json
{
  "success": true,
  "mode": "live",
  "experiment_id": "120212345678901234",
  "winner_action": {
    "name": "勝者スケール",
    "description": "勝者の予算を増額し、敗者を停止"
  },
  "actions": [
    {
      "step": 1,
      "action": "end_experiment",
      "description": "実験を終了",
      "success": true
    },
    {
      "step": 2,
      "action": "scale_winner",
      "description": "勝者の予算を50%増額",
      "note": "現在の予算を取得してから増額します",
      "curl": "curl -X POST 'https://graph.facebook.com/v25.0/camp_002' ..."
    },
    {
      "step": 3,
      "action": "pause_loser",
      "description": "敗者 camp_001 を停止",
      "success": true
    }
  ],
  "note": "実験終了とアクションが適用されました。"
}
```

**使用例**:
```javascript
// 勝者の予算を増額 + 敗者停止
end_experiment({
  experiment_id: "120212345678901234",
  winner_action: "scale_budget",
  winner_id: "camp_002",
  loser_ids: ["camp_001", "camp_003"],
  scale_percent: 50,  // 50%増額
  dry_run: false
})

// 敗者のみ停止（勝者はそのまま）
end_experiment({
  experiment_id: "120212345678901234",
  winner_action: "pause_losers",
  loser_ids: ["camp_001"],
  dry_run: false
})

// 勝者を有効化、他は自動停止
end_experiment({
  experiment_id: "120212345678901234",
  winner_action: "apply_and_end",
  winner_id: "camp_002",
  dry_run: false
})

// レポートのみ（アクションなし）
end_experiment({
  experiment_id: "120212345678901234",
  winner_action: "report_only",
  dry_run: false
})
```

---

### 5. analyze_winner

バリアントのパフォーマンスデータから勝者を分析します。完全オフライン動作（API不要）。

**パラメータ**:
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| `variants` | array | ✅ | 比較するバリアントデータ（2-5個） |
| `test_objective` | string | ❌ | 判定基準（デフォルト: cost_per_result） |
| `confidence_level` | number | ❌ | 信頼度レベル（デフォルト: 90） |

**バリアントオブジェクト**:
```javascript
{
  name: "Variant A",
  spend: 50000,
  impressions: 200000,
  clicks: 2000,
  conversions: 20,    // 省略可（デフォルト: 0）
  revenue: 100000     // 省略可（デフォルト: 0）
}
```

**戻り値**:
```json
{
  "success": true,
  "mode": "offline_analysis",
  "test_objective_info": {
    "label": "結果あたりのコスト",
    "metric": "cpa",
    "lower_is_better": true
  },
  "confidence_info": {
    "level": 90,
    "z_critical": 1.645,
    "label": "90%信頼度（p < 0.10）"
  },
  "analysis": {
    "status": "clear_winner",
    "leader": {
      "id": "variant_b",
      "name": "Variant B",
      "primary_metric": 1666.67
    },
    "comparisons": [...],
    "recommendation": {...}
  }
}
```

**使用例**:
```javascript
// シンプルなA/Bテスト分析
analyze_winner({
  variants: [
    {
      name: "CTAパターンA（今すぐ購入）",
      spend: 50000,
      impressions: 200000,
      clicks: 2000,
      conversions: 20
    },
    {
      name: "CTAパターンB（詳細を見る）",
      spend: 50000,
      impressions: 200000,
      clicks: 3000,
      conversions: 30
    }
  ],
  test_objective: "cost_per_result",
  confidence_level: 90
})

// ROAS比較
analyze_winner({
  variants: [
    {
      name: "入札戦略: Lowest Cost",
      spend: 100000,
      impressions: 500000,
      clicks: 5000,
      conversions: 50,
      revenue: 300000
    },
    {
      name: "入札戦略: Cost Cap",
      spend: 100000,
      impressions: 450000,
      clicks: 4500,
      conversions: 60,
      revenue: 400000
    }
  ],
  test_objective: "roas",
  confidence_level: 95
})
```

## テスト変数（Test Variables）

### 1. creative（クリエイティブ）

**説明**: 広告画像、動画、コピーの比較
**用途**: 最も効果的なクリエイティブを特定
**例**: CTA「今すぐ購入」vs「詳細を見る」

---

### 2. audience（オーディエンス）

**説明**: ターゲット層の比較
**用途**: 最適な顧客セグメントを特定
**例**: 25-34歳 vs 35-44歳

---

### 3. placement（配置）

**説明**: 広告配置の比較
**用途**: 最もパフォーマンスの高い配置を特定
**例**: Instagram Feed vs Facebook Stories

---

### 4. optimization（最適化目標）

**説明**: 最適化イベントの比較
**用途**: 最適な最適化目標を特定
**例**: ランディングページビュー vs コンバージョン

---

### 5. bid_strategy（入札戦略）

**説明**: 入札戦略の比較
**用途**: 最もコスト効率の良い戦略を特定
**例**: Lowest Cost vs Cost Cap vs ROAS Goal

---

### 6. landing_page（ランディングページ）

**説明**: LPデザインの比較
**用途**: 最もCVRの高いLPを特定
**例**: シンプルLP vs 詳細LP

## テスト目的（Test Objectives）

### 1. cost_per_result（結果あたりのコスト）

**メトリクス**: CPA
**評価**: 低いほど良い
**用途**: リード獲得、購入促進

---

### 2. ctr（クリック率）

**メトリクス**: CTR (%)
**評価**: 高いほど良い
**用途**: トラフィック誘導、認知拡大

---

### 3. conversion_rate（コンバージョン率）

**メトリクス**: CV数 / クリック数 (%)
**評価**: 高いほど良い
**用途**: LPテスト、ファネル最適化

---

### 4. roas（広告費用対効果）

**メトリクス**: 売上 / 広告費
**評価**: 高いほど良い
**用途**: EC、売上最大化

---

### 5. cpc（クリック単価）

**メトリクス**: CPC
**評価**: 低いほど良い
**用途**: トラフィック単価削減

---

### 6. cpm（1000インプレッション単価）

**メトリクス**: CPM
**評価**: 低いほど良い
**用途**: リーチ効率化

## 信頼度レベル

| レベル | Z値 | p値 | 推奨用途 |
|--------|-----|-----|---------|
| 65% | 0.935 | p < 0.35 | 迅速な判断が必要な場合 |
| 80% | 1.282 | p < 0.20 | 通常のA/Bテスト |
| 90% | 1.645 | p < 0.10 | **推奨デフォルト** |
| 95% | 1.960 | p < 0.05 | 重要な意思決定 |

**統計的有意とは**:
p値が閾値以下の場合、「偶然ではなく、本当に差がある」と判断できます。

例: 90%信頼度（p < 0.10）で有意 = 90%の確率で勝者が実際に優れている

## 勝者アクション

### 1. scale_budget（勝者スケール）

**動作**: 勝者の予算を増額し、敗者を停止
**用途**: 勝者に集中投資
**パラメータ**: `scale_percent`（増額率、デフォルト50%）

---

### 2. pause_losers（敗者停止）

**動作**: 敗者のみ停止、勝者はそのまま
**用途**: 無駄な広告費を削減
**パラメータ**: `loser_ids`（停止するID配列）

---

### 3. apply_and_end（適用して終了）

**動作**: 勝者を有効化、他は自動停止
**用途**: テスト終了後の自動切替
**パラメータ**: `winner_id`

---

### 4. report_only（レポートのみ）

**動作**: アクションなし、結果のみ記録
**用途**: 手動で判断したい場合

## 他モジュールとの連携

### Module 1（クリエイティブ生成）+ Module 2（キャンペーン作成）との連携

```javascript
// Step 1: Module 1で複数クリエイティブ生成
generate_ad_variations({
  campaign_id: "cta_test",
  product_name: "ウィンターコート",
  target_audience: "25-45歳女性",
  key_message: "50%オフ",
  ad_formats: ["feed_square"],
  template_ids: ["discount", "urgency"],
  variations_per_format: 1
})
// → 2パターンのクリエイティブ生成

// Step 2: Module 2で2つのキャンペーン作成
create_full_campaign({
  campaign_name: "CTA Test A - 今すぐ購入",
  objective: "sales",
  daily_budget: 5000,
  creative_path: "output/cta_test/.../creative_1.json",
  link_url: "https://example.com/sale",
  dry_run: false
})
// → campaign_id: "camp_001"

create_full_campaign({
  campaign_name: "CTA Test B - 詳細を見る",
  objective: "sales",
  daily_budget: 5000,
  creative_path: "output/cta_test/.../creative_2.json",
  link_url: "https://example.com/sale",
  dry_run: false
})
// → campaign_id: "camp_002"

// Step 3: Module 4でA/Bテスト実行
create_experiment({
  name: "CTA A/B Test - Feb 2026",
  test_variable: "creative",
  test_objective: "cost_per_result",
  level: "campaign",
  variant_ids: ["camp_001", "camp_002"],
  duration_days: 7,
  confidence_level: 90,
  dry_run: false
})

// Step 4: 7日後に結果確認
get_experiment_results({
  experiment_id: "exp_123",
  dry_run: false
})

// Step 5: 勝者スケール
end_experiment({
  experiment_id: "exp_123",
  winner_action: "scale_budget",
  winner_id: "camp_002",
  loser_ids: ["camp_001"],
  scale_percent: 100,  // 予算2倍
  dry_run: false
})
```

### Module 3（予算最適化）との連携

```javascript
// 実験終了後、勝者に自動スケールルールを設定
end_experiment({
  experiment_id: "exp_123",
  winner_action: "apply_and_end",
  winner_id: "camp_winner",
  dry_run: false
})

// Module 3: 勝者に好成績スケールルール適用
create_rule({
  template_id: "scale_winner",
  conditions: [
    { value: 1500 },  // CPA < 1500
    { value: 20 },    // CV >= 20
    { value: 3.0 }    // ROAS >= 3.0
  ],
  action: {
    type: "increase_budget",
    percent: 30
  }
})
```

## テスト

```bash
# スモークテスト実行
cd meta-experiment-mcp
node test/smoke-test.js
```

期待される出力：
```
=== Meta Experiment MCP Smoke Test ===

1. Config:
   Configured: false
   Test variables: creative, audience, placement, optimization, bid_strategy, landing_page
   ...

=== All tests passed! ===
```

## トラブルシューティング

### エラー: バリアントは2-5個必要です

**原因**: variant_ids の要素数が1個以下、または6個以上

**解決策**:
```javascript
// NG: 1個のみ
create_experiment({
  variant_ids: ["camp_001"]
})

// OK: 2-5個
create_experiment({
  variant_ids: ["camp_001", "camp_002"]
})
```

### 統計的有意差が出ない（status: "inconclusive"）

**原因1**: サンプルサイズ不足（テスト期間が短い）

**解決策**: テスト期間を延長（14日以上推奨）

**原因2**: バリアント間の差が小さい

**解決策**: より大きな差がある要素をテスト（例: CTAテキストではなく、全く異なるクリエイティブ）

**原因3**: 信頼度レベルが高すぎる

**解決策**: 信頼度を90%または80%に下げる

### エラー: Winner ID required

**原因**: `winner_action` が `scale_budget` または `apply_and_end` だが `winner_id` が未指定

**解決策**:
```javascript
// get_experiment_results で勝者IDを確認してから指定
const results = get_experiment_results({
  experiment_id: "exp_123"
});
const winnerId = results.analysis.leader.id;

end_experiment({
  experiment_id: "exp_123",
  winner_action: "scale_budget",
  winner_id: winnerId,  // 必須
  dry_run: false
})
```

## API仕様

- **Meta Marketing API**: v25.0
- **エンドポイント**:
  - Experiments: `act_{ad_account_id}/experiments`
  - Experiment Details: `{experiment_id}`
  - End Experiment: `{experiment_id}/end`
- **認証**: OAuth 2.0 Access Token
- **レート制限**: 200 calls / hour / user
- **必須スコープ**: `ads_management`, `ads_read`, `business_management`

## 出力ファイル

すべてのツールは実行結果を `output/` ディレクトリに保存します。

```
meta-experiment-mcp/
└── output/
    ├── experiment_plan_2026-02-23T15-30-45.json
    ├── experiment_created_2026-02-23T15-35-00.json
    ├── experiment_results_2026-03-02T10-00-00.json
    └── winner_analysis_2026-03-02T10-30-00.json
```

## ライセンス

MIT License

---

**作成日**: 2026-02-23
**バージョン**: 1.0.0
