# Module 5: Meta Tracking MCP Server

Meta Pixel + Conversions API (CAPI) トラッキングモジュール。イベント送信、重複排除、コード生成、診断機能を提供します。

## 概要

このモジュールは、Meta Pixel とサーバーサイド Conversions API の完全実装を支援します。14の標準イベント送信、PII自動ハッシュ、Pixel↔CAPI重複排除、コード自動生成、イベント品質診断が可能です。

### 主な機能

- 📡 **Conversions API送信**: 14標準イベント + カスタムイベント対応
- 🔐 **PII自動ハッシュ**: メール/電話番号をSHA-256で自動ハッシュ
- 🔄 **重複排除**: event_id統一でPixel↔CAPI重複を自動排除
- 🧬 **コード生成**: Pixelベースコード、イベントスニペット、CAPIハンドラ、GTMタグ
- 📊 **イベント品質**: マッチ品質スコア（A-Dグレード）、診断データ取得
- 🧪 **テストモード**: META_TEST_EVENT_CODE でEvents Managerに表示
- 🧪 **dry_run モード**: API実行前にプレビュー（デフォルト有効）

## インストール

```bash
cd meta-tracking-mcp
npm install
```

## 必須環境変数

```.env
# Meta Marketing API アクセストークン
META_ACCESS_TOKEN=EAAxxxxxxxx

# Meta Pixel ID
META_PIXEL_ID=1234567890

# テストイベントコード（オプション、Events Managerのテストイベントタブで取得）
META_TEST_EVENT_CODE=TEST12345
```

**注意**: 環境変数が未設定でも全ツールは dry_run モードで動作し、デモデータと API プレビューを表示します。

## MCPツール

### 1. setup_check

環境変数とPixel設定を確認します。

**パラメータ**: なし

**戻り値**:
```json
{
  "environment": {
    "META_ACCESS_TOKEN": "Set (EAAxxxx...)",
    "META_PIXEL_ID": "1234567890",
    "META_TEST_EVENT_CODE": "TEST12345"
  },
  "configured": true,
  "standard_events": [
    {
      "event_name": "Purchase",
      "label": "購入",
      "required_params": ["value", "currency"]
    }
  ],
  "user_data_fields": [
    { "key": "em", "label": "メールアドレス", "needs_hash": true },
    { "key": "ph", "label": "電話番号", "needs_hash": true }
  ],
  "action_sources": ["website", "app", "phone_call", "chat", "email", "physical_store", "system_generated", "other"],
  "pixel_info": {
    "id": "1234567890",
    "name": "My Pixel",
    "can_proxy": true,
    "is_unavailable": false
  }
}
```

**使用例**:
```javascript
setup_check()
```

---

### 2. send_event

単一の変換イベントをConversions API経由で送信します。

**パラメータ**:
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| `event_name` | string | ✅ | イベント名（Purchase, Lead, ViewContent等の標準イベント、またはカスタムイベント名） |
| `user_data` | object | ❌ | ユーザーデータ（PII自動SHA-256ハッシュ） |
| `custom_data` | object | ❌ | カスタムデータ（購入額、商品ID等） |
| `event_source_url` | string | ❌ | イベント発生URL |
| `action_source` | string | ❌ | アクションソース（website/app/phone_call等、デフォルト: website） |
| `event_id` | string | ❌ | イベントID（Pixelとの重複排除用。省略時は自動生成） |
| `test_mode` | boolean | ❌ | true=テストモード（Events Managerのテストイベントに表示） |
| `dry_run` | boolean | ❌ | true=プレビューモード（デフォルト: true） |

**user_data フィールド**:
| フィールド | 説明 | 自動ハッシュ |
|-----------|------|-------------|
| `em` | メールアドレス | ✅ |
| `ph` | 電話番号 | ✅ |
| `fn` | 名 | ✅ |
| `ln` | 姓 | ✅ |
| `external_id` | 外部ユーザーID | ✅ |
| `client_ip_address` | IPアドレス | ❌ |
| `client_user_agent` | ユーザーエージェント | ❌ |
| `fbc` | Facebookクリックパラメータ（_fbc cookie） | ❌ |
| `fbp` | Facebookブラウザパラメータ（_fbp cookie） | ❌ |
| `country` | 国コード（jp, us等） | ✅ |
| `ct` | 市区町村 | ✅ |
| `st` | 都道府県 | ✅ |
| `zp` | 郵便番号 | ✅ |
| `ge` | 性別（m/f） | ✅ |
| `db` | 生年月日（YYYYMMDD） | ✅ |

