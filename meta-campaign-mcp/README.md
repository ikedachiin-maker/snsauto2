# Module 2: Meta Campaign MCP Server

Meta Marketing API v25.0 を使用したキャンペーン自動作成モジュール。Advantage+ に完全対応し、2026年の必須要件を満たしています。

## 概要

このモジュールは、Meta（Facebook/Instagram）広告キャンペーンを自動作成します。Campaign、AdSet、Ad の3層構造を一括作成でき、Module 1 で生成したクリエイティブを直接使用できます。

### 主な機能

- 🚀 **Meta Marketing API v25.0 完全対応**
- ⚡ **Advantage+ 必須構造対応**（2026年）
- 📊 **ODAX 6つの目的サポート**: sales, leads, awareness, traffic, engagement, app_promotion
- 🏗️ **3層一括作成**: Campaign → AdSet → Ad を一度に作成
- 🔍 **ステータス管理**: キャンペーンの開始/停止/削除
- 🧪 **dry_run モード**: 本番実行前にAPIリクエストをプレビュー

## インストール

```bash
cd meta-campaign-mcp
npm install
```

## 必須環境変数

```.env
# Meta Marketing API アクセストークン
META_ACCESS_TOKEN=EAAxxxxxxxx

# 広告アカウント ID (act_ プレフィックス付き)
META_AD_ACCOUNT_ID=act_1234567890

# Facebook ページ ID
META_PAGE_ID=1234567890
```

## MCPツール

### 1. setup_check

環境変数とAPIアクセスを確認します。

**パラメータ**: なし

**戻り値**:
```json
{
  "status": "ok",
  "access_token": "設定済み (EAAxxxx...)",
  "ad_account_id": "act_1234567890",
  "page_id": "1234567890",
  "api_version": "v25.0"
}
```

**使用例**:
```javascript
setup_check()
```

---

### 2. create_campaign

キャンペーンのみを作成します（AdSet/Ad なし）。

**パラメータ**:
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| `campaign_name` | string | ✅ | キャンペーン名 |
| `objective` | string | ✅ | 目的（sales, leads, awareness, traffic, engagement, app_promotion） |
| `status` | string | ❌ | ステータス（ACTIVE/PAUSED、デフォルト: PAUSED） |
| `special_ad_categories` | array | ❌ | 特別広告カテゴリ（[]でOK） |
| `dry_run` | boolean | ❌ | テストモード（デフォルト: true） |

**戻り値**:
```json
{
  "campaign_id": "120212345678901234",
  "name": "Winter Sale 2026",
  "objective": "OUTCOME_SALES",
  "status": "PAUSED"
}
```

**使用例**:
```javascript
create_campaign({
  campaign_name: "Spring Campaign 2026",
  objective: "sales",
  status: "PAUSED",
  dry_run: false
})
```

---

### 3. create_full_campaign

Campaign、AdSet、Ad を一括作成します（**推奨**）。

**パラメータ**:
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| `campaign_name` | string | ✅ | キャンペーン名 |
| `objective` | string | ✅ | 目的 |
| `daily_budget` | number | ✅ | 日予算（円、例: 5000 = 5,000円/日） |
| `creative_path` | string | ❌ | Module 1 の creative.json パス |
| `headline` | string | ❌ | 広告見出し（creative_path 省略時は必須） |
| `primary_text` | string | ❌ | 広告本文（creative_path 省略時は必須） |
| `description` | string | ❌ | 広告説明 |
| `image_url` | string | ❌ | 画像URL（creative_path 省略時は必須） |
| `link_url` | string | ✅ | リンク先URL |
| `call_to_action` | string | ❌ | CTA（SHOP_NOW/LEARN_MORE等、デフォルト: LEARN_MORE） |
| `targeting_automation` | boolean | ❌ | Advantage+ ターゲティング（デフォルト: true） |
| `dry_run` | boolean | ❌ | テストモード（デフォルト: true） |

**戻り値**:
```json
{
  "campaign": {
    "id": "120212345678901234",
    "name": "Winter Sale 2026"
  },
  "adset": {
    "id": "120212345678901235",
    "name": "Winter Sale 2026 - AdSet 1"
  },
  "ad": {
    "id": "120212345678901236",
    "name": "Winter Sale 2026 - Ad 1"
  },
  "dry_run": false
}
```

**使用例1**: Module 1 のクリエイティブを使用

