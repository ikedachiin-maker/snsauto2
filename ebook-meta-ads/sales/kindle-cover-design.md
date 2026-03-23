# Kindle表紙デザイン仕様書
## 「1日500円から始めるMeta広告集客術」

---

## 基本スペック

| 項目 | 値 |
|------|-----|
| サイズ | 1600 × 2560px（Kindle推奨） |
| 解像度 | 300dpi |
| 形式 | JPG（RGB） |
| ファイルサイズ | 2MB以下 |

---

## デザイン方針

**ターゲット**：実店舗オーナー（エステ・ジム・眉サロン・脱毛）
**訴求軸**：少額・スマホだけ・すぐ実践できる
**印象**：親しみやすい・信頼感・実用的

---

## パターン案（3案）

### 【推奨】パターンA：数字インパクト×人物型

**最も反応が取れるKindle表紙フォーマット。**

#### NanoBanana Pro 生成プロンプト（背景画像用）

```
Create a Kindle book cover background image.

Style: Modern Japanese business/beauty aesthetic
Size: 1600x2560px (vertical, portrait orientation)

Background design:
- Deep gradient from dark navy blue (#0F172A) at top
  to vibrant blue-purple (#3B0764) at bottom
- Subtle abstract shapes: soft geometric light streaks
  suggesting Instagram/social media feed
- Small faint icons of smartphone, Instagram logo silhouette
  scattered in background (very subtle, 10% opacity)
- Bottom 30%: lighter area for text readability

Accent elements:
- Thin horizontal divider lines (gold/yellow #FBBF24, 1px)
- Soft glow effect in center
- Professional, clean, sophisticated

NO text, NO people, NO logos.
Pure background for cover design.
```

#### Canvaでのテキスト重ね（完成イメージ）

```
【上部エリア（上から15%）】
小文字・白テキスト・中央揃え
「エステ・パーソナルジム・眉サロン・脱毛サロン向け」
フォント：Noto Sans JP Medium / 28pt

【中央上エリア（上から25〜55%）】
メインタイトル・黄色テキスト (#FBBF24)・中央揃え
「1日500円から」→ 太字・120pt
「始める」→ 白・100pt
「Meta広告」→ 黄色・太字・140pt（最大サイズ）
「集客術」→ 白・太字・120pt

【帯エリア（中央・背景に水色帯）】
「スマホだけ・少額予算・認知広告×Instagram」
白テキスト・40pt・背景帯あり（半透明黒）

【下部エリア（下から25%）】
サブタイトル・白テキスト・中央揃え・50pt
「広告代理店に頼まず、自分で仕組みを作る」

【著者名（最下部）】
白テキスト・32pt
「著：[名前]」
```

---

### パターンB：Before/After型

#### NanoBanana Pro 生成プロンプト

```
Create a Kindle book cover background image.

Style: Split-screen transformation design
Size: 1600x2560px (vertical portrait)

LEFT SIDE (Before - top 50%):
- Muted, gray-toned atmosphere
- Abstract: coins falling, empty calendar, sad face icon
- Color: desaturated blue-gray (#64748B tones)
- Overlay: subtle downward arrow

RIGHT SIDE (After - bottom 50%):
- Bright, vibrant, energetic atmosphere
- Abstract: upward chart, Instagram heart icons, sparkles
- Color: vibrant blue-green (#06B6D4 to #10B981)
- Overlay: subtle upward arrow

Divider: clean horizontal line with arrow pointing down-to-up

Overall: Modern, clean, Japanese design aesthetic
Professional book cover feel

NO text, NO people.
Leave large areas for text overlay.
```

---

### パターンC：シンプル・テキスト主体型

#### NanoBanana Pro 生成プロンプト

```
Create a minimalist Kindle book cover background.

Style: Clean, professional, modern Japanese business book
Size: 1600x2560px (vertical portrait)

Design:
- Top 40%: Deep blue gradient (#1E3A5F to #1E40AF)
  with subtle Instagram/Meta logo silhouette (very faint)
- Middle 20%: Bold accent stripe in bright orange (#F97316)
- Bottom 40%: Clean white or very light gray (#F8FAFC)

Texture: Subtle grid pattern at 5% opacity throughout
Corners: Rounded feel with soft edge glow

Accent: Small Instagram camera icon silhouette
  in top right corner (gold, 15% opacity, large decorative)

Professional, minimal, trustworthy aesthetic.
Japanese business book style.

NO text, NO faces.
```

---

## Canva制作ステップ（パターンA推奨）

### Step 1：Canvaでプロジェクト作成
```
Canva → 「カスタムサイズ」→ 1600 × 2560px → 「新しいデザインを作成」
```

### Step 2：背景画像を配置
```
NanoBanana ProまたはAIで生成した背景画像をアップロード
「背景として設定」または全面に引き伸ばす
```

### Step 3：テキストを追加（推奨設定）

| テキスト | フォント | サイズ | 色 | 位置 |
|---------|---------|--------|-----|------|
| 業種名（エステ・ジム…） | Noto Sans JP | 28pt | #FFFFFF | 上部中央 |
| 「1日500円から始める」 | Noto Sans JP Bold | 90pt | #FBBF24 | 中央上 |
| 「Meta広告集客術」 | Noto Sans JP Black | 120pt | #FFFFFF | 中央 |
| キャッチコピー | Noto Sans JP | 36pt | #FFFFFF | 中央下 |
| 著者名 | Noto Sans JP | 30pt | #FFFFFF80 | 最下部 |

### Step 4：装飾を追加
```
□ 「Meta広告集客術」の文字に黄色グロー効果
□ タイトル周囲に細い罫線（金色 #FBBF24）
□ 業種名の上にInstagramグラデーションの細い帯
□ 著者名の上に白い細い区切り線
```

### Step 5：書き出し
```
「共有」→「ダウンロード」→「PNG」→「ページのサイズを変更しない」
→ファイルサイズ確認（2MB以下）
```

---

## サムネイル用（Kindle一覧表示・小サイズ確認）

KDPに登録後、一覧では **160×256px** で表示されます。
以下を縮小表示で確認してください：

```
チェックリスト（小サイズ確認用）:
□ タイトル「Meta広告集客術」が読める
□ 数字「500円」が目立つ
□ 背景色で他の本と差別化できている
□ 業種が伝わる（文字またはビジュアルで）
```

---

## 認知広告用バナー（Meta広告素材）への転用

同じデザインを以下サイズでも書き出すと、
そのまま認知広告のクリエイティブとして使えます。

| 用途 | サイズ | 形式 |
|------|--------|------|
| Facebook/Instagram フィード | 1080×1080px | JPG |
| Instagram ストーリーズ | 1080×1920px | JPG |
| Facebook ニュースフィード | 1200×628px | JPG |

---

## KDP（Kindle Direct Publishing）入稿手順

```
1. kdp.amazon.co.jp にアクセス
2. 「タイトルを追加」→「電子書籍（Kindle）」
3. 表紙画像をアップロード（JPG・2MB以下）
4. プレビューで表示を確認
5. 商品説明欄に kindle-sales-letter.md の内容を貼り付け
```

---

## キーワード設定（KDP検索最適化）

KDP登録時の「キーワード」欄に以下を設定：

```
1. Meta広告 実店舗
2. Instagram広告 少額
3. エステ 集客
4. サロン SNS マーケティング
5. Facebook広告 小規模
6. Instagram認知広告
7. 少額広告 個人サロン
```
