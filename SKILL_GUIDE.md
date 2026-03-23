# TAISUN Agent v2.30.0 スキル完全ガイド

> 109個のスキルをカテゴリ別に分類し、使い方と詳細を解説します。

## 目次

1. [基本的な使い方](#基本的な使い方)
2. [リサーチ・情報収集（14スキル）](#1-リサーチ情報収集)
3. [太陽スタイル・コピーライティング（12スキル）](#2-太陽スタイルコピーライティング)
4. [LP（ランディングページ）制作（8スキル）](#3-lpランディングページ制作)
5. [動画・コンテンツ制作（10スキル）](#4-動画コンテンツ制作)
6. [SNSマーケティング（5スキル）](#5-snsマーケティング)
7. [セールス・ファネル構築（8スキル）](#6-セールスファネル構築)
8. [画像生成・デザイン（6スキル）](#7-画像生成デザイン)
9. [URL分析（2スキル）](#8-url分析)
10. [キーワード・SEO（4スキル）](#9-キーワードseo)
11. [設計・ドキュメント（SDD系 12スキル）](#10-設計ドキュメントsdd系)
12. [開発・DevOps（10スキル）](#11-開発devops)
13. [メモリ・知識管理（4スキル）](#12-メモリ知識管理)
14. [営業自動化（5スキル）](#13-営業自動化)
15. [その他ユーティリティ（9スキル）](#14-その他ユーティリティ)

---

## 基本的な使い方

### スキルの呼び出し方

スキルはClaude Code内で以下の方法で呼び出せます：

```
# 方法1: スラッシュコマンド
/skill-name [引数]

# 方法2: 自然言語トリガー
「リサーチして」「LPを作って」「太陽スタイルで書いて」

# 方法3: Skill tool経由
Skill tool → skill: "skill-name", args: "引数"
```

### 重要なルール

- スキル指定がある場合は **必ずSkill toolを使用** （手動実装は禁止）
- 多くのスキルはAPIキー不要で動作（`-free`系スキル）
- 出力はMarkdown形式が基本

---

## 1. リサーチ・情報収集

### `/research [トピック]`
**ワンコマンド深層調査**。トピックを指定するだけでWeb検索→証拠収集→分析→出典付きレポートを自動生成。

### `/research-free [トピック] [--depth=quick|standard|deep]`
**APIキー不要リサーチ**。WebSearchのみで動作。配布環境でもそのまま使える。
- `quick`: 5件、`standard`: 10-15件、`deep`: 20件以上

### `/research-cited-report`
**出典付き構造化レポート**。一次情報を優先収集し、結論・重要ポイント・リスク・次アクションをまとめる。

### `/mega-research [トピック] [--mode=deep|quick|news|trend]`
**6API統合リサーチ**（Tavily/SerpAPI/Brave/NewsAPI/Reddit/Perplexity）。クロス検証・重複排除・スコアリング付き。

### `/mega-research-plus [トピック] [--mode=deep|quick|news|social|free]`
**mega-researchの強化版**。8ソース統合（X/DuckDuckGoも含む）。`free`モードでAPIキー不要。

### `/unified-research`
**5API統合**。トリガー: 「リサーチして」「調べて」「情報を集めて」

### `/world-research キーワード=[キーワード]`
**50+プラットフォーム横断**。X・Reddit・YouTube・note・Bilibili・小红書・Arxiv・Google Scholar等を6層アーキテクチャで検索。日英中3言語対応。

### `/gem-research <業界/トピック> [--mode=quick|standard|deep|industry]`
**Marketing AI Factory向け9層リサーチ**。4業界プリセット内蔵（美容院等）。

### `/gpt-researcher`
**自律型Deep Research**。50+ソースを横断探索し引用付きレポートを自動生成。

### `/dr-explore` → `/dr-synthesize` → `/dr-build`
**Deep Researchパイプライン**。3段階（探索→統合→実装）で調査から実装まで一気通貫。
- `dr-explore`: 証拠収集・evidence.jsonl生成
- `dr-synthesize`: レポート＋実装計画生成
- `dr-build`: コードへの落とし込み

### `/dr-mcp-setup`
Deep Research用MCPサーバーの追加・管理。

### `/apify-research`
**Apify MCP経由スクレイピング**。Instagram/X/TikTok/YouTube/Amazonなど数千のActorでデータ抽出。

### `/note-research ジャンル=[名前]`
**note.com特化リサーチ**。非公式APIでトレンド・売れ筋パターン・構成テンプレートを分析。コスト0円。

---

## 2. 太陽スタイル・コピーライティング

> 日給5000万円を生み出した太陽スタイルのコピーライティング技術群

### メインスキル

| スキル | コマンド | 用途 |
|--------|---------|------|
| **taiyo-style** | 「太陽スタイルで書いて」 | マスタースキル。対話型コピー・感情のジェットコースター・数値とストーリー融合 |
| **taiyo-analyzer** | 「太陽スタイルで分析して」 | 176パターンに基づく6次元スコアリング（0〜100点）|
| **taiyo-rewriter** | 「太陽スタイルにリライトして」 | スコアに応じて軽微調整〜全面リライト |

### 専門スキル

| スキル | コマンド | 用途 |
|--------|---------|------|
| **taiyo-style-headline** | `/taiyo-style-headline` | ヘッドライン10案自動生成（開封率3.2倍・CTR4.7倍）|
| **taiyo-style-bullet** | `/taiyo-style-bullet` | ブレット・ベネフィットリスト（購買意欲3.8倍）|
| **taiyo-style-lp** | `/taiyo-style-lp` | 12セクション完全準拠LP（成約率4.3倍）|
| **taiyo-style-sales-letter** | `/taiyo-style-sales-letter [商品名]` | 27ブロック構造セールスレター（Sランク品質自動保証）|
| **taiyo-style-step-mail** | `/taiyo-style-step-mail` | 7〜14通ステップメール（6教育要素+心理トリガー）|
| **taiyo-style-vsl** | `/taiyo-style-vsl` | 35〜45分・15章VSL台本（感情曲線設計）|
| **taiyo-style-ps** | `/taiyo-style-ps` | 追伸生成（7つの黄金パターン）|

### 補助スキル

| スキル | 用途 |
|--------|------|
| **copywriting-helper** | セールスレター・メルマガ・VSL等のテンプレートベースコピー作成 |
| **customer-support-120** | 顧客の期待を120%超える返信生成（6教育要素組込み・2000文字以上）|

---

## 3. LP（ランディングページ）制作

| スキル | コマンド | 特徴 |
|--------|---------|------|
| **lp-design** | 「LP設計して」 | オプトイン/セールス/漫画LP設計。7要素構成テンプレート |
| **lp-full-generation** | `/lp-full-generation` | **RAG+ローカルLLMで12セクション全生成（コスト0円）**。70点未満は自動再生成 |
| **lp-local-generator** | `/lp-local-generator <section>` | セクション単位のローカル生成。API費用0円 |
| **lp-analysis** | 「LPを分析して」 | 太陽スタイル基準で分析し3フェーズ改善ロードマップ提案 |
| **lp-analytics** | `/lp-analytics` | LP知識ベース（1096チャンク）の統計分析・共通パターン抽出 |
| **lp-json-generator** | 「この画像で文字だけ変えて」 | 参考画像のデザインを維持しながらテキスト差替え |
| **mendan-lp** | 「面談LPを作って」 | 面談申込率50%の4パターン（ストーリー型/タイムライン型/Q&A型/神話崩し型）|
| **figma-design** | FigmaのURLを含める | FigmaデザインからReact/CSSコードをピクセルパーフェクトに生成 |

---

## 4. 動画・コンテンツ制作

| スキル | コマンド | 用途 |
|--------|---------|------|
| **shorts-create** | `/shorts-create [トピック]` | **ショート動画全自動制作**（リサーチ→スクリプト→画像→音声→レンダリング→検証）|
| **video-agent** | `/video-agent download\|transcribe\|produce` | 統合動画自動化（yt-dlp/Whisper/FFmpeg/Remotion）|
| **youtube-content** | 「YouTube動画の企画・台本作成」 | ショート(60秒)と長尺(10-20分)の台本作成 |
| **youtube-thumbnail** | 「サムネイルを作って」 | CTR向上サムネイル作成ガイド（4パターン）|
| **youtube_channel_summary** | `/youtube_channel_summary [URL]` | チャンネル分析（テーマ・パターン・競合分析）|
| **launch-video** | 「ローンチ動画の台本を作って」 | 4話構成×8パート（各70分）のローンチ動画スクリプト |
| **telop** | `/テロップ [動画種類] [内容]` | ショート動画用テロップ作成（4種類のスタイル）|
| **anime-slide-generator** | `/slides` `/anime-slides` | アニメ風スライド自動生成（NanoBanana Pro+Pillow）|
| **anime-production** | 「アニメ動画作成」 | アニメ動画・広告・キャラクターアニメーション制作 |
| **omnihuman1-video** | 「AIアバター動画を作って」 | 1枚の画像+音声からリップシンクAIアバター動画を生成 |

---

## 5. SNSマーケティング

| スキル | コマンド | 用途 |
|--------|---------|------|
| **sns-marketing** | `make sns-workflow PLATFORM=x` | 5役割分離ワークフロー（戦略→制作→レビュー→投稿→分析）|
| **sns-patterns** | 「SNS投稿を作って」 | X/Instagram/YouTube/noteの投稿パターン・炎上対策 |
| **note-marketing** | 「note記事を作って」 | note.com記事作成＋無料→有料ファネル設計 |
| **line-marketing** | 「LINEステップメッセージを設計して」 | 10日間シナリオ＋リッチメニュー設計 |
| **education-framework** | 「ステップメール設計」 | 6教育要素フレームワーク（目的・問題・解決策・価値・信用・行動）|

---

## 6. セールス・ファネル構築

| スキル | コマンド | 用途 |
|--------|---------|------|
| **funnel-builder** | `/funnel-builder [platform]` | Kindle/note/YouTube/SNS→LINE→VSLファネル統合構築 |
| **sales-systems** | 「VSLスクリプトを作って」 | VSL・セミナー台本・個別相談トーク設計 |
| **kindle-publishing** | 「Kindle本を書いて」 | 10章構成・1章3000-5000文字の電子書籍作成 |
| **lead-scoring** | 「リードをスコアリングして」 | 4次元スコアリング（HOT/WARM/COLD/DISQUALIFIED）|
| **outreach-composer** | 「リードにメッセージを送って」 | LINE/メール/SMS/音声でパーソナライズメッセージ送信 |
| **ai-sdr** | `/workflow-start sdr_pipeline_v1` | 自律型営業AI（リード取込→スコアリング→4チャネル自動送信）|
| **voice-ai** | 「アウトバウンドコール自動化」 | Twilio+OpenAI音声AIで電話発信・IVR・SMS自動化 |
| **customer-support-120** | 「120%の返信を作成して」 | 神対応カスタマーサポート返信生成 |

---

## 7. 画像生成・デザイン

| スキル | コマンド | 用途 |
|--------|---------|------|
| **nanobanana-pro** | 「画像を生成して」 | Gemini NanoBanana Proでテキスト→画像生成 |
| **nanobanana-prompts** | 「画像プロンプトを作って」 | NanoBanana向け最適化プロンプト生成（フェイススワップ等）|
| **custom-character** | 「キャラクター画像を作って」 | キャラクター一貫性を保ったバリエーション生成 |
| **diagram-illustration** | 「図解を作って」 | フロー図・比較図・構造図等のインフォグラフィック生成 |
| **agentic-vision** | `/agentic-vision` | Gemini 3 Flashで画像・動画の高度分析 |
| **figma-design** | FigmaのURLを含める | Figmaデザインからコード生成 |

---

## 8. URL分析

### `/url-all <URL> [--mode=quick|standard|deep|competitive|seo|audit|links]`
**ローカルLLM完全把握**。Playwright MCP + Ollamaで7モード・7層分析。APIキー不要。

### `/url-deep-analysis <URL> [--depth=1|2|3] [--mode=full|structure|design|content|links]`
**5層完全解析**。HTML/CSS/デザイン/リンク/コンテンツ。WebFetch・Playwright・curlを自動選択。

---

## 9. キーワード・SEO

| スキル | コマンド | 用途 |
|--------|---------|------|
| **keyword-free** | `/keyword-free <シードKW>` | APIキー不要キーワード抽出（WebSearchのみ）|
| **keyword-mega-extractor** | `/keyword-mega-extractor <シードKW>` | 複数API統合8タイプキーワード大量抽出 |
| **keyword-to-gem** | `/keyword-to-gem <キーワード>` | KW→SNS横断検索→NotebookLM→Gem作成まで全自動 |

---

## 10. 設計・ドキュメント（SDD系）

> Spec-Driven Development: 仕様駆動開発の完全パイプライン

### 推奨実行順序

```
/sdd-stakeholder → /sdd-context → /sdd-glossary → /sdd-event-storming
→ /sdd-req100 → /sdd-design → /sdd-slo → /sdd-threat
→ /sdd-tasks → /sdd-runbook → /sdd-guardrails → /sdd-adr
```

### 一括実行
```
/sdd-full [spec-slug]   # 7成果物を依存順に自動生成（C.U.T.E.スコア>=98目標）
```

| スキル | 出力 | 役割 |
|--------|------|------|
| **sdd-stakeholder** | stakeholder-map.md | ステークホルダー特定（Power/Interest Grid・RACI）|
| **sdd-context** | business-context.md | ビジネス目標整合（PR-FAQ・OKR・Impact Map）|
| **sdd-glossary** | glossary.md | 用語辞書（DDD Ubiquitous Language）|
| **sdd-event-storming** | event-storming.md | ドメイン知識可視化（Events・Commands・Aggregates）|
| **sdd-req100** | requirements.md | 要件定義（EARS準拠・105点満点スコアリング）|
| **sdd-design** | design.md | アーキテクチャ設計（C4 Model・Arc42）|
| **sdd-slo** | slo.md | SLI/SLO/SLA定義（Prometheusルール付き）|
| **sdd-threat** | threats.md | STRIDE脅威分析（リスクスコアリング・DFD図）|
| **sdd-tasks** | tasks.md | タスク分解（1-4時間粒度・Mermaidガント）|
| **sdd-runbook** | runbook.md | 運用手順書（SEV1-4定義・コピペ実行コマンド）|
| **sdd-guardrails** | guardrails.md | AIエージェント安全設計（権限境界・監査証跡）|
| **sdd-adr** | adr-XXX.md | 技術選択記録（MADR形式・代替案3つ以上）|

---

## 11. 開発・DevOps

| スキル | コマンド | 用途 |
|--------|---------|------|
| **batch** | `/batch <タスク>` | git worktreeで並列エージェントチームによる大規模変更 |
| **dual-ai-review** | `/dual-ai-review` | 2AI並列レビュー（実装AI+検証AI）。バグ30-60%削減 |
| **context7-docs** | プロンプトに「use context7」 | React/Next.js/Tailwind等の最新公式ドキュメント取得 |
| **security-scan-trivy** | 「脆弱性スキャンして」 | Trivyセキュリティスキャン |
| **docker-mcp-ops** | 「Dockerを操作して」 | MCP経由Dockerコンテナ管理 |
| **phase1-tools** | `make setup` / `make verify` | ドキュメント処理ツール群管理（Pandoc/Marp/Gotenberg）|
| **phase2-monitoring** | 「監視を設定して」 | Prometheus/Grafana/Loki監視スタック管理 |
| **opencode-fix** | 「バグを修正して」 | mistakes.md参照→再発防止チェック→最小差分修正 |
| **opencode-ralph-loop** | `/opencode-ralph-loop` | OpenCode反復開発ループ（max-iterations必須）|
| **opencode-setup** | 「OpenCodeをセットアップしたい」 | OpenCode CLI導入・設定ガイド |

---

## 12. メモリ・知識管理

| スキル | コマンド | 用途 |
|--------|---------|------|
| **hierarchical-memory** | 「これを長期記憶に保存して」 | 3層階層メモリ（ショート/ロング/エピソード）。精度26%向上 |
| **qdrant-memory** | 「これを覚えておいて」 | Qdrantベクターデータベースでセマンティック検索・永続記憶 |
| **notion-knowledge-mcp** | Notion保存・検索時 | Notion MCP経由で知識の検索・追記・整理 |
| **agent-trace** | `/agent-trace` | AI生成コードの帰属追跡・統計・レポート |

---

## 13. 営業自動化

| スキル | コマンド | 用途 |
|--------|---------|------|
| **ai-sdr** | `/workflow-start sdr_pipeline_v1` | 自律型営業AI（リード→スコアリング→4チャネル送信）|
| **lead-scoring** | 「リードをスコアリングして」 | 4次元HOT/WARM/COLD分類 |
| **outreach-composer** | 「リードにメッセージを送って」 | パーソナライズアウトリーチ（LINE/Email/SMS/Voice）|
| **voice-ai** | 「アウトバウンドコール自動化」 | Twilio+OpenAIで電話自動化 |
| **workflow-automation-n8n** | n8nワークフロー設計依頼 | n8n自動化ワークフロー設計（6要素分解）|

---

## 14. その他ユーティリティ

| スキル | コマンド | 用途 |
|--------|---------|------|
| **pdf-processing** | 「PDFを読んで」 | PDF処理（テキスト抽出/テーブル取得/結合/分割/OCR）|
| **pdf-automation-gotenberg** | 「PDFに変換して」 | HTML/Office/URL→PDF変換（Gotenberg）|
| **doc-convert-pandoc** | 「ドキュメントを変換して」 | Pandocフォーマット変換（Markdown→PDF等）|
| **japanese-tts-reading** | `/japanese-tts-reading` | 日本語テキスト→音声変換（4エンジン対応）|
| **skill-validator** | `/skill-validator [パス]` | スキルファイル品質検証（0-100スコア）|
| **unified-notifications-apprise** | 通知送信依頼 | Email/Discord/Telegram等マルチ通知 |
| **postgres-mcp-analyst** | 「PostgreSQLを分析して」 | MCP経由PostgreSQL分析 |
| **udemy-download** | `/udemy-download <URL>` | Udemyコースダウンロード |
| **kaitori-price-fetch** | `/kaitori-price-fetch` | 買取比較くん定価自動取得 |

---

## ストーリーパターン（物語YouTube台本 5種）

感動系YouTube台本の構造テンプレート：

| スキル | パターン | 構造 |
|--------|---------|------|
| **story-pattern-delayed-rescue** | 遅れて届く救い型 | 10幕構成 |
| **story-pattern-flawed-hero** | 傷ある主人公型 | 9幕構成 |
| **story-pattern-inner-conflict** | 内なる葛藤型 | 9幕構成 |
| **story-pattern-systemic-wall** | 組織の壁型 | 9幕構成 |
| **story-pattern-witness-reversal** | 逆転の証人型 | 9幕構成 |

```
# 呼び出し例
/story-pattern-delayed-rescue テーマ:介護 主人公:30代男性 舞台:地方の病院
```

---

## よくある使い方の組み合わせ

### Kindle出版パイプライン
```
/keyword-free [テーマ]           # キーワード調査
/research-free [テーマ]          # テーマリサーチ
/kindle-publishing               # 10章構成で執筆
/nanobanana-pro                  # 表紙画像生成
```

### LP制作パイプライン
```
/research [商品テーマ]            # 市場調査
/taiyo-style-headline            # ヘッドライン10案
/lp-full-generation              # 12セクション全生成（0円）
/taiyo-analyzer                  # スコアリング
/taiyo-rewriter                  # 低スコア部分リライト
```

### YouTube動画パイプライン
```
/youtube_channel_summary [競合URL]  # 競合分析
/youtube-content                    # 企画・台本
/shorts-create [トピック]           # ショート動画全自動制作
/youtube-thumbnail                  # サムネイル作成
```

### 営業自動化パイプライン
```
/lead-scoring                    # リードスコアリング
/outreach-composer               # メッセージ作成
/ai-sdr                         # 自動送信
/voice-ai                       # 電話フォローアップ
```

### 新サービス設計パイプライン
```
/sdd-full [プロジェクト名]       # 7成果物一括生成
# または段階的に:
/sdd-stakeholder → /sdd-context → /sdd-req100 → /sdd-design → /sdd-tasks
```
