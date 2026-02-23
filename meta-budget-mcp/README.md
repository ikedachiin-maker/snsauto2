# Module 3: Meta Budget MCP Server

Meta Marketing API v25.0 を使用した予算最適化・自動ルールエンジンモジュール。CBO管理、入札戦略変更、if-thenルールによる自動化を実現します。

## 概要

このモジュールは、Meta広告アカウントの予算管理を自動化します。キャンペーン・広告セットの予算/入札戦略を更新でき、パフォーマンスデータに基づいたif-thenルールで自動最適化が可能です。

### 主な機能

- 💰 **予算一覧取得**: アカウント全体の予算・入札戦略を俯瞰
- 📊 **パフォーマンス分析**: Insights APIで成果指標を取得・分析
- ⚙️ **予算/入札更新**: 日予算、入札戦略を個別変更
- 🤖 **ルールエンジン**: if-then条件による自動最適化
- 📋 **5つのテンプレート**: pause_high_cpa, scale_winner, frequency_cap, low_ctr_alert, roas_scaledown
- 🧪 **dry_run モード**: API実行前にプレビュー（デフォルト有効）

## インストール

```bash
cd meta-budget-mcp
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

### 1. get_budget_overview

アカウント全体の予算状況とパフォーマンスを取得します。

**パラメータ**:
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| `window` | string | ❌ | パフォーマンス評価期間（today/yesterday/last_3d/last_7d/last_14d/last_30d、デフォルト: last_7d） |
| `campaign_id` | string | ❌ | 特定キャンペーンのみ取得（省略時はアカウント全体） |

**戻り値**:
```json
{
  "success": true,
  "mode": "live",
  "window": { "label": "過去7日間", "days": 7 },
  "summary": {
    "total_campaigns": 15,
    "active_campaigns": 12,
    "total_adsets": 48,
    "active_adsets": 40,
    "total_daily_budget": 150000
  },
  "campaigns": [
    {
      "id": "120212345678901234",
      "name": "Winter Sale 2026",
      "status": "ACTIVE",
      "objective": "OUTCOME_SALES",
      "daily_budget": 10000,
      "bid_strategy": "LOWEST_COST_WITH_BID_CAP"
    }
  ],
  "adset_performance": [
    {
      "adset_id": "120212345678901235",
      "adset_name": "Winter Sale - AdSet 1",
      "spend": "68500.50",
      "impressions": "285000",
      "clicks": "4200",
      "ctr": "1.47",
      "cpc": "16.31",
      "conversions": "28",
      "cpa": "2446.45",
      "frequency": "2.15"
    }
  ],
  "optimization_suggestions": [
    {
      "priority": "high",
      "title": "高CPA広告セットを最適化",
      "description": "3つの広告セットでCPA > 3000円。クリエイティブ刷新またはターゲティング見直しを推奨。"
    }
  ]
}
```

**使用例**:
```javascript
// 過去30日のパフォーマンスを取得
get_budget_overview({
  window: "last_30d"
})

// 特定キャンペーンのみ
get_budget_overview({
  campaign_id: "120212345678901234",
  window: "last_7d"
})
```

---

### 2. update_budget

キャンペーンまたは広告セットの予算/入札戦略を更新します。

**パラメータ**:
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| `object_id` | string | ✅ | キャンペーンまたは広告セットのID |
| `object_type` | string | ❌ | オブジェクトタイプ（campaign/adset、デフォルト: campaign） |
| `daily_budget` | number | ❌ | 新しい日予算（円） |
| `bid_strategy` | string | ❌ | 入札戦略（lowest_cost/cost_cap/bid_cap/roas_goal） |
| `bid_amount` | number | ❌ | 入札上限額（cost_cap/bid_cap使用時） |
| `roas_average_floor` | number | ❌ | 最低ROAS（roas_goal使用時、例: 2.0） |
| `dry_run` | boolean | ❌ | true=プレビューモード（デフォルト: true） |

**戻り値**:
```json
{
  "success": true,
  "mode": "live",
  "object_id": "120212345678901235",
  "object_type": "adset",
  "changes": {
    "daily_budget": "5000",
    "bid_strategy": "COST_CAP",
    "bid_amount": "2000"
  },
  "bid_strategy_info": {
    "name": "コスト上限",
    "api_value": "COST_CAP",
    "requires": "bid_amount",
    "description": "結果あたりの費用を上限以下に抑える"
  },
  "result": {
    "success": true
  }
}
```

**使用例**:
```javascript
// 予算のみ更新
update_budget({
  object_id: "120212345678901235",
  object_type: "adset",
  daily_budget: 5000,
  dry_run: false
})

