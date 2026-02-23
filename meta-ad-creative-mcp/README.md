# Module 1: Meta Ad Creative MCP Server

AI駆動の広告クリエイティブ自動生成モジュール。Gemini APIで画像を生成し、Claude APIで広告コピーを作成します。

## 概要

このモジュールは、Meta（Facebook/Instagram）広告のクリエイティブ（画像 + コピー）を自動生成します。5つのテンプレートから選択でき、4つの広告フォーマットに対応しています。

### 主な機能

- 🎨 **AI画像生成**: Gemini API で商品・サービス画像を生成
- ✍️ **AIコピー生成**: Claude API で訴求力の高い広告コピーを作成
- 📋 **5つのテンプレート**: discount, urgency, benefit, social_proof, storytelling
- 🖼️ **4つの広告フォーマット**: feed_square (1:1), feed_portrait (3:4), story (9:16), carousel (1:1)
- 🔄 **バリエーション生成**: 複数パターンを一括生成
- 💾 **creative.json 出力**: Module 2 (キャンペーン作成) で利用可能

## インストール

```bash
cd meta-ad-creative-mcp
npm install
```

## 必須環境変数

```.env
# Claude API キー（広告コピー生成用）
ANTHROPIC_API_KEY=sk-ant-xxxxxxxx

# Gemini API キー（画像生成用）
GEMINI_API_KEY=AIzaSyXXXXXX
```

**重要**: `google-flow-mcp/apikey.txt` にもGemini APIキーを保存してください：

```bash
echo "AIzaSyXXXXXX" > ../google-flow-mcp/apikey.txt
```

## MCPツール

### 1. list_templates

利用可能なテンプレート一覧を取得します。

**パラメータ**: なし

**戻り値**:
```json
{
  "templates": [
    {
      "id": "discount",
      "name": "割引・キャンペーン訴求",
      "description": "具体的な割引率や限定性を強調",
      "best_for": "セール、期間限定オファー、クーポン配布"
    },
    ...
  ]
}
```

**使用例**:
```javascript
list_templates()
```

---

### 2. generate_ad_copy

広告コピーのみを生成します（画像なし）。

**パラメータ**:
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| `template_id` | string | ✅ | テンプレートID（discount, urgency, benefit, social_proof, storytelling） |
| `product_name` | string | ✅ | 商品・サービス名 |
| `target_audience` | string | ✅ | ターゲット層（例: "25-45歳女性、ファッション関心層"） |
| `key_message` | string | ✅ | 訴求ポイント（例: "最大50%オフ、送料無料"） |
| `ad_format` | string | ✅ | 広告フォーマット（feed_square, feed_portrait, story, carousel） |
| `tone` | string | ❌ | トーン（friendly/professional/urgent、デフォルト: friendly） |

**戻り値**:
```json
{
  "copy": {
    "headline": "【期間限定】最大50%オフ！",
    "primary_text": "今だけのお得なチャンス...",
    "description": "送料無料・即日発送",
    "cta": "今すぐチェック"
  }
}
```

**使用例**:
```javascript
generate_ad_copy({
  template_id: "discount",
  product_name: "ウィンターコート",
  target_audience: "25-45歳女性、ファッション関心層",
  key_message: "最大50%オフ、送料無料",
  ad_format: "feed_square",
  tone: "friendly"
})
```

---

### 3. generate_ad_image

広告画像のみを生成します（コピーなし）。

**パラメータ**:
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| `template_id` | string | ✅ | テンプレートID |
| `product_name` | string | ✅ | 商品・サービス名 |
| `ad_format` | string | ✅ | 広告フォーマット |
| `image_description` | string | ❌ | 画像の詳細説明（省略可） |

**戻り値**:
```json
{
  "image_url": "data:image/png;base64,iVBORw0KG...",
  "format": "feed_square",
  "aspect_ratio": "1:1",
  "pixels": "1080x1080"
}
```

**使用例**:
```javascript
generate_ad_image({
  template_id: "benefit",
  product_name: "スマートウォッチ",
  ad_format: "story",
  image_description: "ランニング中にスマートウォッチで心拍数を確認する女性"
})
```