**custom_data フィールド**:
| フィールド | 説明 |
|-----------|------|
| `value` | 金額 |
| `currency` | 通貨コード（JPY, USD） |
| `content_ids` | 商品ID配列 |
| `content_type` | product または product_group |
| `content_name` | コンテンツ名 |
| `content_category` | カテゴリ |
| `num_items` | アイテム数 |
| `order_id` | 注文ID |
| `search_string` | 検索キーワード |
| `predicted_ltv` | 予測LTV |

**戻り値**:
```json
{
  "success": true,
  "mode": "live",
  "event": {
    "event_name": "Purchase",
    "event_id": "evt_20260223_150030_abc123",
    "is_standard": true,
    "label": "購入"
  },
  "quality": {
    "score": 8.5,
    "grade": "Good",
    "match_keys": 6,
    "issues": [],
    "warnings": [
      "client_user_agentが未設定。ブラウザ情報があるとマッチ精度が向上します。"
    ]
  },
  "result": {
    "events_received": 1,
    "messages": [],
    "fbtrace_id": "ABC123XYZ"
  },
  "dedup_note": "Pixelからも同じevent_id \"evt_20260223_150030_abc123\" で送信すると自動重複排除されます。"
}
```

**使用例**:
```javascript
// 購入イベント送信
send_event({
  event_name: "Purchase",
  user_data: {
    em: "customer@example.com",
    ph: "+81901234567",
    client_ip_address: "192.168.1.1",
    client_user_agent: "Mozilla/5.0...",
    fbc: "fb.1.1234567890.AbCdEfGhIj",
    fbp: "_fbp=fb.1.1234567890.987654321"
  },
  custom_data: {
    value: 3980,
    currency: "JPY",
    content_ids: ["prod_001"],
    content_type: "product",
    order_id: "ORD-2026-001"
  },
  event_source_url: "https://example.com/thanks",
  action_source: "website",
  test_mode: false,
  dry_run: false
})

// リードイベント送信
send_event({
  event_name: "Lead",
  user_data: {
    em: "lead@example.com",
    fn: "太郎",
    ln: "山田",
    client_ip_address: "1.2.3.4"
  },
  custom_data: {
    content_name: "無料体験申込"
  },
  event_source_url: "https://example.com/form-complete",
  dry_run: false
})

// カスタムイベント送信
send_event({
  event_name: "CustomEventName",
  user_data: {
    external_id: "user_12345"
  },
  custom_data: {
    custom_param_1: "value_1"
  },
  dry_run: false
})
```

---

### 3. send_batch_events

複数のイベントを一括送信します（最大1000件）。

**パラメータ**:
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| `events` | array | ✅ | イベント配列（最大1000件） |
| `test_mode` | boolean | ❌ | true=テストモード |
| `dry_run` | boolean | ❌ | true=プレビューモード（デフォルト: true） |

**イベントオブジェクト**:
```javascript
{
  event_name: "Purchase",
  event_time: 1708675200,  // UNIXタイムスタンプ（秒）、省略時は現在時刻
  event_id: "evt_custom_123",  // 省略時は自動生成
  event_source_url: "https://example.com/thanks",
  action_source: "website",
  user_data: {
    em: "customer@example.com",
    client_ip_address: "1.2.3.4"
  },
  custom_data: {
    value: 3980,
    currency: "JPY"
  }
}
```

**戻り値**:
```json
{
  "success": true,
  "mode": "live",
  "batch_size": 150,
  "event_summary": [
    { "event_name": "Purchase", "count": 80 },
    { "event_name": "Lead", "count": 50 },
    { "event_name": "ViewContent", "count": 20 }
  ],
  "quality_sample": [
    {
      "event_name": "Purchase",
      "event_id": "evt_001",
      "quality": { "score": 8.5, "grade": "Good" }
    }
  ],
  "result": {
    "events_received": 150,
    "messages": []
  }
}
```

**使用例**:
```javascript
// 過去の購入データを一括バックフィル
send_batch_events({
  events: [
    {
      event_name: "Purchase",
      event_time: 1708588800,  // 2026-02-22 00:00:00
      user_data: { em: "user1@example.com" },
      custom_data: { value: 5000, currency: "JPY" }
    },
    {
      event_name: "Purchase",
      event_time: 1708675200,  // 2026-02-23 00:00:00
      user_data: { em: "user2@example.com" },
      custom_data: { value: 3000, currency: "JPY" }
    }
  ],
  test_mode: false,
  dry_run: false
})
```

