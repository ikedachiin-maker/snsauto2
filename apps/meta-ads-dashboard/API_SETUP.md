# 🔌 API接続セットアップガイド

このガイドでは、デモモードから実際のAPI接続に切り替える手順を説明します。

---

## 📋 目次

1. [環境変数の設定](#1-環境変数の設定)
2. [Meta APIの準備](#2-meta-apiの準備)
3. [AI APIの準備](#3-ai-apiの準備)
4. [ローカルテスト](#4-ローカルテスト)
5. [本番デプロイ](#5-本番デプロイ)
6. [トラブルシューティング](#6-トラブルシューティング)

---

## 1. 環境変数の設定

### 1.1 ローカル開発用

```bash
# .env.exampleをコピー
cp .env.example .env.local

# エディタで.env.localを開いて編集
code .env.local  # VSCode
# または
notepad .env.local  # メモ帳
```

### 1.2 必須環境変数

```bash
# デモモードを無効化
DEMO_MODE=false

# Meta API（後述の手順で取得）
META_ACCESS_TOKEN=your_token_here
META_AD_ACCOUNT_ID=act_1234567890
META_PAGE_ID=1234567890
META_PIXEL_ID=1234567890

# AI API（後述の手順で取得）
ANTHROPIC_API_KEY=sk-ant-api03-...
GEMINI_API_KEY=your_gemini_key
```

---

## 2. Meta APIの準備

### 2.1 Meta開発者アカウント作成

1. https://developers.facebook.com/ にアクセス
2. 「マイアプリ」→「アプリを作成」
3. アプリタイプ: **「ビジネス」** を選択
4. アプリ名を入力（例: 「広告自動化ダッシュボード」）

### 2.2 アクセストークンの取得

#### 方法A: Graph APIエクスプローラー（テスト用）

1. https://developers.facebook.com/tools/explorer にアクセス
2. アプリを選択
3. 「アクセス許可を取得」をクリック
4. 以下の権限を選択:
   ```
   ads_management
   ads_read
   business_management
   pages_read_engagement
   pages_manage_ads
   ```
5. 「アクセストークンを生成」をクリック
6. トークンをコピー

⚠️ **注意**: このトークンは60日で期限切れになります。

#### 方法B: System User Token（本番推奨）

1. **Business Manager**にアクセス
   - https://business.facebook.com/settings/system-users

2. **System Userを作成**
   - 「追加」ボタンをクリック
   - ユーザー名を入力（例: 「automation_user」）
   - ロール: **管理者** を選択

3. **アクセストークンを生成**
   - 作成したSystem Userをクリック
   - 「トークンを生成」
   - アプリを選択
   - 権限を選択（上記と同じ）
   - 「トークンを生成」

4. **トークンを保存**
   - ⚠️ このトークンは**二度と表示されません**
   - 安全な場所に保存してください

✅ **利点**: System User Tokenは**無期限**で使用できます。

### 2.3 広告アカウントIDの取得

1. **Meta Business Suite**にアクセス
   - https://business.facebook.com/

2. **広告マネージャ**を開く
   - 左メニュー「広告マネージャ」

3. **アカウントIDをコピー**
   - URLを確認: `https://business.facebook.com/adsmanager/manage/accounts?act=1234567890`
   - `act=` の後の数字が広告アカウントID
   - `.env.local` には `act_1234567890` の形式で記入

### 2.4 FacebookページIDの取得

1. Facebookページを開く
2. 「設定」→「ページ情報」
3. 「ページID」をコピー

### 2.5 Meta Pixel IDの取得

1. **イベントマネージャ**を開く
   - https://business.facebook.com/events_manager

2. **データソース**を選択
   - 左メニューから該当のPixelをクリック

3. **Pixel IDをコピー**
   - 「設定」タブ
   - 「Pixel ID」をコピー

---

## 3. AI APIの準備

### 3.1 Anthropic Claude API

1. https://console.anthropic.com/ にアクセス
2. アカウント作成（Googleアカウントでサインアップ可能）
3. 「API Keys」セクションを開く
4. 「Create Key」をクリック
5. キーをコピー（`sk-ant-api03-...`の形式）

**料金:**
- 従量課金制
- Claude 3.5 Sonnet: $3 / 1M input tokens
- 詳細: https://www.anthropic.com/pricing

### 3.2 Google Gemini API

1. https://makersuite.google.com/app/apikey にアクセス
2. Googleアカウントでログイン
3. 「Create API Key」をクリック
4. キーをコピー

**料金:**
- 無料枠: 60リクエスト/分
- 詳細: https://ai.google.dev/pricing

---

## 4. ローカルテスト

### 4.1 環境変数の確認

```bash
# .env.localが正しく設定されているか確認
cat .env.local  # Mac/Linux
type .env.local  # Windows
```

### 4.2 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000/tools にアクセス

### 4.3 段階的テスト

#### ステップ1: 環境変数チェック

1. 「Module 2: キャンペーン作成」
2. 「✅ 環境変数チェック」を実行
3. すべて✅になることを確認

❌ エラーが出た場合:
- `.env.local`のスペルミスを確認
- トークンが正しくコピーされているか確認

#### ステップ2: 読み取り系API

1. 「📊 ステータス取得」を実行
   - 既存のキャンペーンIDを入力
   - または、デモIDで試す

2. 「Module 3: 予算最適化」
   - 「💰 予算概要」を実行

✅ 正常に動作すれば、API接続成功！

#### ステップ3: 書き込み系API（dry_run）

1. 「🚀 キャンペーン作成」
   - `dry_run: true` のまま実行
   - curlプレビューが表示されることを確認

2. 実際のAPIは呼ばれていないので安全

#### ステップ4: 本番実行（慎重に）

⚠️ **警告**: 実際にMeta広告が作成されます。

1. **テストキャンペーンを少額で作成**
   ```
   キャンペーン名: テスト_削除予定
   目的: sales
   日予算: 100円
   dry_run: false ← 重要！
   ```

2. 実行後、Meta広告マネージャで確認
   - キャンペーンが作成されているか
   - ステータスは「PAUSED」（一時停止）

3. ✅ 成功したら、テストキャンペーンを削除

---

## 5. 本番デプロイ

### 5.1 Vercel環境変数の設定

1. https://vercel.com にログイン
2. プロジェクト「meta-ads-dashboard」を選択
3. **Settings** → **Environment Variables**

4. 以下を追加:

```
Variable Name         | Value
----------------------|---------------------------
DEMO_MODE             | false
META_ACCESS_TOKEN     | [System User Token]
META_AD_ACCOUNT_ID    | act_1234567890
META_PAGE_ID          | 1234567890
META_PIXEL_ID         | 1234567890
ANTHROPIC_API_KEY     | sk-ant-api03-...
GEMINI_API_KEY        | [your_key]
```

5. **Environment**: 「Production」を選択

### 5.2 再デプロイ

```bash
cd meta-ads-dashboard
vercel --prod
```

または、Vercelダッシュボードから:
- 「Deployments」→「Redeploy」

### 5.3 本番環境でテスト

1. https://meta-ads-dashboard-one.vercel.app/tools にアクセス
2. 環境変数チェックを実行
3. 読み取り系APIをテスト
4. 動作確認完了！

---

## 6. トラブルシューティング

### エラー: "Access token is invalid"

**原因**: トークンの期限切れ or スペルミス

**解決策**:
1. トークンを再生成
2. `.env.local`のスペルを確認
3. 余分なスペースや改行がないか確認

### エラー: "Permission denied"

**原因**: 必要な権限がない

**解決策**:
1. Graph APIエクスプローラーで権限を再確認
2. 以下の権限を追加:
   - `ads_management`
   - `ads_read`
   - `business_management`

### エラー: "Campaign budget is required"

**原因**: パラメータが不足

**解決策**:
1. 日予算を設定（最低100円）
2. すべての必須フィールドを入力

### エラー: "MCP server not found"

**原因**: MCPサーバーのパスが間違っている

**解決策**:
1. プロジェクト構造を確認:
   ```
   snsauto/
   ├── meta-ads-dashboard/  ← Webダッシュボード
   ├── meta-campaign-mcp/   ← MCPサーバー
   ├── meta-budget-mcp/
   └── ...
   ```

2. `.env.local`で`MCP_SERVER_PATH`を設定（通常は不要）

### デバッグモード

開発環境でエラーの詳細を確認:

```typescript
// app/api/campaign/route.ts
console.log('[DEBUG] Params:', params);
console.log('[DEBUG] MCP Result:', mcpResult);
```

ブラウザの開発者ツール（F12）→「Console」でログを確認

---

## 🔒 セキュリティベストプラクティス

### ✅ 必ず守ること

1. **トークンをGitにコミットしない**
   - `.env.local`は`.gitignore`に含まれている
   - `.env.example`のみコミット

2. **System User Tokenを使う（本番）**
   - 無期限で使用可能
   - より安全

3. **最小権限の原則**
   - 必要な権限のみを付与
   - 不要な権限は削除

4. **定期的なトークンローテーション**
   - 3-6ヶ月ごとにトークン再生成を推奨

5. **環境ごとにトークンを分ける**
   - 開発環境: テスト用アカウント
   - 本番環境: 本番用アカウント

### ❌ やってはいけないこと

1. トークンをコード内にハードコーディング
2. トークンをチャットやメールで送信
3. 同じトークンを複数のプロジェクトで使用
4. ブラウザ側（クライアント）でトークンを使用

---

## 📚 参考リンク

### Meta広告API
- 公式ドキュメント: https://developers.facebook.com/docs/marketing-apis
- API Explorer: https://developers.facebook.com/tools/explorer
- エラーコード一覧: https://developers.facebook.com/docs/graph-api/using-graph-api/error-handling

### AI API
- Anthropic Claude: https://docs.anthropic.com/claude/docs
- Google Gemini: https://ai.google.dev/docs

### MCP
- 既存実装: `meta-campaign-mcp/`, `meta-budget-mcp/`, etc.

---

## ✅ セットアップ完了チェックリスト

- [ ] Meta開発者アカウント作成
- [ ] アクセストークン取得（System User推奨）
- [ ] 広告アカウントID取得
- [ ] FacebookページID取得
- [ ] Meta Pixel ID取得
- [ ] Anthropic API Key取得
- [ ] Gemini API Key取得
- [ ] `.env.local`ファイル作成
- [ ] 全環境変数を設定
- [ ] ローカルで環境変数チェック実行
- [ ] ローカルで読み取りAPIテスト
- [ ] ローカルで書き込みAPI（dry_run）テスト
- [ ] （オプション）ローカルで本番実行テスト
- [ ] Vercel環境変数設定
- [ ] 本番デプロイ
- [ ] 本番環境で動作確認

**すべて✅になったら完了です！🎉**

---

**最終更新**: 2026-02-24