// 入札戦略を cost_cap に変更
update_budget({
  object_id: "120212345678901234",
  object_type: "campaign",
  bid_strategy: "cost_cap",
  bid_amount: 2000,
  dry_run: false
})

// ROAS目標で最適化
update_budget({
  object_id: "120212345678901235",
  object_type: "adset",
  bid_strategy: "roas_goal",
  roas_average_floor: 2.5,
  dry_run: false
})
```

---

### 3. create_rule

予算最適化の自動ルールを作成します。if-then条件で動作し、評価時に条件を満たすとアクションを実行します。

**パラメータ**:
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| `template_id` | string | ❌ | プリセットテンプレートID（pause_high_cpa/scale_winner/frequency_cap/low_ctr_alert/roas_scaledown） |
| `name` | string | ❌ | ルール名（テンプレート使用時は自動設定） |
| `target_level` | string | ❌ | ルール適用レベル（campaign/adset/ad、デフォルト: adset） |
| `conditions` | array | ❌ | 条件リスト（テンプレート使用時はvalue上書き可能） |
| `action` | object | ❌ | アクション定義 |
| `evaluation_window` | string | ❌ | 評価期間（today/yesterday/last_3d/last_7d/last_14d/last_30d、デフォルト: last_7d） |

**条件オブジェクト**:
```javascript
{
  metric: "cpa",           // spend/impressions/clicks/ctr/cpc/cpm/conversions/cpa/roas/frequency
  operator: "gt",          // gt/gte/lt/lte/eq
  value: 3000             // 閾値
}
```

**アクションオブジェクト**:
```javascript
{
  type: "pause",           // pause/activate/increase_budget/decrease_budget/set_budget/change_bid_strategy/notify
  percent: 20,            // increase_budget/decrease_budgetの増減率（%）
  amount: 5000,           // set_budgetの金額
  strategy: "cost_cap"    // change_bid_strategyの戦略
}
```

**戻り値**:
```json
{
  "success": true,
  "rule": {
    "id": "rule_20260223_150030_abc123",
    "name": "高CPA広告セット停止",
    "enabled": true,
    "target_level": "adset",
    "conditions": [
      { "metric": "cpa", "operator": "gt", "value": 3000 },
      { "metric": "spend", "operator": "gte", "value": 5000 }
    ],
    "action": { "type": "pause" },
    "evaluation_window": "last_7d",
    "created_at": "2026-02-23T15:00:30.123Z"
  },
  "summary": "IF (CPA > 3000円 AND 消費額 >= 5000円) THEN 広告セットを停止"
}
```

**使用例1**: テンプレート使用（推奨）

```javascript
// テンプレート: 高CPA停止（閾値のみ指定）
create_rule({
  template_id: "pause_high_cpa",
  conditions: [
    { value: 3000 },  // CPA閾値
    { value: 5000 }   // 最低消費額
  ]
})

// テンプレート: 勝者スケール
create_rule({
  template_id: "scale_winner",
  conditions: [
    { value: 1500 },  // CPA上限
    { value: 10 },    // 最低コンバージョン数
    { value: 3.0 }    // 最低ROAS
  ],
  action: {
    type: "increase_budget",
    percent: 30  // 30%増額
  }
})

// テンプレート: フリクエンシー上限
create_rule({
  template_id: "frequency_cap",
  conditions: [
    { value: 3.5 }    // フリクエンシー上限
  ]
})
```

**使用例2**: カスタムルール

```javascript
// カスタム: CTR低下で通知
create_rule({
  name: "CTR低下アラート",
  target_level: "adset",
  conditions: [
    { metric: "ctr", operator: "lt", value: 0.5 },
    { metric: "impressions", operator: "gte", value: 10000 }
  ],
  action: { type: "notify" },
  evaluation_window: "last_3d"
})