---

### 4. generate_ad_creative

画像とコピーの両方を生成します（**推奨**）。

**パラメータ**:
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| `campaign_id` | string | ✅ | キャンペーンID（出力ディレクトリ名に使用） |
| `template_id` | string | ✅ | テンプレートID |
| `product_name` | string | ✅ | 商品・サービス名 |
| `target_audience` | string | ✅ | ターゲット層 |
| `key_message` | string | ✅ | 訴求ポイント |
| `ad_format` | string | ✅ | 広告フォーマット |
| `tone` | string | ❌ | トーン（デフォルト: friendly） |
| `image_description` | string | ❌ | 画像の詳細説明 |

**戻り値**:
```json
{
  "creative": {
    "image_url": "data:image/png;base64,...",
    "copy": {
      "headline": "...",
      "primary_text": "...",
      "description": "...",
      "cta": "..."
    },
    "format": "feed_square",
    "template": "discount"
  },
  "output_path": "output/winter_sale/20260223-153045/creative.json"
}
```

**使用例**:
```javascript
generate_ad_creative({
  campaign_id: "winter_sale_2026",
  template_id: "urgency",
  product_name: "限定デザインスニーカー",
  target_audience: "18-35歳男性、ストリートファッション好き",
  key_message: "残り48時間、在庫限り",
  ad_format: "feed_portrait",
  tone: "urgent"
})
```

---

### 5. generate_ad_variations

複数のバリエーションを一括生成します。

**パラメータ**:
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| `campaign_id` | string | ✅ | キャンペーンID |
| `product_name` | string | ✅ | 商品・サービス名 |
| `target_audience` | string | ✅ | ターゲット層 |
| `key_message` | string | ✅ | 訴求ポイント |
| `ad_formats` | array | ✅ | 広告フォーマットの配列（例: ["feed_square", "story"]） |
| `template_ids` | array | ❌ | テンプレートIDの配列（省略時は全テンプレート） |
| `variations_per_format` | number | ❌ | フォーマットごとのバリエーション数（デフォルト: 2） |

**戻り値**:
```json
{
  "variations": [
    {
      "id": "var_001",
      "template": "discount",
      "format": "feed_square",
      "image_url": "...",
      "copy": {...}
    },
    ...
  ],
  "total": 10,
  "output_path": "output/spring_campaign/20260223-153045/"
}
```

**使用例**:
```javascript
generate_ad_variations({
  campaign_id: "spring_campaign",
  product_name: "春の新作ドレス",
  target_audience: "20-40歳女性",
  key_message: "新作30%オフ",
  ad_formats: ["feed_square", "story"],
  template_ids: ["discount", "benefit"],
  variations_per_format: 3
})
// → 2フォーマット × 2テンプレート × 3バリエーション = 12パターン生成
```

## テンプレート詳細

### 1. discount（割引・キャンペーン訴求）

**特徴**: 具体的な割引率や限定性を強調
**最適用途**: セール、期間限定オファー、クーポン配布
**例**: "【48時間限定】全品20%オフ + 送料無料"

---

### 2. urgency（緊急性・希少性訴求）

**特徴**: 数量・時間の制限で行動を促す
**最適用途**: 在庫限り、タイムセール、先着特典
**例**: "残り12個！売り切れ前にゲット"

---

### 3. benefit（ベネフィット訴求）

**特徴**: 商品・サービスの具体的なメリットを強調
**最適用途**: 機能訴求、問題解決型商品
**例**: "たった5分で完了！初心者でも簡単"

---

### 4. social_proof（社会的証明）

**特徴**: レビュー、実績、利用者数で信頼性を訴求
**最適用途**: BtoC商品、サービス、アプリ
**例**: "★4.8 / 10万人が利用中"

---

### 5. storytelling（ストーリー型）

**特徴**: 体験談やビフォーアフターで共感を生む
**最適用途**: ライフスタイル商品、変化を感じる商品
**例**: "朝のルーティンが変わった。忙しいママの新習慣"

## 広告フォーマット

### feed_square (1:1)

