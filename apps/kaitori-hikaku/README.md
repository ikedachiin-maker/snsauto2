# 買取比較くん (kaitori-hikaku)

買取価格比較サイト - gamekaitori.jpから商品の買取価格をスクレイピングし、定価との差額・還元率を可視化するWebアプリケーション

## 📊 プロジェクト概要

- **商品数**: 1,706件（ゲーム機124 + 家電1,594）
- **定価データあり**: 24商品（主要ゲーム機・家電）
- **定価データなし**: 1,682商品
- **UI**: 10bye.com風のレスポンシブデザイン
- **スタック**: Next.js 15 + TypeScript + Tailwind CSS + sql.js (SQLite)

## 🚀 機能

### ✅ 実装済み
- ✅ gamekaitori.jp スクレイピング（ゲーム機124商品）
- ✅ gamekaitori.jp/kaden/ スクレイピング（家電1,594商品）
- ✅ 定価データ手動追加（24商品）
- ✅ 差額・還元率の自動計算
- ✅ 商品一覧（ソート・フィルタ機能）
- ✅ 商品詳細ページ
- ✅ インクリメンタル検索
- ✅ レスポンシブUI
- ✅ Vercelデプロイ対応（SQLite→JSON変換）

### 🚧 開発中
- 🔄 定価の一括自動取得（Google/Amazon/価格.com）

## 📁 ディレクトリ構造

```
kaitori-hikaku/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # トップページ（ヒーロー＋人気商品）
│   │   ├── products/page.tsx  # 商品一覧（フィルタ・ソート）
│   │   ├── product/[slug]/    # 商品詳細
│   │   └── api/search/        # 検索API
│   ├── components/            # Reactコンポーネント
│   │   ├── Header.tsx         # ヘッダー（検索バー込み）
│   │   ├── ProductCard.tsx    # 商品カード（差額・還元率表示）
│   │   └── SearchBar.tsx      # インクリメンタル検索
│   └── lib/
│       ├── db.ts              # SQLite/JSON データアクセス層
│       └── scraper.ts         # スクレイピングロジック
├── scripts/
│   ├── scrape.ts              # ゲーム機スクレイパー
│   ├── scrape-kaden.ts        # 家電スクレイパー
│   ├── add-manual-prices.ts   # 定価手動追加
│   ├── fetch-retail-prices.ts # 定価自動取得（開発中）
│   ├── fetch-retail-prices-bulk.py  # 定価一括取得（Python版）
│   └── export-json.ts         # SQLite→JSON変換（Vercel用）
└── data/
    ├── kaitori.db             # SQLiteデータベース（ローカル開発用）
    └── json/                  # JSON出力（本番デプロイ用）
        ├── products.json      # 全商品データ（1,706件）
        ├── categories.json    # カテゴリ一覧
        └── history.json       # 価格履歴
```

## 🛠️ セットアップ

### 1. 依存関係のインストール
```bash
cd kaitori-hikaku
npm install
```

### 2. データベース初期化
```bash
npm run db:init
```

### 3. スクレイピング実行

#### ゲーム機（124商品）
```bash
npm run scrape
```

#### 家電（1,594商品）
```bash
npm run scrape:kaden
```

### 4. 定価データ追加

#### 手動追加（24商品の定価を一括登録）
```bash
npm run add-prices
```

#### 自動取得（開発中 - 残り1,682商品）
```bash
# TypeScript版（実装途中）
npm run fetch-prices

# Python版（Google/価格.com/Amazon検索）
python scripts/fetch-retail-prices-bulk.py
```

### 5. JSON出力（Vercel デプロイ用）
```bash
npm run export-json
```

### 6. 開発サーバー起動
```bash
npm run dev
```

http://localhost:3000 でアクセス

## 📦 データ構造

### products.json

```json
{
  "id": 1,
  "name": "PlayStation 5 Slim CFI-2000A01",
  "jan_code": "4948872415934",
  "category": "PS5",
  "buyback_price": 46000,
  "retail_price": 66980,
  "diff": 20980,
  "return_rate": 68.7,
  "slug": "playstation-5-slim-cfi-2000a01-4948872415934",
  "url": "https://gamekaitori.jp/product/...",
  "scraped_at": "2026-02-23T14:00:00.000Z"
}
```

### 主要フィールド
- `buyback_price`: 買取価格（円）
- `retail_price`: 定価（円）- **24商品のみ**
- `diff`: 差額 = retail_price - buyback_price
- `return_rate`: 還元率 = (buyback_price / retail_price) × 100
- `jan_code`: JANコード（13桁）
- `slug`: URL用スラッグ（商品名-JANコード）

## 🎯 定価データ追加状況

### ✅ 定価あり（24商品）

#### ゲーム機（14商品）
- PlayStation 5 シリーズ（6商品）
  - PS5 Slim ディスク版: ¥66,980
  - PS5 Slim デジタル版: ¥59,980
  - PS5 Pro: ¥119,980
  - 旧型PS5: ¥60,478〜66,980

- Nintendo Switch シリーズ（8商品）
  - 有機ELモデル: ¥37,980
  - 通常版: ¥32,978
  - Lite全色: ¥21,978

