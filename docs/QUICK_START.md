# クイックスタートガイド - 3分で使い始める

## 📋 必要なもの

1. **Meta Business Manager アカウント**
2. **Claude API キー** (Anthropic)
3. **Gemini API キー** (Google)

---

## 🚀 3ステップで開始

### ステップ1: APIキーを取得（10分）

#### 1-1. Meta Marketing API アクセストークン

**開発・テスト用（短期トークン）:**
1. https://developers.facebook.com/tools/explorer/ にアクセス
2. **Meta App** を選択（なければ作成）
3. **Permissions** タブで以下を選択：
   - `ads_management`
   - `ads_read`
   - `business_management`
4. **Generate Access Token** をクリック
5. トークンをコピー（`EAAxxxx...` の形式）

#### 1-2. Meta 広告アカウントID

1. https://business.facebook.com にアクセス
2. **ビジネス設定** > **アカウント** > **広告アカウント** を開く
3. 広告アカウント名をクリック
4. **広告アカウントID** をコピー（`act_1234567890` の形式）

#### 1-3. Meta ページID

1. Facebook ページを開く
2. URLから数字を取得（例: `facebook.com/your-page-1234567890` → `1234567890`）

#### 1-4. Meta Pixel ID

1. https://business.facebook.com > **データソース** > **Pixel** を開く
2. Pixel を選択
3. **Pixel ID** をコピー

#### 1-5. Claude API キー

1. https://console.anthropic.com にアクセス
2. **API Keys** > **Create Key** をクリック
3. キー名を入力（例: `Meta Ads Automation`）
4. **API Key** をコピー（`sk-ant-xxx` の形式）
5. ⚠️ **一度しか表示されない**ので安全に保管

#### 1-6. Gemini API キー

1. https://ai.google.dev にアクセス
2. **Get API Key** をクリック
3. Google アカウントでログイン
4. **Create API Key** をクリック
5. **API Key** をコピー（`AIzaSyXXX` の形式）

---

### ステップ2: 環境変数を設定（3分）

プロジェクトルートの `.env` ファイルを編集：

```bash
# Meta Marketing API
META_ACCESS_TOKEN=EAAxxxxxxxx  # ← ステップ1-1で取得
META_AD_ACCOUNT_ID=act_1234567890  # ← ステップ1-2で取得
META_PAGE_ID=1234567890  # ← ステップ1-3で取得
META_PIXEL_ID=1234567890  # ← ステップ1-4で取得
META_TEST_EVENT_CODE=  # ← オプション（空でOK）

# AI APIs
ANTHROPIC_API_KEY=sk-ant-xxxxxxxx  # ← ステップ1-5で取得
GEMINI_API_KEY=AIzaSyXXXXXX  # ← ステップ1-6で取得

# オプション設定
DRY_RUN=true  # テストモード（本番実行前は必ずtrue）
TZ=Asia/Tokyo
```

**重要:** Gemini API キーは別ファイルにも保存：

```bash
# Windows
echo AIzaSyXXXXXX > google-flow-mcp\apikey.txt

# Mac/Linux
echo "AIzaSyXXXXXX" > google-flow-mcp/apikey.txt
```

---

### ステップ3: MCP サーバーを Claude Code に登録（2分）

#### 3-1. MCP 設定ファイルを生成

プロジェクトルートの `mcp-config.json` が自動生成されているので、内容を確認：

```bash
cat mcp-config.json
```

#### 3-2. Claude Code 設定に追加

`~/.claude/settings.json` を開いて、`mcp-config.json` の内容をマージ：

**Windows:**
```
C:\Users\<username>\.claude\settings.json
```

**Mac/Linux:**
```
~/.claude/settings.json
```

