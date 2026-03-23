# Meta広告自動化プロジェクト

Meta（Facebook/Instagram）広告の自動化を実現する6つのMCPサーバー群です。クリエイティブ生成からキャンペーン作成、予算最適化、A/Bテスト、トラッキング、レポート生成まで、広告運用の全プロセスを自動化します。

## 📋 目次

- [概要](#概要)
- [モジュール構成](#モジュール構成)
- [システム要件](#システム要件)
- [セットアップ](#セットアップ)
- [使い方](#使い方)
- [ワークフロー例](#ワークフロー例)
- [トラブルシューティング](#トラブルシューティング)
- [ライセンス](#ライセンス)

## 概要

このプロジェクトは、Meta Marketing API（v25.0）を活用した広告自動化ツールセットです。2026年のAdvantage+必須化に対応し、最新のODAX（Outcome-Driven Ad Experiences）構造をサポートしています。

### 主な特徴

- **🎨 AI駆動のクリエイティブ生成**: Gemini API（画像）+ Claude API（コピー）
- **🚀 Advantage+ 完全対応**: 2026年必須のターゲティング自動化
- **💰 予算最適化エンジン**: CBO管理 + ルールベース自動化
- **🧪 統計的A/Bテスト**: 有意差判定 + 自動スケーリング
- **📊 Pixel + CAPI 統合**: 重複排除 + イベント品質診断
- **📈 レポート自動生成**: Insights API + Markdown/CSV出力

## モジュール構成

| # | モジュール名 | 説明 | 主要機能 |
|---|-------------|------|---------|
| **1** | [meta-ad-creative-mcp](./meta-ad-creative-mcp/) | クリエイティブ自動生成 | 画像生成（Gemini）、コピー生成（Claude）、バリエーション作成 |
| **2** | [meta-campaign-mcp](./meta-campaign-mcp/) | キャンペーン自動作成 | Campaign/AdSet/Ad 一括作成、Advantage+ 対応 |
| **3** | [meta-budget-mcp](./meta-budget-mcp/) | 予算最適化 | CBO管理、自動ルール、入札戦略最適化 |
| **4** | [meta-experiment-mcp](./meta-experiment-mcp/) | A/Bテスト自動化 | Experiments API、統計的有意差判定、勝者スケーリング |
| **5** | [meta-tracking-mcp](./meta-tracking-mcp/) | トラッキング | Pixel + Conversions API、重複排除、診断 |
| **6** | [meta-report-mcp](./meta-report-mcp/) | レポート自動生成 | Insights API、パフォーマンス分析、自動推奨 |

## システム要件

- **Node.js**: v18.0.0 以上
- **npm**: v9.0.0 以上
- **Meta Business Manager アカウント**
- **Claude API アクセス** (Anthropic)
- **Gemini API アクセス** (Google)

## セットアップ

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd snsauto
```

### 2. 環境変数の設定

プロジェクトルートに `.env` ファイルを作成します。詳細は [SETUP_GUIDE.md](./SETUP_GUIDE.md) を参照してください。

```bash
# Meta Marketing API
META_ACCESS_TOKEN=your_meta_access_token
META_AD_ACCOUNT_ID=act_1234567890
META_PAGE_ID=1234567890
META_PIXEL_ID=1234567890
META_TEST_EVENT_CODE=TEST12345

# AI APIs
ANTHROPIC_API_KEY=sk-ant-xxx
GEMINI_API_KEY=AIzaSyXXX

# Optional
DRY_RUN=true  # テストモード（本番API呼び出しなし）
```

### 3. 各モジュールの依存関係をインストール

```bash
# 一括インストール
npm run install-all

# または個別にインストール
cd meta-ad-creative-mcp && npm install
cd ../meta-campaign-mcp && npm install
cd ../meta-budget-mcp && npm install
cd ../meta-experiment-mcp && npm install
cd ../meta-tracking-mcp && npm install
cd ../meta-report-mcp && npm install
```

### 4. MCP サーバーの登録

`~/.claude/settings.json` に各モジュールを登録します：

```json
{
  "mcpServers": {
    "meta-ad-creative": {
      "command": "node",
      "args": ["C:/path/to/snsauto/meta-ad-creative-mcp/index.js"]
    },
    "meta-campaign": {
      "command": "node",
      "args": ["C:/path/to/snsauto/meta-campaign-mcp/index.js"]
    },
    "meta-budget": {
      "command": "node",
      "args": ["C:/path/to/snsauto/meta-budget-mcp/index.js"]
    },
    "meta-experiment": {
      "command": "node",
      "args": ["C:/path/to/snsauto/meta-experiment-mcp/index.js"]
    },
    "meta-tracking": {
      "command": "node",
      "args": ["C:/path/to/snsauto/meta-tracking-mcp/index.js"]
    },
    "meta-report": {
      "command": "node",
      "args": ["C:/path/to/snsauto/meta-report-mcp/index.js"]
    }
  }
}
```

### 5. 統合テストの実行

```bash
node integration-test.js
```

期待される出力：
```
✓ 成功: 5
✗ 失敗: 0
⚠ スキップ: 1
```

## 使い方

### Claude Code から使用

各モジュールは Claude Code の MCP ツールとして利用可能です：

```
# Module 1: クリエイティブ生成
- list_templates
- generate_ad_copy
- generate_ad_image
- generate_ad_creative
- generate_ad_variations

# Module 2: キャンペーン作成
- setup_check
- create_campaign
- create_full_campaign
- get_campaign_status
- set_campaign_status

# Module 3: 予算最適化
- get_budget_overview
- update_budget
- create_rule
- list_rules
- evaluate_rules

# Module 4: A/Bテスト
- create_experiment
- list_experiments
- get_experiment_results
- end_experiment
- analyze_winner

# Module 5: トラッキング
- setup_check
- send_event
- send_batch_events
- get_pixel_code
- get_event_diagnostics

# Module 6: レポート生成
- get_performance_report
- get_creative_report
- get_audience_report
- get_trend_report
- export_report
```

### スタンドアロンで使用

各モジュールは独立して実行可能です：

```bash
# 例: クリエイティブ生成
cd meta-ad-creative-mcp
node index.js

# 例: スモークテスト実行
cd meta-campaign-mcp
node test/smoke-test.js
```

## ワークフロー例

### シナリオ: 新商品キャンペーンの立ち上げ

```mermaid
graph LR
    A[Module 1<br/>クリエイティブ生成] --> B[Module 2<br/>キャンペーン作成]
    B --> C[Module 3<br/>予算設定]
    C --> D[Module 4<br/>A/Bテスト開始]
    D --> E[Module 5<br/>トラッキング設定]
    E --> F[Module 6<br/>パフォーマンス分析]
    F --> C
```

#### ステップ1: クリエイティブ生成

```javascript
// Module 1: 商品画像とコピーを生成
generate_ad_creative({
  campaign_id: "winter_sale_2026",
  product_name: "ウィンターコート",
  target_audience: "25-45歳女性、ファッション関心層",
  key_message: "最大50%オフ、送料無料",
  ad_formats: ["feed_square", "story"]
})
// Output: meta-ad-creative-mcp/output/winter_sale_2026/{timestamp}/creative.json
```

#### ステップ2: キャンペーン作成

```javascript
// Module 2: Advantage+ キャンペーン作成
create_full_campaign({
  campaign_name: "Winter Sale 2026",
  objective: "sales",
  daily_budget: 10000,  // 10,000円/日
  creative_path: "meta-ad-creative-mcp/output/winter_sale_2026/.../creative.json",
  dry_run: false  // 本番実行
})
```

#### ステップ3: 予算最適化ルール設定

```javascript
// Module 3: 高CPAで自動停止するルール
create_rule({
  name: "Pause High CPA Ads",
  template: "pause_high_cpa",
  params: {
    cpa_threshold: 3000,  // 3,000円以上
    evaluation_period_days: 3
  }
})
```

#### ステップ4: A/Bテスト開始

```javascript
// Module 4: クリエイティブA vs B
create_experiment({
  name: "Creative Test: Product Image vs Lifestyle",
  test_variable: "creative",
  control_ad_id: "ad_001",
  variant_ad_ids: ["ad_002"],
  test_objective: "conversion_rate",
  confidence_level: 90
})
```

#### ステップ5: コンバージョントラッキング

```javascript
// Module 5: 購入イベント送信
send_event({
  event_name: "Purchase",
  event_time: Math.floor(Date.now() / 1000),
  user_data: {
    em: "customer@example.com",  // 自動でSHA-256ハッシュ化
    ph: "09012345678"
  },
  custom_data: {
    value: 15800,
    currency: "JPY"
  }
})
```

#### ステップ6: パフォーマンス分析

```javascript
// Module 6: 過去7日間のレポート生成
get_performance_report({
  date_preset: "last_7d",
  level: "ad",
  breakdowns: ["age", "gender"],
  format: "markdown"
})
```

## トラブルシューティング

### よくある問題

#### 1. `META_ACCESS_TOKEN` エラー

**エラー**: `Error: META_ACCESS_TOKEN is required`

**解決策**:
```bash
# .env ファイルを作成して環境変数を設定
META_ACCESS_TOKEN=your_token_here

# または一時的に設定
export META_ACCESS_TOKEN=your_token_here  # Linux/Mac
set META_ACCESS_TOKEN=your_token_here     # Windows
```

#### 2. Gemini API エラー

**エラー**: `Gemini API key not found`

**解決策**:
```bash
# google-flow-mcp/apikey.txt にキーを保存
echo "AIzaSyXXX" > google-flow-mcp/apikey.txt
```

#### 3. dry_run モードが解除されない

**問題**: 本番実行したいのに dry_run が有効

**解決策**:
```javascript
// 各ツール呼び出し時に明示的に指定
tool_name({
  // ...他のパラメータ
  dry_run: false  // 明示的にfalseを指定
})
```

#### 4. MCP サーバーが認識されない

**解決策**:
1. `~/.claude/settings.json` のパスが正しいか確認
2. Claude Code を再起動
3. `node index.js` で手動起動してエラー確認

### デバッグモード

各モジュールはデバッグ出力に対応しています：

```bash
DEBUG=* node meta-campaign-mcp/index.js
```

## API ドキュメント

各モジュールの詳細なAPI仕様は、各ディレクトリ内の README を参照してください：

- [Module 1: meta-ad-creative-mcp/README.md](./meta-ad-creative-mcp/README.md)
- [Module 2: meta-campaign-mcp/README.md](./meta-campaign-mcp/README.md)
- [Module 3: meta-budget-mcp/README.md](./meta-budget-mcp/README.md)
- [Module 4: meta-experiment-mcp/README.md](./meta-experiment-mcp/README.md)
- [Module 5: meta-tracking-mcp/README.md](./meta-tracking-mcp/README.md)
- [Module 6: meta-report-mcp/README.md](./meta-report-mcp/README.md)

## 技術仕様

### Meta Marketing API

- **バージョン**: v25.0
- **認証**: OAuth アクセストークン
- **必須スコープ**: `ads_management`, `ads_read`, `business_management`
- **推奨**: System User Token（期限なし）

### 2026年の重要な変更点

- **Advantage+ 必須化**: ASC/AAC API は 2026年Q1 で廃止
- **ODAX 構造**: 6つの目的（sales, leads, awareness, traffic, engagement, app_promotion）
- **ターゲティング自動化**: `targeting_automation` 必須

### データフロー

```
Module 1 (Creative)
    ↓ creative.json
Module 2 (Campaign)
    ↓ campaign_id, adset_id, ad_id
Module 3 (Budget) ←→ Module 4 (Experiment)
    ↓ performance metrics
Module 5 (Tracking) → Conversions API
    ↓ event data
Module 6 (Report) → Insights API
    ↓ analysis & recommendations
```

## 貢献

このプロジェクトはオープンソースです。Issue や Pull Request を歓迎します。

### 開発ガイドライン

1. 各モジュールは独立して動作すること
2. 環境変数は `.env` で管理
3. `dry_run` モードをデフォルトで有効にすること
4. エラーハンドリングを徹底すること
5. スモークテストを追加すること

## ライセンス

MIT License - 詳細は [LICENSE](./LICENSE) を参照

## サポート

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Email**: ikedachiin@gmail.com

## 謝辞

- Meta Marketing API: https://developers.facebook.com/docs/marketing-apis
- Anthropic Claude API: https://docs.anthropic.com/
- Google Gemini API: https://ai.google.dev/

---

**作成日**: 2026-02-23
**最終更新**: 2026-03-22

---

## Kindle電子書籍 出版プロジェクト

### 「1日500円から始めるMeta広告集客術」

実店舗（エステ・パーソナルジム・眉サロン・脱毛サロン）向けに、少額予算でMeta認知広告とInstagramを組み合わせて集客する方法を解説したKindle電子書籍と、そのマーケティングファネル全体のコンテンツです。

---

### ターゲット読者

- エステ・パーソナルジム・眉サロン・脱毛サロンを経営している方
- 広告費が月1〜3万円程度しか確保できない方
- スマホだけで広告運用を自己完結させたい方
- Instagramフォロワーを増やしながら集客の仕組みを作りたい方

---

### 訴求軸

> 「広告費がないから無理」という思い込みを覆す。
> SNS運用をしっかり行っていれば、少額の認知広告でも見込み客にリーチできる。

---

### ファネル全体設計

```
Kindle本（26,500字）
  ↓ 8箇所のLINE誘導CTA
LINE登録（特典3点プレゼント）
  ↓ 7日間LINEステップ配信
VSL動画視聴（15分・AIアバター）
  ↓
個別コンサル申込み
```

---

### ディレクトリ構成（`ebook-meta-ads/`）

```
ebook-meta-ads/
├── INDEX.md                        # 全体目次・ファネル設計図
├── chapters/                       # 電子書籍本文（全7章）
│   ├── chapter-00-intro.md         # はじめに（約2,000字）
│   ├── chapter-01-why-small-budget-works.md  # 第1章：少額でも機能する理由
│   ├── chapter-02-sns-and-ads.md   # 第2章：SNS×広告の組み合わせ
│   ├── chapter-03-targeting.md     # 第3章：業種別ターゲット設定
│   ├── chapter-04-creative.md      # 第4章：Canva×CapCutで制作
│   ├── chapter-05-measurement.md   # 第5章：配信設定〜効果測定
│   ├── chapter-06-casestudy.md     # 第6章：4業種ケーススタディ
│   └── chapter-07-conclusion.md    # 終章：次のステップ＋LINE誘導
├── funnel/                         # マーケティングファネル
│   ├── step2-line-cta.md           # 各章LINE誘導テキスト（8箇所）
│   ├── step4-line-steps.md         # 7日間LINEステップ配信シナリオ
│   └── step5-vsl-script.md         # VSL台本（15分版）
├── sales/                          # セールスコンテンツ
│   ├── kindle-sales-letter.md      # Kindle商品説明文（太陽スタイル・Sランク90点）
│   └── kindle-cover-design.md      # 表紙デザイン仕様書・Canva制作手順
└── production/                     # 制作・入稿ガイド
    ├── D-omnihuman1-guide.md       # VSL動画制作手順（OmniHuman1）
    └── E-meta-ads-setup.md         # Meta広告入稿設定（業種別）
```

---

### 書籍スペック

| 項目 | 内容 |
|------|------|
| 総文字数 | 約26,500字 |
| 章数 | 全7章（はじめに〜終章） |
| 対象業種 | エステ・パーソナルジム・眉サロン・脱毛サロン |
| 想定価格 | 無料〜99円（Kindle Unlimited対応） |
| CTA設置 | 全8箇所にLINE誘導 |

---

### マーケティングファネル詳細

#### LINE誘導特典（3点）
1. 業種別ターゲット設定シート（4業種対応）
2. Canvaクリエイティブテンプレート（5パターン）
3. 週次PDCAチェックシート

#### LINEステップ配信（7日間）
| Day | 内容 |
|-----|------|
| 0 | 特典お届け（即時） |
| 1 | 自己紹介・共感ストーリー |
| 2 | 転換点ストーリー・問題深掘り |
| 3 | VSL動画（15分）送付 |
| 4 | 視聴リマインド＋価値追加 |
| 5 | よくある質問・不安解消 |
| 6 | 社会的証明（4業種の事例） |
| 7 | 個別コンサル クロージング |

#### VSL（動画セールスレター）構成
- 長さ：15分
- アバター：30代女性・親しみやすい系（OmniHuman1）
- 販売商品：個別コンサル（オンライン）
- 制作ツール：OmniHuman1 × CapCut

---

### Meta認知広告 配信設定

#### キャンペーン設計
| 項目 | 設定 |
|------|------|
| 目的 | リーチ（認知度アップ） |
| 日額予算 | 500〜1,000円（スタート時） |
| 地域 | 店舗から半径3〜8km（業種別） |
| オーディエンス | Advantage+（AI自動） |
| クリエイティブ | Before/After画像 + リール動画 |
| リンク先 | Instagramプロフィール |

#### 業種別設定サマリー
| 業種 | 年齢 | 性別 | 半径 | 月額目安 |
|------|------|------|------|---------|
| エステ | 25〜50歳 | 女性 | 5km | 15,000〜30,000円 |
| パーソナルジム | 25〜45歳 | 男女/女性 | 5〜8km | 20,000〜40,000円 |
| 眉サロン | 22〜42歳 | 女性 | 3〜4km | 10,000〜20,000円 |
| 脱毛サロン | 18〜40歳 | 女性 | 5km | 20,000〜40,000円 |

---

### 実施スケジュール

| 週 | 作業 |
|----|------|
| 1週目 | Instagramプロフィール整備 → KDP入稿 |
| 2週目 | Kindle表紙制作（Canva）→ 出版申請 |
| 3週目 | VSL音声収録 → OmniHuman1動画生成 → UTAGE設定 |
| 4週目 | Meta認知広告 入稿・配信開始 |
| 毎週月曜 | 広告数値チェック（15分）→ 改善 |

---

**プロジェクト作成日**: 2026-03-22
**バージョン**: 1.0.0