// カスタム: 好成績なら予算倍増
create_rule({
  name: "好成績スケール",
  target_level: "campaign",
  conditions: [
    { metric: "roas", operator: "gte", value: 4.0 },
    { metric: "conversions", operator: "gte", value: 50 }
  ],
  action: {
    type: "increase_budget",
    percent: 100  // 予算を2倍に
  },
  evaluation_window: "last_7d"
})
```

---

### 4. list_rules

保存されているルール一覧を取得します。ルールの削除も可能です。

**パラメータ**:
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| `delete_rule_id` | string | ❌ | 削除するルールID（省略時は一覧表示） |

**戻り値**:
```json
{
  "success": true,
  "total": 5,
  "rules": [
    {
      "id": "rule_20260223_150030_abc123",
      "name": "高CPA広告セット停止",
      "enabled": true,
      "summary": "IF (CPA > 3000円 AND 消費額 >= 5000円) THEN 広告セットを停止",
      "target_level": "adset",
      "evaluation_window": "last_7d",
      "last_evaluated": "2026-02-23T14:30:00.000Z",
      "execution_count": 12,
      "created_at": "2026-02-23T15:00:30.123Z"
    }
  ]
}
```

**使用例**:
```javascript
// ルール一覧表示
list_rules()

// 特定ルールを削除
list_rules({
  delete_rule_id: "rule_20260223_150030_abc123"
})
```

---

### 5. evaluate_rules

有効なルールを実際のパフォーマンスデータに対して評価し、条件を満たすルールのアクションを実行します。

**パラメータ**:
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| `sample_data` | array | ❌ | テスト用サンプルデータ（省略時はAPIから取得、未設定時はデモデータ使用） |
| `execute` | boolean | ❌ | true=ルールアクションを実際に実行（デフォルト: false） |
| `dry_run` | boolean | ❌ | true=プレビューモード（デフォルト: true） |

**戻り値**:
```json
{
  "success": true,
  "mode": "dry_run",
  "data_source": "demo_data",
  "summary": {
    "rules_evaluated": 3,
    "data_rows": 3,
    "total_evaluations": 9,
    "rules_triggered": 2
  },
  "triggered": [
    {
      "rule": "高CPA広告セット停止",
      "target": "Demo AdSet B (CPA高い)",
      "conditions": [
        { "metric": "CPA", "actual": 6667, "threshold": 3000, "passed": true },
        { "metric": "消費額", "actual": 20000, "threshold": 5000, "passed": true }
      ],
      "action": "広告セット demo_adset_002 を停止",
      "curl": "curl -X POST 'https://graph.facebook.com/v25.0/demo_adset_002' ...",
      "executed": false
    }
  ]
}
```

**使用例**:
```javascript
// デモデータでプレビュー
evaluate_rules({
  dry_run: true
})

// 本番データで評価（実行なし）
evaluate_rules({
  dry_run: false,
  execute: false
})

// 本番データで評価 + 実行
evaluate_rules({
  dry_run: false,
  execute: true
})