---

### 4. get_pixel_code

Meta Pixel設置コードやCAPIハンドラコードを生成します。完全オフライン動作（API不要）。

**パラメータ**:
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| `pixel_id` | string | ❌ | Pixel ID（省略時は環境変数から取得） |
| `include` | array | ❌ | 生成するコード種別（デフォルト: ["base_code", "event_snippets", "dedup_snippets"]） |
| `events` | array | ❌ | トラッキングするイベント名（デフォルト: ["Purchase", "Lead", "ViewContent", "AddToCart"]） |

**include オプション**:
- `base_code`: HTMLの<head>に設置するPixelベースコード
- `event_snippets`: 各イベントのトラッキングスニペット
- `dedup_snippets`: Pixel + CAPI重複排除の完全実装例
- `capi_handler`: サーバーサイドCAPIハンドラ（Node.js/Express例）
- `gtm_tag`: GTMカスタムHTMLタグ

**戻り値**:
```json
{
  "pixel_id": "1234567890",
  "code_snippets": {
    "base_code": {
      "description": "HTMLの<head>タグ内に設置するベースコード",
      "code": "<script>\n!function(f,b,e,v,n,t,s)\n{...}\nfbq('init', '1234567890');\nfbq('track', 'PageView');\n</script>"
    },
    "event_snippets": [
      {
        "event_name": "Purchase",
        "label": "購入",
        "code": "fbq('track', 'Purchase', {value: 3980, currency: 'JPY'});",
        "with_dedup": "fbq('track', 'Purchase', {value: 3980, currency: 'JPY'}, {eventID: 'evt_20260223_150030_abc123'});"
      }
    ],
    "dedup_snippets": {
      "description": "Pixel + CAPI 重複排除の完全実装例",
      "events": [
        {
          "event_name": "Purchase",
          "code": "const eventId = 'evt_' + Date.now() + '_' + Math.random();\nfbq('track', 'Purchase', {value: 3980, currency: 'JPY'}, {eventID: eventId});\nfetch('/api/capi-event', {\n  method: 'POST',\n  body: JSON.stringify({event_name: 'Purchase', event_id: eventId, ...})\n});"
        }
      ]
    }
  },
  "implementation_guide": {
    "step_1": "base_codeを全ページの<head>に設置",
    "step_2": "購入・リード等のイベントポイントにevent_snippetsを設置",
    "step_3": "dedup_snippetsでPixel+CAPI両方から同一event_idで送信",
    "step_4": "capi_handlerをサーバーにデプロイ（Node.js/Cloud Functions/Lambda）",
    "step_5": "Events Managerでイベント受信を確認",
    "important": "event_idの一致が重複排除の鍵。Pixel側とCAPI側で同じIDを使用すること。"
  }
}
```

**使用例**:
```javascript
// 基本的なPixelコード取得
get_pixel_code({
  pixel_id: "1234567890",
  include: ["base_code", "event_snippets"],
  events: ["Purchase", "Lead"]
})

// 重複排除完全実装
get_pixel_code({
  include: ["base_code", "event_snippets", "dedup_snippets", "capi_handler"]
})

// GTMタグ生成
get_pixel_code({
  include: ["gtm_tag"]
})
```

---

### 5. get_event_diagnostics

Events Managerからイベント診断データを取得します。マッチ品質、重複排除状況、よくある問題を確認できます。

**パラメータ**:
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| `dry_run` | boolean | ❌ | true=プレビューモード（デフォルト: true） |

**戻り値**:
```json
{
  "success": true,
  "mode": "live",
  "pixel": {
    "id": "1234567890",
    "name": "My Pixel",
    "last_fired_time": "2026-02-23T14:30:00+0000"
  },
  "diagnostics": {
    "events_overview": [
      {
        "event_name": "Purchase",
        "browser_count": 150,
        "server_count": 180,
        "dedup_count": 185,
        "match_rate": "81%"
      },
      {
        "event_name": "Lead",
        "browser_count": 320,
        "server_count": 350,
        "dedup_count": 360,
        "match_rate": "76%"
      }
    ],
    "quality_indicators": {
      "event_match_quality": 7.2,
      "grade": "Good",
      "deduplication_active": true,
      "pixel_firing": true,
      "capi_active": true
    },
    "common_issues": [
      {
        "severity": "warning",
        "message": "一部イベントでevent_idが未設定。重複排除が機能していません。",
        "fix": "Pixel送信時にeventIDオプション、CAPI送信時にevent_idパラメータを設定してください。"
      }
    ]
  }
}
```