- **サイズ**: 1080x1080px
- **用途**: 商品紹介、ブランド認知、汎用
- **配置**: Facebook Feed, Instagram Feed, Audience Network
- **テキスト制限**: 見出し40文字、本文125文字、説明25文字

### feed_portrait (4:5)

- **サイズ**: 1080x1350px
- **用途**: ファッション、ビフォーアフター、高CTR狙い
- **配置**: Facebook Feed, Instagram Feed
- **テキスト制限**: 見出し40文字、本文125文字、説明25文字

### story (9:16)

- **サイズ**: 1080x1920px
- **用途**: UGC風、限定オファー、**2026年最推奨フォーマット**
- **配置**: Instagram Stories/Reels, Facebook Stories/Reels
- **テキスト制限**: 見出し40文字、本文125文字、説明25文字

### carousel (1:1 x 複数枚)

- **サイズ**: 1080x1080px（カードごと）
- **用途**: ステップ解説、商品一覧、ストーリー型、機能紹介
- **配置**: Facebook Feed, Instagram Feed
- **テキスト制限**: 見出し40文字、本文125文字、説明25文字
- **最大カード数**: 10枚

## 出力形式

生成されたクリエイティブは `output/{campaign_id}/{timestamp}/creative.json` に保存されます。

### creative.json の構造

```json
{
  "campaign_id": "winter_sale_2026",
  "created_at": "2026-02-23T15:30:45.123Z",
  "template": "discount",
  "format": "feed_square",
  "product": {
    "name": "ウィンターコート",
    "target_audience": "25-45歳女性、ファッション関心層",
    "key_message": "最大50%オフ、送料無料"
  },
  "creative": {
    "image_url": "data:image/png;base64,iVBORw0KG...",
    "copy": {
      "headline": "【期間限定】最大50%オフ！",
      "primary_text": "冬の必須アイテム、今だけ特別価格...",
      "description": "送料無料・即日発送",
      "cta": "今すぐチェック"
    }
  },
  "metadata": {
    "aspect_ratio": "1:1",
    "pixels": "1080x1080",
    "placements": ["Facebook Feed", "Instagram Feed"],
    "tone": "friendly"
  }
}
```

## Module 2 との連携

生成した `creative.json` は、Module 2（meta-campaign-mcp）の `create_full_campaign` ツールで使用できます。

```javascript
// Module 1: クリエイティブ生成
generate_ad_creative({
  campaign_id: "winter_sale",
  template_id: "discount",
  product_name: "コート",
  target_audience: "25-45歳女性",
  key_message: "50%オフ",
  ad_format: "feed_square"
})
// Output: output/winter_sale/20260223-153045/creative.json

// Module 2: キャンペーン作成
create_full_campaign({
  campaign_name: "Winter Sale 2026",
  objective: "sales",
  daily_budget: 10000,
  creative_path: "output/winter_sale/20260223-153045/creative.json",
  dry_run: false
})
```

## テスト

```bash
# スモークテスト実行
cd meta-ad-creative-mcp
node test/smoke-test.cjs
```

期待される出力：
```
✓ 成功: 23
✗ 失敗: 0
✓ All tests passed!
```

## トラブルシューティング

### エラー: Gemini API key not found

```bash
# google-flow-mcp/apikey.txt を作成
echo "AIzaSyXXXXXX" > ../google-flow-mcp/apikey.txt
```

### エラー: ANTHROPIC_API_KEY is required

```bash
# .env に追加
echo "ANTHROPIC_API_KEY=sk-ant-xxxxxxxx" >> ../.env
```

### 画像生成が遅い

- Gemini APIの無料枠は60リクエスト/分の制限があります
- 大量生成時は `generate_ad_variations` の `variations_per_format` を減らしてください

## API仕様

- **Gemini API**: `gemini-3-pro-image-preview` モデル使用
- **Claude API**: `claude-3-5-sonnet-20241022` モデル使用
- **画像フォーマット**: PNG (Base64エンコード)
- **コピー長**: Metaの文字数制限に準拠

## ライセンス

MIT License

---

**作成日**: 2026-02-23
**バージョン**: 1.0.0