// カスタムデータでテスト
evaluate_rules({
  sample_data: [
    {
      adset_id: "120212345678901235",
      adset_name: "Test AdSet A",
      spend: "12000",
      impressions: "60000",
      clicks: "450",
      ctr: "0.75",
      frequency: "2.8",
      actions: [{ action_type: "purchase", value: "3" }],
      cost_per_action_type: [{ action_type: "purchase", value: "4000" }]
    }
  ],
  dry_run: true
})
```

## 入札戦略（Bid Strategies）

### 1. lowest_cost（最小コスト）

**API値**: `LOWEST_COST_WITHOUT_CAP`
**説明**: 予算内で最大の結果を獲得（入札上限なし）
**用途**: ブランド認知、トラフィック誘導
**設定例**:
```javascript
update_budget({
  object_id: "120212345678901234",
  bid_strategy: "lowest_cost",
  dry_run: false
})
```

---

### 2. cost_cap（コスト上限）

**API値**: `COST_CAP`
**説明**: 結果あたりの費用を上限以下に抑える
**用途**: CPAを一定以下に保ちたい場合
**必須パラメータ**: `bid_amount`（上限CPA）
**設定例**:
```javascript
update_budget({
  object_id: "120212345678901235",
  bid_strategy: "cost_cap",
  bid_amount: 2000,  // CPA上限2,000円
  dry_run: false
})
```

---

### 3. bid_cap（入札上限）

**API値**: `LOWEST_COST_WITH_BID_CAP`
**説明**: オークションごとの入札額を制限
**用途**: 厳密な予算管理が必要な場合
**必須パラメータ**: `bid_amount`（入札上限額）
**設定例**:
```javascript
update_budget({
  object_id: "120212345678901235",
  bid_strategy: "bid_cap",
  bid_amount: 500,  // 入札上限500円
  dry_run: false
})
```

---

### 4. roas_goal（ROAS目標）

**API値**: `COST_CAP`（内部でROAS最適化）
**説明**: 広告費用対効果を目標値以上に保つ
**用途**: EC、売上重視キャンペーン
**必須パラメータ**: `roas_average_floor`（最低ROAS、例: 2.0）
**設定例**:
```javascript
update_budget({
  object_id: "120212345678901235",
  bid_strategy: "roas_goal",
  roas_average_floor: 2.5,  // 最低ROAS 2.5
  dry_run: false
})
```

## ルールテンプレート

### 1. pause_high_cpa（高CPA停止）

**条件**:
- CPA > 閾値（例: 3000円）
- 消費額 >= 最低額（例: 5000円）

**アクション**: 広告セット停止

**用途**: 無駄な広告費削減

**設定例**:
```javascript
create_rule({
  template_id: "pause_high_cpa",
  conditions: [
    { value: 3000 },  // CPA閾値
    { value: 5000 }   // 最低消費額
  ]
})
```

---

### 2. scale_winner（勝者スケール）

**条件**:
- CPA < 上限（例: 1500円）
- コンバージョン >= 最低数（例: 10件）
- ROAS >= 最低値（例: 3.0）

**アクション**: 予算増額（デフォルト20%）

**用途**: 好成績広告セットの予算拡大

**設定例**:
```javascript
create_rule({
  template_id: "scale_winner",
  conditions: [
    { value: 1500 },  // CPA上限
    { value: 10 },    // 最低CV数
    { value: 3.0 }    // 最低ROAS
  ],
  action: {
    type: "increase_budget",
    percent: 30  // 30%増額
  }
})
```

---

### 3. frequency_cap（フリクエンシー上限）

**条件**:
- フリクエンシー > 上限（例: 3.5）

**アクション**: 広告セット停止

**用途**: 広告疲弊防止

**設定例**:
```javascript
create_rule({
  template_id: "frequency_cap",
  conditions: [
    { value: 3.5 }  // フリクエンシー上限
  ]
})
```

---

### 4. low_ctr_alert（低CTRアラート）

**条件**:
- CTR < 閾値（例: 0.5%）
- インプレッション >= 最低数（例: 5000）

**アクション**: 通知のみ（停止なし）

**用途**: クリエイティブ刷新の判断材料

**設定例**:
```javascript
create_rule({
  template_id: "low_ctr_alert",
  conditions: [
    { value: 0.5 },   // CTR閾値
    { value: 5000 }   // 最低IMP数
  ]
})
```

---

### 5. roas_scaledown（ROAS低下で減額）

**条件**:
- ROAS < 下限（例: 1.5）
- 消費額 >= 最低額（例: 10000円）

**アクション**: 予算減額（デフォルト30%）

**用途**: ROI悪化時の損失抑制

**設定例**:
```javascript
create_rule({
  template_id: "roas_scaledown",
  conditions: [
    { value: 1.5 },    // ROAS下限
    { value: 10000 }   // 最低消費額
  ],
  action: {
    type: "decrease_budget",
    percent: 50  // 50%減額
  }
})
```

## 他モジュールとの連携

### Module 2（キャンペーン作成）との連携

```javascript
// Step 1: Module 2でキャンペーン作成
create_full_campaign({
  campaign_name: "Winter Sale 2026",
  objective: "sales",
  daily_budget: 10000,
  creative_path: "meta-ad-creative-mcp/output/winter_sale/20260223-153045/creative.json",
  link_url: "https://example.com/sale",
  dry_run: false
})
// → campaign_id: "120212345678901234"