**使用例**:
```javascript
// 診断データ取得
get_event_diagnostics({
  dry_run: false
})
```

## 標準イベント一覧

| イベント名 | 日本語 | 用途 | 必須パラメータ |
|-----------|-------|------|--------------|
| `Purchase` | 購入 | 購入完了 | value, currency |
| `Lead` | リード | フォーム送信、問い合わせ | - |
| `CompleteRegistration` | 登録完了 | 会員登録、アカウント作成 | - |
| `AddToCart` | カート追加 | 商品をカートに追加 | - |
| `AddToWishlist` | ウィッシュリスト追加 | お気に入り登録 | - |
| `InitiateCheckout` | チェックアウト開始 | 決済フロー開始 | - |
| `AddPaymentInfo` | 支払情報追加 | クレカ情報入力 | - |
| `ViewContent` | コンテンツ表示 | 商品詳細ページ閲覧 | - |
| `Search` | 検索 | サイト内検索 | search_string |
| `Contact` | 問い合わせ | チャット、電話 | - |
| `CustomizeProduct` | カスタマイズ | 商品カスタマイズ | - |
| `Donate` | 寄付 | 寄付完了 | value, currency |
| `FindLocation` | 店舗検索 | 店舗検索 | - |
| `Schedule` | 予約 | 予約完了 | - |

**カスタムイベント**: 上記以外の任意のイベント名も送信可能です。

## イベント品質スコア

### スコア計算

以下の項目を評価し、10点満点で採点：

| 項目 | 配点 | 説明 |
|------|------|------|
| メールアドレス | 2.0 | em が設定されている |
| 電話番号 | 1.5 | ph が設定されている |
| 外部ID | 1.5 | external_id が設定されている |
| IPアドレス | 1.5 | client_ip_address が設定されている |
| ユーザーエージェント | 1.5 | client_user_agent が設定されている |
| Facebook Cookie（fbc） | 1.0 | fbc が設定されている |
| Facebook Cookie（fbp） | 1.0 | fbp が設定されている |
| 氏名 | 0.5 | fn, ln が設定されている |

### グレード評価

| スコア | グレード | 説明 |
|--------|---------|------|
| 8.0-10.0 | A (Excellent) | 非常に高品質。ほとんどのユーザーがマッチ可能 |
| 6.0-7.9 | B (Good) | 良好。改善の余地あり |
| 4.0-5.9 | C (Fair) | 普通。複数のフィールド追加を推奨 |
| 0-3.9 | D (Poor) | 低品質。マッチ率が著しく低下 |

## 重複排除（Deduplication）の仕組み

### 問題

PixelとCAPIの両方からイベントを送信すると、同じイベントが2回カウントされる可能性があります。

### 解決策

**event_id（イベントID）** を使用して重複を自動排除します。

### 実装方法

#### 1. クライアント側（Pixel）

```javascript
// イベントIDを生成
const eventId = 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

// Pixel送信時にeventIDオプションを追加
fbq('track', 'Purchase', {
  value: 3980,
  currency: 'JPY'
}, {
  eventID: eventId  // ← 重要
});

// サーバーにイベントIDを送信
fetch('/api/capi-event', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    event_name: 'Purchase',
    event_id: eventId,  // ← 同じIDを使用
    user_data: {
      em: userEmail,
      client_ip_address: clientIp
    },
    custom_data: {
      value: 3980,
      currency: 'JPY'
    }
  })
});
```

#### 2. サーバー側（CAPI）

```javascript
// Node.js/Express例
app.post('/api/capi-event', async (req, res) => {
  const { event_name, event_id, user_data, custom_data } = req.body;

  // CAPIに送信（event_idを含む）
  await send_event({
    event_name,
    event_id,  // ← クライアントと同じIDを使用
    user_data,
    custom_data,
    action_source: 'website',
    dry_run: false
  });

  res.json({ success: true });
});
```

#### 3. Meta側の自動処理

Metaは同じ `event_id` を持つイベントを **自動的に1つにまとめます**。

- Pixel（ブラウザ）: 150件
- CAPI（サーバー）: 180件
- **重複排除後**: 185件（150 + 180 - 145重複 = 185）