**設定例:**
```json
{
  "mcpServers": {
    "meta-ad-creative": {
      "command": "node",
      "args": ["C:/Users/ysfm0664/OneDrive/Desktop/snsauto/meta-ad-creative-mcp/index.js"],
      "env": {
        "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}",
        "GEMINI_API_KEY": "${GEMINI_API_KEY}"
      }
    },
    "meta-campaign": {
      "command": "node",
      "args": ["C:/Users/ysfm0664/OneDrive/Desktop/snsauto/meta-campaign-mcp/index.js"],
      "env": {
        "META_ACCESS_TOKEN": "${META_ACCESS_TOKEN}",
        "META_AD_ACCOUNT_ID": "${META_AD_ACCOUNT_ID}",
        "META_PAGE_ID": "${META_PAGE_ID}"
      }
    },
    "meta-budget": {
      "command": "node",
      "args": ["C:/Users/ysfm0664/OneDrive/Desktop/snsauto/meta-budget-mcp/index.js"],
      "env": {
        "META_ACCESS_TOKEN": "${META_ACCESS_TOKEN}",
        "META_AD_ACCOUNT_ID": "${META_AD_ACCOUNT_ID}"
      }
    },
    "meta-experiment": {
      "command": "node",
      "args": ["C:/Users/ysfm0664/OneDrive/Desktop/snsauto/meta-experiment-mcp/index.js"],
      "env": {
        "META_ACCESS_TOKEN": "${META_ACCESS_TOKEN}",
        "META_AD_ACCOUNT_ID": "${META_AD_ACCOUNT_ID}"
      }
    },
    "meta-tracking": {
      "command": "node",
      "args": ["C:/Users/ysfm0664/OneDrive/Desktop/snsauto/meta-tracking-mcp/index.js"],
      "env": {
        "META_ACCESS_TOKEN": "${META_ACCESS_TOKEN}",
        "META_PIXEL_ID": "${META_PIXEL_ID}",
        "META_TEST_EVENT_CODE": "${META_TEST_EVENT_CODE}"
      }
    },
    "meta-report": {
      "command": "node",
      "args": ["C:/Users/ysfm0664/OneDrive/Desktop/snsauto/meta-report-mcp/index.js"],
      "env": {
        "META_ACCESS_TOKEN": "${META_ACCESS_TOKEN}",
        "META_AD_ACCOUNT_ID": "${META_AD_ACCOUNT_ID}"
      }
    }
  }
}
```

⚠️ **パスを修正**: `args` の配列内のパスを、あなたの実際のプロジェクトパスに変更してください。

#### 3-3. Claude Code を再起動

Claude Code を再起動すると、30個のMCPツールが利用可能になります。

---

## ✅ 動作確認

### テスト1: 環境変数の確認

```bash
node -e "require('dotenv').config(); console.log('META_ACCESS_TOKEN:', process.env.META_ACCESS_TOKEN ? '設定済み' : '未設定'); console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? '設定済み' : '未設定');"
```

### テスト2: 統合テスト実行

```bash
node integration-test.js
```

期待される結果：
```
✓ 成功: 6
✗ 失敗: 0
```

### テスト3: Claude Code でツールを使う

Claude Code で以下のコマンドを試してください：

```
list_templates を実行してください
```

利用可能なテンプレート一覧が表示されれば成功です！

---

## 🎯 実際に使ってみる（例）

### 例1: 広告クリエイティブ生成

```
generate_ad_creative を実行してください。

パラメータ:
- campaign_id: "winter_sale_2026"
- template_id: "discount"
- product_name: "ウィンターコート"
- target_audience: "25-45歳女性、ファッション関心層"
- key_message: "最大50%オフ、送料無料"
- ad_format: "feed_square"
```

→ 画像とコピーが自動生成され、`output/winter_sale_2026/{timestamp}/creative.json` に保存されます。

### 例2: キャンペーン作成（dry_runモード）

```
create_full_campaign を実行してください。

パラメータ:
- campaign_name: "Winter Sale Test"
- objective: "sales"
- daily_budget: 5000
- headline: "【期間限定】最大50%オフ"
- primary_text: "冬の必須アイテム、今だけ特別価格"
- description: "送料無料・即日発送"
- image_url: "https://example.com/image.jpg"
- link_url: "https://example.com"
- dry_run: true
```

→ dry_run モードなので、実際のキャンペーンは作成されず、APIリクエストのプレビューが表示されます。

### 例3: パフォーマンスレポート生成

```
get_performance_report を実行してください。

パラメータ:
- date_preset: "last_7d"
- level: "campaign"
- format: "markdown"
- dry_run: true
```

→ 過去7日間のキャンペーンパフォーマンスレポートがMarkdown形式で生成されます。

---

## 📚 次のステップ

1. **各モジュールのREADMEを読む**: 詳細なツール仕様を確認
   - `meta-ad-creative-mcp/README.md`
   - `meta-campaign-mcp/README.md`
   - など

2. **dry_run モードで練習**: 本番実行前に必ず `dry_run: true` でテスト

3. **ワークフローを試す**:
   ```
   Module 1 → Module 2 → Module 3 → Module 4 → Module 5 → Module 6
   ```

4. **本番環境に移行**: `DRY_RUN=false` に変更して実際の広告配信

---

## ⚠️ 注意事項

- **dry_runモード**: 必ず最初は `dry_run: true` でテストしてください
- **アクセストークン**: 短期トークンは60日で期限切れ。本番環境では System User Token を推奨
- **予算設定**: 意図しない課金を防ぐため、小額（日1,000円）からテスト
- **APIレート制限**: Meta API は 200 calls/hour の制限があります

---

## 🆘 トラブルシューティング

問題が発生した場合は、`SETUP_GUIDE.md` のトラブルシューティングセクションを参照してください。

---

**準備完了！Claude Code で Meta 広告自動化ツールを使い始めましょう！** 🚀