#### 家電（10商品）
- 炊飯器（6商品）
  - Tiger JPI-X100: ¥86,184
  - 象印 NW-PV10: ¥56,000
  - 象印 NW-FB10: ¥43,000
  - 象印 NW-YA10: ¥65,000

- 掃除機（1商品）
  - Dyson V10 Fluffy: ¥75,900

- コーヒーメーカー（1商品）
  - DeLonghi ECAM22020: ¥78,000

- 美容家電（1商品）
  - Panasonic ナノケア EH-SA0B: ¥50,000

- その他（1商品）
  - BALMUDA The Lantern: ¥14,850

### 🔄 定価なし（1,682商品）

残り1,682商品の定価を以下の方法で取得予定：

1. **Google検索** - JANコード + "定価" で検索
2. **価格.com** - メーカー希望小売価格を取得
3. **Amazon.co.jp** - 商品ページから価格抽出
4. **推定** - 買取価格から定価を推定（カテゴリ別還元率50-70%）

## 🚀 デプロイ

### Vercel へデプロイ

1. **JSONエクスポート**
```bash
npm run export-json
```

2. **Vercel CLI**
```bash
npx vercel
```

3. **環境変数** - 不要（静的JSON読み込み）

### 注意点
- sql.js (WASM版SQLite) はVercel Edge Runtimeで動作しない
- 本番環境では `data/json/*.json` から直接読み込み
- スクレイピングはローカルで実行し、JSONを git commit

## 📝 npm スクリプト

```json
{
  "dev": "next dev",              // 開発サーバー
  "build": "next build",          // 本番ビルド
  "start": "next start",          // 本番サーバー
  "lint": "next lint",            // ESLint
  "scrape": "tsx scripts/scrape.ts",              // ゲーム機スクレイピング
  "scrape:kaden": "tsx scripts/scrape-kaden.ts",  // 家電スクレイピング
  "add-prices": "tsx scripts/add-manual-prices.ts",       // 定価手動追加
  "fetch-prices": "tsx scripts/fetch-retail-prices.ts",   // 定価自動取得（開発中）
  "db:init": "tsx scripts/init-db.ts",            // DB初期化
  "export-json": "tsx scripts/export-json.ts"     // JSON出力（Vercel用）
}
```

## 🎨 UI デザイン

### 参考: 10bye.com
- 定価と差額を強調表示
- 還元率バッジ（色分け）
  - 70%以上: 緑（高還元）
  - 50-70%: 黄（中還元）
  - 50%未満: 赤（低還元）
- グラデーション背景
- レスポンシブグリッド

### カラーパレット
- Primary: `#3B82F6` (Blue 600)
- Success: `#10B981` (Green 500)
- Warning: `#F59E0B` (Amber 500)
- Danger: `#EF4444` (Red 500)

## 🔍 検索・フィルタ機能

### 検索
- インクリメンタルサーチ（リアルタイム）
- 商品名・JANコード・カテゴリで検索

### フィルタ
- カテゴリ（17種類）
- 定価データ有無

### ソート
- 買取価格（高い順/安い順）
- 還元率（高い順/低い順）
- 差額（大きい順/小さい順）
- 商品名（50音順）

## 📊 統計

### カテゴリ別商品数（Top 10）
1. 調理家電: 315商品
2. PC周辺機器: 248商品
3. 季節・空調家電: 212商品
4. オーディオ: 189商品
5. 掃除機: 156商品
6. Nintendo Switch: 82商品
7. レコーダー/テレビ: 78商品
8. PS5: 73商品
9. 美容家電: 68商品
10. Xbox: 42商品

### 価格帯
- 最高買取価格: ¥270,000（EPSON ホームシアタープロジェクター）
- 最低買取価格: ¥1,000（古いゲーム機等）
- 平均買取価格: ¥15,423

## 🐛 既知の問題

### Python スクリプト
- ❌ Windowsコンソールでの文字化け（UTF-8エンコーディング）
  - 修正方法: `sys.stdout.reconfigure(encoding='utf-8')` を追加

### Next.js
- ⚠️ sql.js が Vercel Edge Runtime で動作しない
  - 回避策: JSON出力方式に変更済み

## 📚 技術スタック

- **フロントエンド**: Next.js 15, React 19, TypeScript
- **スタイリング**: Tailwind CSS 4.0
- **データベース**: sql.js (SQLite WASM) - ローカル開発
- **データ**: JSON - 本番環境
- **スクレイピング**: cheerio (HTML解析)
- **デプロイ**: Vercel

## 📄 ライセンス

Private

## 👤 作成者

ikedachiin@gmail.com

---

## 🚀 次のステップ

1. **定価一括取得の完成**
   - `fetch-retail-prices-bulk.py` の文字化け修正
   - 1,682商品の定価データを自動取得

2. **価格履歴機能**
   - 日次スクレイピング
   - 価格推移グラフ

3. **アラート機能**
   - 価格変動通知
   - 高還元率商品のアラート

4. **複数店舗対応**
   - じゃんぱら、ソフマップ等も追加
   - 最安値・最高値の比較

5. **SEO最適化**
   - 商品ページのメタタグ
   - サイトマップ生成