```javascript
create_full_campaign({
  campaign_name: "Winter Sale 2026",
  objective: "sales",
  daily_budget: 10000,
  creative_path: "meta-ad-creative-mcp/output/winter_sale/20260223-153045/creative.json",
  link_url: "https://example.com/winter-sale",
  call_to_action: "SHOP_NOW",
  dry_run: false
})
```

**使用例2**: 手動でクリエイティブを指定

```javascript
create_full_campaign({
  campaign_name: "Spring Campaign",
  objective: "leads",
  daily_budget: 5000,
  headline: "無料体験実施中",
  primary_text: "今なら初月無料...",
  description: "お申し込みはこちら",
  image_url: "https://example.com/image.jpg",
  link_url: "https://example.com/signup",
  call_to_action: "SIGN_UP",
  dry_run: false
})
```

---

### 4. get_campaign_status

キャンペーンの現在のステータスを取得します。

**パラメータ**:
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| `campaign_id` | string | ✅ | キャンペーンID |

**戻り値**:
```json
{
  "campaign_id": "120212345678901234",
  "name": "Winter Sale 2026",
  "status": "ACTIVE",
  "objective": "OUTCOME_SALES",
  "daily_budget": 10000,
  "created_time": "2026-02-23T15:30:45+0000"
}
```

**使用例**:
```javascript
get_campaign_status({
  campaign_id: "120212345678901234"
})
```

---

### 5. set_campaign_status

キャンペーンのステータスを変更します（開始/停止/削除）。

**パラメータ**:
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| `campaign_id` | string | ✅ | キャンペーンID |
| `status` | string | ✅ | 新しいステータス（ACTIVE/PAUSED/ARCHIVED） |
| `dry_run` | boolean | ❌ | テストモード（デフォルト: true） |

**戻り値**:
```json
{
  "campaign_id": "120212345678901234",
  "status": "ACTIVE",
  "success": true
}
```

**使用例**:
```javascript
// キャンペーンを開始
set_campaign_status({
  campaign_id: "120212345678901234",
  status: "ACTIVE",
  dry_run: false
})

// キャンペーンを停止
set_campaign_status({
  campaign_id: "120212345678901234",
  status: "PAUSED",
  dry_run: false
})

// キャンペーンを削除（アーカイブ）
set_campaign_status({
  campaign_id: "120212345678901234",
  status: "ARCHIVED",
  dry_run: false
})
```

## ODAX 目的（Objectives）

Meta Marketing API v25.0 では、以下の6つの目的（Outcome-Driven Ad Experiences）をサポートしています。

### 1. sales（販売促進）

**用途**: EC、オンラインショップ、アプリ内購入
**最適化**: 購入コンバージョン
**例**: "ウィンターセール開催中！今すぐ購入"

### 2. leads（リード獲得）

**用途**: 資料請求、無料体験、会員登録
**最適化**: リードフォーム送信
**例**: "無料カウンセリング実施中"

### 3. awareness（認知拡大）

**用途**: ブランド認知、新商品発表
**最適化**: リーチとインプレッション
**例**: "新ブランド誕生！"

### 4. traffic（トラフィック誘導）

**用途**: Webサイト訪問、ブログ記事閲覧
**最適化**: リンククリック
**例**: "詳細はこちら"

### 5. engagement（エンゲージメント）

**用途**: いいね、コメント、シェア獲得
**最適化**: エンゲージメント率
**例**: "あなたの意見を聞かせてください"

### 6. app_promotion（アプリプロモーション）

**用途**: アプリインストール、アプリ内イベント
**最適化**: アプリインストール
**例**: "今すぐダウンロード"

## Advantage+ とは

2026年、Meta Marketing API では **Advantage+ が必須** になりました。

### 主な特徴

- **ターゲティング自動化**: AIが最適なオーディエンスを自動選定
- **配置自動化**: 最もパフォーマンスの高い配置に自動配信
- **クリエイティブ最適化**: 複数バリエーションを自動テスト
- **入札最適化**: 予算内で最大のコンバージョンを獲得

### 設定方法

```javascript
create_full_campaign({
  // ...
  targeting_automation: true,  // Advantage+ 有効化（デフォルト）
  // ...
})
```

`targeting_automation: true` により、以下が自動化されます：
- 年齢・性別・地域の自動最適化
- 興味関心ターゲティングの自動拡張
- Lookalike オーディエンスの自動生成

