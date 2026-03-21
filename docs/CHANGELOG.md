# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-23

### Added

#### プロジェクト全体
- 📦 プロジェクト初回リリース
- 📝 包括的なドキュメント（README.md, SETUP_GUIDE.md）
- 🔧 セットアップ自動化スクリプト（setup.js）
- 🧪 統合テストスクリプト（integration-test.js）
- 📄 MIT ライセンス
- 🔐 環境変数テンプレート（.env.example）

#### Module 1: クリエイティブ自動生成 (meta-ad-creative-mcp)
- 🎨 Gemini API による画像生成（4つの広告フォーマット対応）
- ✍️ Claude API による広告コピー生成
- 📋 5種類のテンプレート（discount, urgency, benefit, social_proof, storytelling）
- 🔄 バリエーション自動生成機能
- 💾 creative.json 形式での出力

#### Module 2: キャンペーン自動作成 (meta-campaign-mcp)
- 🚀 Meta Marketing API v25.0 完全対応
- ⚡ Advantage+ 必須構造対応（2026年）
- 📊 ODAX 6つの目的サポート（sales, leads, awareness, traffic, engagement, app_promotion）
- 🏗️ Campaign/AdSet/Ad の一括作成（create_full_campaign）
- 🔍 キャンペーンステータス管理
- 🧪 dry_run モードデフォルト有効

#### Module 3: 予算最適化 (meta-budget-mcp)
- 💰 CBO（Campaign Budget Optimization）管理
- 📏 ルールベース自動最適化エンジン
- 📋 5つのルールテンプレート（pause_high_cpa, scale_winner, frequency_cap, low_ctr_alert, roas_scaledown）
- 💵 4つの入札戦略（lowest_cost, cost_cap, bid_cap, roas_goal）
- 📊 予算概要レポート機能
- ⚙️ if-then 条件ルール（JSON保存）

#### Module 4: A/Bテスト自動化 (meta-experiment-mcp)
- 🧪 Experiments API 統合
- 📈 統計的有意差判定（Z-score、p値計算）
- 🎯 6つのテスト変数（creative, audience, placement, optimization, bid_strategy, landing_page）
- 📊 6つのテスト目的（cost_per_result, ctr, conversion_rate, roas, cpc, cpm）
- 🏆 勝者自動スケーリング（4つのアクション）
- ✅ 信頼度レベル（65%, 80%, 90%, 95%）

#### Module 5: トラッキング (meta-tracking-mcp)
- 📍 Facebook Pixel 統合
- 🔄 Conversions API（CAPI）イベント送信
- 🔒 PII自動SHA-256ハッシュ化（15フィールド対応）
- 🆔 event_id による Pixel ↔ CAPI 重複排除
- 📋 14標準イベント + カスタムイベント対応
- 🏷️ Pixelコード生成（ベースコード、イベントスニペット、CAPI handler、GTMタグ）
- 📊 イベント品質診断（A-D グレード）

#### Module 6: レポート自動生成 (meta-report-mcp)
- 📊 Insights API レポート生成
- 📈 18指標対応（spend, impressions, clicks, ctr, cpc, cpm, cpa, conversions, roas等）
- 🎯 4種類のレポート（performance, creative, audience, trend）
- 📅 11種類の期間プリセット（today, yesterday, last_7d, last_30d等）
- 🔍 10種類の分析軸（age, gender, country, placement, device_platform等）
- 💡 自動推奨分析機能
- 📄 3つの出力形式（Markdown, CSV, Plain Text）

### Technical Details

- **Node.js**: v18.0.0以上対応
- **Meta Marketing API**: v25.0
- **MCP Protocol**: Model Context Protocol 対応
- **AI APIs**: Claude API (Anthropic), Gemini API (Google)
- **Architecture**: 6つの独立したMCPサーバー
- **Testing**: 統合テストスクリプト + 各モジュールスモークテスト

### Documentation

- ✅ プロジェクトREADME（概要、セットアップ、使い方、ワークフロー例）
- ✅ セットアップガイド（詳細な環境構築手順）
- ✅ 統合テストスクリプト（自動検証）
- ✅ セットアップスクリプト（対話的環境構築）
- ✅ 環境変数テンプレート

---

## [Unreleased]

### Planned

#### 短期（v1.1.0）
- [ ] 各モジュールの詳細README
- [ ] Module 1 のテストスクリプト
- [ ] GitHub Actions CI/CD
- [ ] CONTRIBUTING.md

#### 中期（v1.2.0）
- [ ] エラーハンドリング強化
- [ ] リトライロジック実装
- [ ] パフォーマンス最適化
- [ ] ログ機能改善

#### 長期（v2.0.0）
- [ ] Web UI ダッシュボード
- [ ] スケジューラー機能
- [ ] 複数アカウント管理
- [ ] レポートテンプレートカスタマイズ
- [ ] Slack/Discord通知統合

---

## Release Notes

### v1.0.0 - Initial Release (2026-02-23)

Meta（Facebook/Instagram）広告の完全自動化を実現する6つのMCPサーバー群の初回リリースです。

**主要機能:**
- AI駆動のクリエイティブ自動生成
- Advantage+ 対応キャンペーン自動作成
- ルールベース予算最適化
- 統計的A/Bテスト自動化
- Pixel + CAPI 統合トラッキング
- Insights API レポート自動生成

**対応API:**
- Meta Marketing API v25.0
- Claude API (Anthropic)
- Gemini API (Google)

**ドキュメント:**
- 包括的なセットアップガイド
- 統合テストスクリプト
- 自動セットアップスクリプト

このリリースで、Meta広告運用の全プロセスを自動化できます。

---

[1.0.0]: https://github.com/your-repo/meta-ads-automation/releases/tag/v1.0.0
