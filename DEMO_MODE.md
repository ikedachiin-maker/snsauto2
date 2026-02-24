# デモモード - APIキーなしで今すぐ試す

このガイドでは、APIキーを取得せずに、Meta広告自動化ツールの動作を確認できます。

## 🎯 デモモードとは

**dry_run モード**を使用して、実際のAPIを呼び出さずにツールの動作をシミュレートします。

### できること

- ✅ 全30ツールのパラメータと動作を確認
- ✅ 出力形式のプレビュー
- ✅ ワークフローの理解
- ✅ コマンド生成（curlコマンドなど）

### できないこと

- ❌ 実際の画像生成（Gemini API）
- ❌ 実際のコピー生成（Claude API）
- ❌ 実際のキャンペーン作成（Meta API）
- ❌ 実際のデータ取得（Insights API）

---

## 🚀 デモモードで試す（3分）

### ステップ1: ダミー環境変数を設定

`.env` ファイルをダミー値で設定：

```bash
# Meta Marketing API（ダミー値）
META_ACCESS_TOKEN=DEMO_TOKEN_FOR_TESTING
META_AD_ACCOUNT_ID=act_0000000000
META_PAGE_ID=0000000000
META_PIXEL_ID=0000000000
META_TEST_EVENT_CODE=TEST00000

# AI APIs（ダミー値）
ANTHROPIC_API_KEY=sk-ant-demo-key
GEMINI_API_KEY=AIzaSy-demo-key

# dry_runモードを有効化（重要！）
DRY_RUN=true
```

### ステップ2: MCP サーバーを登録

`mcp-config.json` の内容を `~/.claude/settings.json` にコピー（前と同じ）

### ステップ3: Claude Code を再起動

### ステップ4: デモツールを実行

---

## 📋 デモシナリオ

### デモ1: テンプレート一覧の確認

```
list_templates を実行してください
```

**期待される出力:**
```json
{
  "templates": [
    {
      "id": "discount",
      "name": "割引・キャンペーン訴求",
      "description": "具体的な割引率や限定性を強調",
      "best_for": "セール、期間限定オファー"
    },
    ...
  ]
}
```

---

### デモ2: 広告コピー生成（dry_run）

```
generate_ad_copy を実行してください

パラメータ:
- template_id: "discount"
- product_name: "テストコート"
- target_audience: "25-45歳女性"
- key_message: "50%オフ"
- ad_format: "feed_square"
```

**期待される出力（dry_runモード）:**
```json
{
  "dry_run": true,
  "preview": {
    "template": "discount",
    "product": "テストコート",
    "format": "feed_square"
  },
  "message": "dry_runモードが有効です。実際のAPI呼び出しは行われません。",
  "next_steps": "ANTHROPIC_API_KEYを設定して dry_run: false で実行してください"
}
```

---

### デモ3: キャンペーン作成プレビュー（dry_run）

```
create_campaign を実行してください

パラメータ:
- campaign_name: "Demo Campaign"
- objective: "sales"
- status: "PAUSED"
- dry_run: true
```

**期待される出力:**
```json
{
  "dry_run": true,
  "preview": {
    "method": "POST",
    "endpoint": "https://graph.facebook.com/v25.0/act_0000000000/campaigns",
    "body": {
      "name": "Demo Campaign",
      "objective": "OUTCOME_SALES",
      "status": "PAUSED",
      "special_ad_categories": []
    }
  },
  "curl": "curl -X POST 'https://graph.facebook.com/v25.0/act_0000000000/campaigns' \\\n  -H 'Content-Type: application/json' \\\n  -d '{...}'"
}
```

→ **curlコマンドが生成される**ので、後で実際のAPIキーを設定すれば実行可能！

---

### デモ4: 予算ルール作成（dry_run）

```
create_rule を実行してください

パラメータ:
- name: "Demo High CPA Pause Rule"
- template: "pause_high_cpa"
- params: {
    "cpa_threshold": 3000,
    "evaluation_period_days": 3
  }
- dry_run: true
```

**期待される出力:**
```json
{
  "dry_run": true,
  "rule": {
    "id": "rule_demo_001",
    "name": "Demo High CPA Pause Rule",
    "template": "pause_high_cpa",
    "conditions": {
      "metric": "cost_per_action",
      "operator": "greater_than",
      "threshold": 3000,
      "time_range": "last_3_days"
    },
    "actions": [
      "pause_adset"
    ]
  },
  "saved_to": "meta-budget-mcp/rules/rule_demo_001.json"
}
```

---

### デモ5: A/Bテスト作成（dry_run）

```
create_experiment を実行してください

パラメータ:
- name: "Demo Creative Test"
- test_variable: "creative"
- control_ad_id: "demo_ad_001"
- variant_ad_ids: ["demo_ad_002"]
- test_objective: "ctr"
- confidence_level: 90
- dry_run: true
```

