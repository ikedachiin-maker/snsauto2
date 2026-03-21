# Meta広告自動化プロジェクト - セットアップガイド

このガイドでは、Meta広告自動化プロジェクトの完全なセットアップ手順を説明します。

## 📋 目次

1. [前提条件](#前提条件)
2. [Meta Business Manager のセットアップ](#meta-business-manager-のセットアップ)
3. [API アクセストークンの取得](#api-アクセストークンの取得)
4. [AI API キーの取得](#ai-api-キーの取得)
5. [環境変数の設定](#環境変数の設定)
6. [モジュールのインストール](#モジュールのインストール)
7. [動作確認](#動作確認)
8. [本番環境への移行](#本番環境への移行)

## 前提条件

### 必須アカウント

- ✅ **Meta Business Manager アカウント**
  - Facebook ビジネスマネージャ: https://business.facebook.com
  - 広告アカウントの管理者権限が必要

- ✅ **Anthropic アカウント** (Claude API)
  - https://console.anthropic.com
  - クレジットカード登録必須（従量課金）

- ✅ **Google Cloud アカウント** (Gemini API)
  - https://ai.google.dev
  - API キーは無料で取得可能

### システム要件

```bash
# Node.js バージョン確認
node --version  # v18.0.0 以上

# npm バージョン確認
npm --version   # v9.0.0 以上
```

バージョンが古い場合は、[Node.js 公式サイト](https://nodejs.org/) から最新版をインストールしてください。

## Meta Business Manager のセットアップ

### ステップ1: ビジネスマネージャの作成

1. https://business.facebook.com にアクセス
2. 「アカウントを作成」をクリック
3. ビジネス情報を入力：
   - ビジネス名
   - 主要な Facebook ページ
   - 氏名とメールアドレス

### ステップ2: 広告アカウントの作成

1. ビジネスマネージャ > **ビジネス設定** に移動
2. **アカウント** > **広告アカウント** を選択
3. **追加** > **新しい広告アカウントを作成**
4. 以下を入力：
   - 広告アカウント名
   - タイムゾーン（例: `Asia/Tokyo`）
   - 通貨（例: `JPY`）
5. **広告アカウント ID** をメモ（`act_1234567890` の形式）

### ステップ3: Facebook Pixel の作成

1. ビジネスマネージャ > **データソース** > **Pixel** に移動
2. **Pixel を作成** をクリック
3. Pixel 名を入力（例: `My Website Pixel`）
4. **Pixel ID** をメモ（`1234567890` の形式）

### ステップ4: Facebook ページの確認

1. ビジネスマネージャ > **アカウント** > **ページ** に移動
2. 既存ページを追加、または新規作成
3. **ページ ID** をメモ：
   - ページを開く
   - URL の末尾の数字が Page ID（例: `facebook.com/your-page-1234567890`）

## API アクセストークンの取得

### 方法1: 短期トークン（開発・テスト用）

⚠️ **注意**: 短期トークンは60日で期限切れになります。本番環境では System User Token を推奨します。

1. https://developers.facebook.com/tools/explorer/ にアクセス
2. **Meta App** を選択（なければ作成）
3. **User Token** ドロップダウンをクリック
4. **Permissions** タブで以下を選択：
   - `ads_management`
   - `ads_read`
   - `business_management`
   - `pages_read_engagement`
   - `pages_manage_ads`
5. **Generate Access Token** をクリック
6. トークンをコピー（`EAAxxxx...` の形式）

### 方法2: System User Token（本番環境推奨）

🎯 **推奨**: System User Token は期限がなく、自動化に最適です。

#### ステップ1: System User の作成

1. ビジネスマネージャ > **ビジネス設定** に移動
2. **ユーザー** > **System Users** を選択
3. **追加** をクリック
4. System User 名を入力（例: `Ad Automation Bot`）
5. **Admin** 権限を選択

#### ステップ2: アクセス許可の設定

1. 作成した System User を選択
2. **アセットを割り当て** をクリック
3. **広告アカウント** タブで対象アカウントを選択
4. **全広告アカウントを管理** 権限を付与
5. **ページ** タブで対象ページを選択
6. 必要な権限を付与
7. **Pixel** タブで Pixel を選択

#### ステップ3: トークンの生成

1. System User の **トークンを生成** をクリック
2. **App** を選択（なければ作成）
3. **Permissions** で以下を選択：
   - `ads_management`
   - `ads_read`
   - `business_management`
4. **トークンを生成** をクリック
5. トークンをコピーして **安全に保管**

### トークンのテスト

```bash
# トークンが有効か確認
curl -X GET "https://graph.facebook.com/v25.0/me?access_token=YOUR_TOKEN"

# 期限を確認
curl -X GET "https://graph.facebook.com/v25.0/debug_token?input_token=YOUR_TOKEN&access_token=YOUR_TOKEN"
```

## AI API キーの取得

### Claude API (Anthropic)

#### ステップ1: アカウント作成

1. https://console.anthropic.com にアクセス
2. **Sign Up** でアカウント作成
3. メール認証を完了

#### ステップ2: API キー取得

1. ダッシュボードにログイン
2. **API Keys** セクションに移動
3. **Create Key** をクリック
4. キー名を入力（例: `Meta Ad Automation`）
5. **Create Key** をクリック
6. **API Key** をコピー（`sk-ant-xxx` の形式）
7. ⚠️ **重要**: キーは一度しか表示されないので安全に保管

#### ステップ3: 課金設定

1. **Billing** セクションに移動
2. クレジットカードを登録
3. 使用制限を設定（推奨: 月$100程度）

**料金目安**:
- Claude 3.5 Sonnet: $3 / 1M input tokens, $15 / 1M output tokens
- 広告コピー生成 1回あたり約 $0.01-0.05

### Gemini API (Google)

#### ステップ1: API キー取得

1. https://ai.google.dev にアクセス
2. **Get API Key** をクリック
3. Google アカウントでログイン
4. **Create API Key** をクリック
5. プロジェクトを選択（なければ新規作成）
6. **API Key** をコピー（`AIzaSyXXX` の形式）

#### ステップ2: API 有効化

1. https://console.cloud.google.com にアクセス
2. プロジェクトを選択
3. **APIs & Services** > **Library** に移動
4. **Generative Language API** を検索
5. **Enable** をクリック

**料金目安**:
- Gemini Pro: 無料枠あり（月60リクエスト/分）
- 画像生成 1回あたり $0（無料枠内）

## 環境変数の設定

### ステップ1: .env ファイルの作成

プロジェクトルートに `.env` ファイルを作成します：

```bash
cd /path/to/snsauto
touch .env  # Linux/Mac
type nul > .env  # Windows
```

### ステップ2: 環境変数を記述

`.env` ファイルに以下を記述（値は実際の値に置き換え）：

```bash
# ===========================================
# Meta Marketing API
# ===========================================

# アクセストークン（System User Token 推奨）
META_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 広告アカウント ID（act_ プレフィックス付き）
META_AD_ACCOUNT_ID=act_1234567890

# Facebook ページ ID
META_PAGE_ID=1234567890

# Facebook Pixel ID
META_PIXEL_ID=1234567890

# テストイベントコード（Pixel > Test Events で確認）
META_TEST_EVENT_CODE=TEST12345

# ===========================================
# AI APIs
# ===========================================

# Claude API キー（広告コピー生成用）
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxx

# Gemini API キー（画像生成用）
# Note: google-flow-mcp/apikey.txt にも保存
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXX

# ===========================================
# オプション設定
# ===========================================

# dry_run モード（true: テストモード、false: 本番実行）
DRY_RUN=true

# デバッグログ（開発時のみ有効化）
# DEBUG=*

# タイムゾーン
TZ=Asia/Tokyo
```

### ステップ3: Gemini API キーの追加保存

Gemini API キーは別途 `google-flow-mcp/apikey.txt` にも保存が必要です：

```bash
# Linux/Mac
echo "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXX" > google-flow-mcp/apikey.txt

# Windows
echo AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXX > google-flow-mcp\apikey.txt
```

### ステップ4: .env ファイルの保護

⚠️ **セキュリティ重要**: `.env` ファイルは Git にコミットしないでください。

```bash
# .gitignore に追加（すでに含まれているか確認）
echo ".env" >> .gitignore
echo "google-flow-mcp/apikey.txt" >> .gitignore
```

## モジュールのインストール

### 方法1: 一括インストール（推奨）

```bash
# プロジェクトルートで実行
cd /path/to/snsauto

# 全モジュールの依存関係を一括インストール
for dir in meta-*-mcp; do
  echo "Installing $dir..."
  cd "$dir" && npm install && cd ..
done
```

Windows の場合：

```batch
cd C:\path\to\snsauto

for /D %d in (meta-*-mcp) do (
  cd %d
  npm install
  cd ..
)
```

### 方法2: 個別インストール

```bash
# Module 1
cd meta-ad-creative-mcp
npm install

# Module 2
cd ../meta-campaign-mcp
npm install

# Module 3
cd ../meta-budget-mcp
npm install

# Module 4
cd ../meta-experiment-mcp
npm install

# Module 5
cd ../meta-tracking-mcp
npm install

# Module 6
cd ../meta-report-mcp
npm install
```

### MCP サーバーの登録

Claude Code で使用するには、`~/.claude/settings.json` に登録します：

```json
{
  "mcpServers": {
    "meta-ad-creative": {
      "command": "node",
      "args": ["/absolute/path/to/snsauto/meta-ad-creative-mcp/index.js"],
      "env": {
        "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}",
        "GEMINI_API_KEY": "${GEMINI_API_KEY}"
      }
    },
    "meta-campaign": {
      "command": "node",
      "args": ["/absolute/path/to/snsauto/meta-campaign-mcp/index.js"],
      "env": {
        "META_ACCESS_TOKEN": "${META_ACCESS_TOKEN}",
        "META_AD_ACCOUNT_ID": "${META_AD_ACCOUNT_ID}",
        "META_PAGE_ID": "${META_PAGE_ID}"
      }
    },
    "meta-budget": {
      "command": "node",
      "args": ["/absolute/path/to/snsauto/meta-budget-mcp/index.js"],
      "env": {
        "META_ACCESS_TOKEN": "${META_ACCESS_TOKEN}",
        "META_AD_ACCOUNT_ID": "${META_AD_ACCOUNT_ID}"
      }
    },
    "meta-experiment": {
      "command": "node",
      "args": ["/absolute/path/to/snsauto/meta-experiment-mcp/index.js"],
      "env": {
        "META_ACCESS_TOKEN": "${META_ACCESS_TOKEN}",
        "META_AD_ACCOUNT_ID": "${META_AD_ACCOUNT_ID}"
      }
    },
    "meta-tracking": {
      "command": "node",
      "args": ["/absolute/path/to/snsauto/meta-tracking-mcp/index.js"],
      "env": {
        "META_ACCESS_TOKEN": "${META_ACCESS_TOKEN}",
        "META_PIXEL_ID": "${META_PIXEL_ID}",
        "META_TEST_EVENT_CODE": "${META_TEST_EVENT_CODE}"
      }
    },
    "meta-report": {
      "command": "node",
      "args": ["/absolute/path/to/snsauto/meta-report-mcp/index.js"],
      "env": {
        "META_ACCESS_TOKEN": "${META_ACCESS_TOKEN}",
        "META_AD_ACCOUNT_ID": "${META_AD_ACCOUNT_ID}"
      }
    }
  }
}
```

⚠️ **注意**: `/absolute/path/to/snsauto` は実際の絶対パスに置き換えてください。

Windows の場合：
```json
"args": ["C:\\Users\\username\\Desktop\\snsauto\\meta-ad-creative-mcp\\index.js"]
```

## 動作確認

### ステップ1: 統合テストの実行

```bash
cd /path/to/snsauto
node integration-test.js
```

期待される出力：

```
========================================
  Meta広告自動化プロジェクト
  統合テスト
========================================

テスト対象: 6モジュール

✓ 成功: 5
✗ 失敗: 0
⚠ スキップ: 1

統合テスト完了!
```

### ステップ2: 個別モジュールのテスト

各モジュールのスモークテストを実行：

```bash
# Module 2
cd meta-campaign-mcp
node test/smoke-test.js

# Module 3
cd ../meta-budget-mcp
node test/smoke-test.js

# Module 4
cd ../meta-experiment-mcp
node test/smoke-test.js

# Module 5
cd ../meta-tracking-mcp
node test/smoke-test.js

# Module 6
cd ../meta-report-mcp
node test/smoke-test.js
```

すべて `✓ All tests passed!` と表示されればOKです。

### ステップ3: Claude Code での動作確認

1. Claude Code を起動
2. MCP ツールが表示されることを確認：
   ```
   Available tools:
   - list_templates
   - generate_ad_copy
   - generate_ad_image
   ...
   ```
3. テスト実行：
   ```
   list_templates を実行してください
   ```

## 本番環境への移行

### チェックリスト

開発環境でテストが完了したら、以下を確認して本番環境に移行します：

- [ ] **System User Token** を取得済み（短期トークンは使用しない）
- [ ] **本番用広告アカウント** を作成済み
- [ ] **Pixel** が正しく設定され、テストイベントが受信できる
- [ ] **支払い方法** が登録済み（Meta 広告アカウント）
- [ ] **予算上限** を設定済み（意図しない課金を防止）
- [ ] **`.env` ファイル** のバックアップを取得

### dry_run モードの解除

⚠️ **重要**: 本番実行前に必ず確認してください。

#### 方法1: 環境変数で無効化

`.env` ファイルを編集：

```bash
# テストモード（dry_run 有効）
DRY_RUN=true

# ↓ 本番モード（dry_run 無効）
DRY_RUN=false
```

#### 方法2: ツール呼び出し時に指定

```javascript
// dry_run を明示的に無効化
create_campaign({
  campaign_name: "Real Campaign",
  objective: "sales",
  daily_budget: 5000,
  dry_run: false  // ← 明示的に指定
})
```

### 段階的な移行

1. **小額テストキャンペーン**: 日予算 1,000円で1週間
2. **結果検証**: CPA, ROAS を確認
3. **予算拡大**: 段階的に予算を増やす（1,000 → 3,000 → 5,000円）
4. **自動化有効化**: ルールベース最適化を有効化
5. **完全自動化**: A/Bテスト + 自動スケーリング

## トラブルシューティング

### エラー: `META_ACCESS_TOKEN is required`

**原因**: 環境変数が読み込まれていない

**解決策**:
```bash
# .env ファイルの存在確認
ls -la .env

# 環境変数の読み込み確認
node -e "require('dotenv').config(); console.log(process.env.META_ACCESS_TOKEN)"
```

### エラー: `Invalid OAuth access token`

**原因**: トークンが無効または期限切れ

**解決策**:
1. トークンの有効性を確認：
   ```bash
   curl "https://graph.facebook.com/v25.0/me?access_token=YOUR_TOKEN"
   ```
2. 期限切れの場合は新しいトークンを取得

### エラー: `Gemini API key not found`

**原因**: `google-flow-mcp/apikey.txt` が存在しない

**解決策**:
```bash
echo "YOUR_GEMINI_API_KEY" > google-flow-mcp/apikey.txt
```

### エラー: `Permission denied`

**原因**: System User に必要な権限がない

**解決策**:
1. ビジネスマネージャで System User の権限を確認
2. 広告アカウント、ページ、Pixel に対して管理者権限を付与

## サポート

問題が解決しない場合は、以下をお試しください：

1. **GitHub Issues**: プロジェクトの Issue ページで質問
2. **Email**: ikedachiin@gmail.com
3. **デバッグログ**: `DEBUG=* node module-name/index.js` でログ確認

---

**セットアップガイド作成日**: 2026-02-23
**最終更新**: 2026-02-23