// Step 2: Module 3で高CPA停止ルール設定
create_rule({
  template_id: "pause_high_cpa",
  conditions: [
    { value: 3000 },
    { value: 5000 }
  ]
})

// Step 3: 定期的にルール評価（cronで自動化推奨）
evaluate_rules({
  dry_run: false,
  execute: true
})
```

### Module 4（A/Bテスト）との連携

```javascript
// A/Bテストで勝者が確定したら予算増額
const analysis = get_experiment_results({
  experiment_id: "exp_123",
  dry_run: false
})

if (analysis.analysis.status === "clear_winner") {
  const winnerId = analysis.analysis.leader.id;

  // 勝者の予算を50%増額
  update_budget({
    object_id: winnerId,
    object_type: "adset",
    daily_budget: 15000,  // 10000 → 15000
    dry_run: false
  })
}
```

## テスト

```bash
# スモークテスト実行
cd meta-budget-mcp
node test/smoke-test.js
```

期待される出力：
```
=== Meta Budget MCP Smoke Test ===

1. Config:
   Configured: false
   Bid strategies: lowest_cost, cost_cap, bid_cap, roas_goal
   Metrics: spend, impressions, clicks, ctr, cpc, cpm, conversions, cpa, roas, frequency
   ...

=== All tests passed! ===
```

## トラブルシューティング

### エラー: META_ACCESS_TOKEN is required

**原因**: 環境変数が未設定

**解決策**:
```bash
# .env に追加
echo "META_ACCESS_TOKEN=EAAxxxxxxxx" >> ../.env
echo "META_AD_ACCOUNT_ID=act_1234567890" >> ../.env
```

### ルールが作成できない

**原因1**: テンプレート使用時に条件値が未指定

**解決策**:
```javascript
// NG: 値が未指定
create_rule({
  template_id: "pause_high_cpa"
})

// OK: 値を指定
create_rule({
  template_id: "pause_high_cpa",
  conditions: [
    { value: 3000 },
    { value: 5000 }
  ]
})
```

**原因2**: カスタムルールで必須項目不足

**解決策**:
```javascript
// カスタムルールはconditionsとactionが必須
create_rule({
  name: "My Rule",
  conditions: [
    { metric: "cpa", operator: "gt", value: 3000 }
  ],
  action: { type: "pause" }
})
```

### ルールが実行されない

**原因**: `execute: false` または `dry_run: true`

**解決策**:
```javascript
// ルールを実際に実行するには両方falseに設定
evaluate_rules({
  dry_run: false,
  execute: true
})
```

### 予算変更が反映されない

**原因**: dry_run モードが有効

**解決策**:
```javascript
// dry_run: false を明示的に指定
update_budget({
  object_id: "120212345678901235",
  daily_budget: 5000,
  dry_run: false  // 必須
})
```

## API仕様

- **Meta Marketing API**: v25.0
- **エンドポイント**:
  - Campaigns: `act_{ad_account_id}/campaigns`
  - AdSets: `act_{ad_account_id}/adsets`
  - Insights: `act_{ad_account_id}/insights`
- **認証**: OAuth 2.0 Access Token
- **レート制限**: 200 calls / hour / user
- **必須スコープ**: `ads_management`, `ads_read`, `business_management`

## 出力ファイル

すべてのツールは実行結果を `output/` ディレクトリに保存します。

```
meta-budget-mcp/
└── output/
    ├── budget_overview_2026-02-23T15-30-45.json
    ├── rule_evaluation_2026-02-23T16-00-00.json
    └── ...
```

## ライセンス

MIT License

---

**作成日**: 2026-02-23
**バージョン**: 1.0.0