## dry_run モード

**デフォルトで有効**になっており、本番APIを呼び出さずにリクエスト内容をプレビューできます。

### 使い方

```javascript
// テストモード（デフォルト、APIリクエストなし）
create_campaign({
  campaign_name: "Test Campaign",
  objective: "sales",
  dry_run: true  // または省略（デフォルトがtrue）
})
// → curl コマンドが表示されるのみ

// 本番実行（実際にAPIリクエストを送信）
create_campaign({
  campaign_name: "Real Campaign",
  objective: "sales",
  dry_run: false  // 明示的にfalseを指定
})
// → 実際にキャンペーンが作成される
```

### dry_run の出力例

```json
{
  "dry_run": true,
  "preview": {
    "method": "POST",
    "endpoint": "https://graph.facebook.com/v25.0/act_1234567890/campaigns",
    "body": {
      "name": "Test Campaign",
      "objective": "OUTCOME_SALES",
      "status": "PAUSED",
      "special_ad_categories": []
    }
  },
  "curl": "curl -X POST 'https://graph.facebook.com/v25.0/act_1234567890/campaigns' -d '{...}'"
}
```

## Call to Action (CTA) オプション

| CTA ID | 表示テキスト（日本語） | 用途 |
|--------|----------------------|------|
| `SHOP_NOW` | 今すぐ購入 | ECサイト |
| `LEARN_MORE` | 詳しくはこちら | 情報サイト |
| `SIGN_UP` | 登録する | 会員登録 |
| `BOOK_NOW` | 予約する | 予約サービス |
| `DOWNLOAD` | ダウンロード | アプリ、資料 |
| `GET_QUOTE` | 見積もり依頼 | BtoB |
| `CONTACT_US` | お問い合わせ | サポート |
| `APPLY_NOW` | 今すぐ応募 | 求人 |

## Module 1 との連携

Module 1 で生成した `creative.json` を直接使用できます。

### ワークフロー例

```bash
# Step 1: Module 1 でクリエイティブ生成
generate_ad_creative({
  campaign_id: "winter_sale",
  template_id: "discount",
  product_name: "コート",
  target_audience: "25-45歳女性",
  key_message: "50%オフ",
  ad_format: "feed_square"
})
# → output/winter_sale/20260223-153045/creative.json

# Step 2: Module 2 でキャンペーン作成
create_full_campaign({
  campaign_name: "Winter Sale 2026",
  objective: "sales",
  daily_budget: 10000,
  creative_path: "meta-ad-creative-mcp/output/winter_sale/20260223-153045/creative.json",
  link_url: "https://example.com/sale",
  dry_run: false
})
# → キャンペーン、AdSet、Ad が作成される
```

## Module 3 との連携

作成したキャンペーンIDを使って、Module 3 で予算最適化を設定できます。

```javascript
// Module 2: キャンペーン作成
create_full_campaign({...})
// → campaign_id: "120212345678901234"

// Module 3: 予算最適化ルール設定
create_rule({
  name: "Pause High CPA",
  template: "pause_high_cpa",
  params: {
    campaign_id: "120212345678901234",
    cpa_threshold: 3000
  }
})
```

## テスト

```bash
# スモークテスト実行
cd meta-campaign-mcp
node test/smoke-test.js
```

## トラブルシューティング

### エラー: META_ACCESS_TOKEN is required

```bash
# .env に追加
echo "META_ACCESS_TOKEN=EAAxxxxxxxx" >> ../.env
```

### エラー: Invalid OAuth access token

アクセストークンが無効または期限切れです。
- https://developers.facebook.com/tools/explorer/ で新しいトークンを取得
- または System User Token を使用（期限なし）

### エラー: (#100) Invalid parameter

リクエストパラメータが不正です。`dry_run: true` で curl コマンドを確認してください。

### キャンペーンが作成されない

- `dry_run: false` を明示的に指定しているか確認
- `setup_check` でAPI接続を確認

## API 仕様

- **Meta Marketing API**: v25.0
- **エンドポイント**: `https://graph.facebook.com/v25.0`
- **認証**: OAuth 2.0 Access Token
- **レート制限**: 200 calls / hour / user
- **必須スコープ**: `ads_management`, `ads_read`, `business_management`

## ライセンス

MIT License

---

**作成日**: 2026-02-23
**バージョン**: 1.0.0