## 他モジュールとの連携

### Module 2（キャンペーン作成）との連携

```javascript
// Step 1: Module 2でキャンペーン作成
create_full_campaign({
  campaign_name: "Winter Sale 2026",
  objective: "sales",
  daily_budget: 10000,
  creative_path: "...",
  link_url: "https://example.com/sale",
  dry_run: false
})

// Step 2: Module 5でPixelコード生成
get_pixel_code({
  include: ["base_code", "event_snippets", "dedup_snippets", "capi_handler"],
  events: ["Purchase", "AddToCart", "ViewContent"]
})

// Step 3: 生成されたコードをサイトに実装

// Step 4: 購入完了時にイベント送信（サーバー側）
send_event({
  event_name: "Purchase",
  user_data: {
    em: "customer@example.com",
    client_ip_address: req.ip,
    client_user_agent: req.headers['user-agent'],
    fbc: req.cookies._fbc,
    fbp: req.cookies._fbp
  },
  custom_data: {
    value: 3980,
    currency: "JPY",
    order_id: "ORD-001"
  },
  event_source_url: "https://example.com/thanks",
  dry_run: false
})
```

### Module 6（レポート）との連携

```javascript
// トラッキング実装後、コンバージョンデータを確認
get_performance_report({
  level: "campaign",
  date_preset: "last_7d",
  metric_preset: "conversions",
  dry_run: false
})
// → Purchaseイベントが正しくトラッキングされているか確認
```

## テスト

```bash
# スモークテスト実行
cd meta-tracking-mcp
node test/smoke-test.js
```

期待される出力：
```
=== Meta Tracking MCP Smoke Test ===

1. Config:
   Configured: false
   Standard events: 14
   ...

=== All tests passed! ===
```

## トラブルシューティング

### イベントがEvents Managerに表示されない

**原因1**: dry_run モードが有効

**解決策**:
```javascript
send_event({
  event_name: "Purchase",
  ...,
  dry_run: false  // 必須
})
```

**原因2**: META_PIXEL_ID が間違っている

**解決策**: Events Manager > Data Sources でPixel IDを確認

**原因3**: アクセストークンのスコープ不足

**解決策**: ads_management スコープを追加

### 重複排除が機能しない

**原因**: event_id がPixelとCAPIで異なる

**解決策**:
```javascript
// クライアント側
const eventId = 'evt_unique_123';
fbq('track', 'Purchase', {...}, {eventID: eventId});

// サーバー側
send_event({
  event_name: "Purchase",
  event_id: eventId,  // 同じIDを使用
  ...
})
```

### イベント品質スコアが低い（D評価）

**原因**: user_data のフィールド数が少ない

**解決策**: 最低限以下を設定
- `em`（メールアドレス）
- `client_ip_address`
- `client_user_agent`
- `fbc` と `fbp`（Cookieから取得）

```javascript
send_event({
  event_name: "Purchase",
  user_data: {
    em: "user@example.com",
    client_ip_address: "1.2.3.4",
    client_user_agent: "Mozilla/5.0...",
    fbc: "fb.1.1234567890.AbCdEf",
    fbp: "_fbp=fb.1.1234567890.987654"
  },
  ...
})
```

### エラー: (#100) Invalid parameter

**原因**: custom_data の形式が不正

**解決策**:
- `value` は数値型（文字列不可）
- `content_ids` は配列型

```javascript
// NG
custom_data: {
  value: "3980",  // 文字列はNG
  content_ids: "prod_001"  // 文字列はNG
}

// OK
custom_data: {
  value: 3980,  // 数値
  content_ids: ["prod_001"]  // 配列
}
```

## API仕様

- **Meta Conversions API**: v25.0
- **エンドポイント**: `https://graph.facebook.com/v25.0/{pixel_id}/events`
- **認証**: OAuth 2.0 Access Token
- **レート制限**:
  - 通常: 100,000 events / hour / pixel
  - バッチ: 1,000 events / request
- **必須スコープ**: `ads_management`

## 出力ファイル

すべてのツールは実行結果を `output/` ディレクトリに保存します。

```
meta-tracking-mcp/
└── output/
    ├── batch_events_2026-02-23T15-30-45.json
    ├── diagnostics_2026-02-23T16-00-00.json
    └── ...
```

## ライセンス

MIT License

---

**作成日**: 2026-02-23
**バージョン**: 1.0.0