**期待される出力:**
```json
{
  "dry_run": true,
  "experiment": {
    "id": "exp_demo_001",
    "name": "Demo Creative Test",
    "test_variable": "creative",
    "variants": {
      "control": "demo_ad_001",
      "treatment": ["demo_ad_002"]
    },
    "objective": "ctr",
    "confidence_level": 90,
    "status": "draft"
  },
  "preview": {
    "endpoint": "https://graph.facebook.com/v25.0/act_0000000000/experiments",
    "method": "POST"
  }
}
```

---

### デモ6: トラッキングイベント送信（dry_run）

```
send_event を実行してください

パラメータ:
- event_name: "Purchase"
- user_data: {
    "em": "test@example.com",
    "ph": "09012345678"
  }
- custom_data: {
    "value": 15800,
    "currency": "JPY"
  }
- dry_run: true
```

**期待される出力:**
```json
{
  "dry_run": true,
  "event": {
    "event_name": "Purchase",
    "event_time": 1708678245,
    "event_id": "evt_demo_001",
    "user_data": {
      "em": "559aead08264d5795d3909718cdd05abd49572e84fe55590eef31a88a08fdffd",
      "ph": "254d7a8b0c8c9d6e0f5b3a7d9c1e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6"
    },
    "custom_data": {
      "value": 15800,
      "currency": "JPY"
    }
  },
  "preview": {
    "endpoint": "https://graph.facebook.com/v25.0/0000000000/events",
    "method": "POST",
    "note": "user_dataはSHA-256でハッシュ化されています"
  }
}
```

---

### デモ7: パフォーマンスレポート（dry_run）

```
get_performance_report を実行してください

パラメータ:
- date_preset: "last_7d"
- level: "campaign"
- metrics_preset: "overview"
- format: "markdown"
- dry_run: true
```

**期待される出力:**
```markdown
# パフォーマンスレポート

**期間**: last_7d (過去7日間)
**レベル**: campaign
**生成日時**: 2026-02-23 18:45:00

## サマリー（デモデータ）

| キャンペーン | インプレッション | クリック | CTR | CPC | 費用 | コンバージョン | CPA |
|------------|----------------|---------|-----|-----|------|--------------|-----|
| Demo Campaign 1 | 125,430 | 3,256 | 2.60% | ¥45 | ¥146,520 | 89 | ¥1,646 |
| Demo Campaign 2 | 98,765 | 2,104 | 2.13% | ¥52 | ¥109,408 | 67 | ¥1,633 |

## 推奨アクション

1. ⚠️ Campaign 2: CTRが2.13%と低め → クリエイティブの見直しを推奨
2. ✅ Campaign 1: CPAが目標範囲内 → 予算増額を検討
3. 💡 両キャンペーン: フリクエンシーが3.2と適切 → 現状維持
```

---

## 🎓 デモモードで学べること

### 1. パラメータの理解

すべてのツールのパラメータ構造を確認できます：
- 必須パラメータ
- オプションパラメータ
- デフォルト値
- 有効な値の範囲

### 2. 出力形式の確認

各ツールの出力形式を確認できます：
- JSON構造
- エラーハンドリング
- ステータスコード

### 3. ワークフローの設計

6つのモジュールを連携させるワークフローを設計できます：
```
Module 1 → creative.json
    ↓
Module 2 → campaign_id
    ↓
Module 3 → budget rules
    ↓
Module 4 → A/B test
    ↓
Module 5 → tracking events
    ↓
Module 6 → performance report
```

### 4. APIリクエストの理解

dry_runモードで生成されるcurlコマンドを見て、Meta APIの構造を学べます。

---

## 🚀 次のステップ

デモモードで動作を確認したら：

### オプション1: Gemini APIだけ追加（無料）

画像生成機能を実際に試す：
1. https://ai.google.dev でAPIキー取得（5分）
2. `.env` の `GEMINI_API_KEY` を更新
3. `generate_ad_image` を `dry_run: false` で実行

### オプション2: Claude APIも追加

コピー生成機能も試す：
1. https://console.anthropic.com でAPIキー取得（10分）
2. `.env` の `ANTHROPIC_API_KEY` を更新
3. `generate_ad_creative` を `dry_run: false` で実行

### オプション3: Meta APIでフル機能

実際の広告配信を試す：
1. Meta Business Manager でトークン取得（20分）
2. `.env` の `META_*` を更新
3. すべてのツールを `dry_run: false` で実行

---

## ⚠️ 注意事項

- **dry_runモード**: すべてのツールは `dry_run: true` がデフォルト
- **本番実行**: `dry_run: false` を明示的に指定する必要あり
- **APIレート制限**: 実際のAPI実行時は注意
- **課金**: Claude APIとMeta APIは従量課金

---

**デモモードで、APIキーなしでツールを体験してください！** 🎉
