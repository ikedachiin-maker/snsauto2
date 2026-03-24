# 画像生成・CTA設計ガイド

## 1. トミー投稿の画像分析

### タイトル画像（サムネイル）
- **役割**: タイムラインで目を止めさせる
- **デザイン**: ダーク背景 + 白/黄色の大文字 + 衝撃的な数字
- **例**: 「年商6億円 利益率98%の秘密」
- **サイズ**: 1200x675px（16:9）推奨

### スライド画像（本文中）
- **役割**: 情報をビジュアルで伝達、スワイプを促す
- **デザイン**: ステップ図、比較表、フローチャート
- **例**: 3ステップのフレームワーク図、Before/After比較
- **サイズ**: 1080x1350px（4:5）推奨（Xで最も面積が大きい）

### 引用画像
- **役割**: 元ネタの信頼性を視覚的に担保
- **デザイン**: 海外サービスのスクリーンショット + 日本語注釈
- **取得方法**: 元ネタサイトのスクリーンショット or OCR

## 2. 画像生成方法

### 方法A: 元ネタからOCR抽出
1. 元ネタサイトのスクリーンショットを取得
2. 日本語注釈をオーバーレイ
3. ブランドカラーに統一

### 方法B: NanoBananaProで生成
- **MCP**: google-flow-mcp を使用
- **モデル**: gemini-3-pro-image-preview（最高品質）
- **プロンプト例**:

```
タイトル画像:
"Create a dark gradient background (navy to black) social media image with large white Japanese text '年商6億円 利益率98%' centered, minimalist business style, no people, clean typography"

スライド画像:
"Create an infographic slide showing 3 steps in a vertical layout: Step 1 'ブログ記事を書く', Step 2 'YouTube動画化', Step 3 'SNS分割配信', dark theme with white text and blue accent, modern business style"

比較画像:
"Create a comparison infographic: Left side 'note 1100万円' in red, Right side 'Park 7500万円' in green, VS in the center, dark background, Japanese text, business analytics style"
```

### アスペクト比設定
| 用途 | 比率 | サイズ |
|------|------|--------|
| Xタイムライン | 16:9 | 1200x675 |
| X最大表示 | 4:5 | 1080x1350 |
| Xカルーセル | 1:1 | 1080x1080 |
| Instagram | 4:5 | 1080x1350 |
| Story/Reels | 9:16 | 1080x1920 |

## 3. CTA URL設定

### 現在の設定
- **CTA URL**: （後で指定予定）
- **配置位置**: 投稿の最後

### CTA挿入パターン

```
パターン1（シンプル）:
詳しくはこちら→ [CTA URL]

パターン2（誘導型）:
この手法を詳しく知りたい方はこちら
→ [CTA URL]

パターン3（限定型）:
今だけ無料で公開中
→ [CTA URL]

パターン4（質問型）:
あなたもこの仕組みを作りたいですか？
→ [CTA URL]
```

### トミーのCTA使用法
- 投稿本文の最後にリンクを配置
- 「以下、解説」でスレッドに誘導
- note.com記事への直リンクが多い
- LINE追加を促すパターンもあり

## 4. 投稿フロー（まとめ）

```
1. 元ネタサイトからネタ選定
   ↓
2. テンプレート選択（5種から）
   ↓
3. テンプレートに沿って文章作成
   ↓
4. 画像生成（NanoBananaPro or スクリーンショット）
   ↓
5. CTA URL挿入
   ↓
6. X投稿
```
