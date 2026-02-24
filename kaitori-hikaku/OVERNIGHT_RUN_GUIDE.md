# 🌙 夜間実行ガイド - 定価一括取得

## 📋 概要

**目的**: 1,682商品の定価を自動取得
**所要時間**: 1.5〜2時間（自動実行）
**取得ソース**: Google検索、価格.com、Amazon
**推定成功率**: 50〜70%（残りは買取価格から推定）

## 🚀 実行手順

### ステップ1: 夜間実行を開始

#### 方法A: バッチファイル（推奨）
```bash
cd kaitori-hikaku
scripts\run-overnight.bat
```

#### 方法B: npm スクリプト
```bash
cd kaitori-hikaku
npm run fetch-prices:bulk > logs\fetch-prices.log 2>&1
```

#### 方法C: 直接実行
```bash
cd kaitori-hikaku
python scripts\fetch-retail-prices-bulk.py
```

### ステップ2: 朝起きたら確認

#### ログ確認
```bash
# ログファイルの場所
kaitori-hikaku\logs\fetch-prices-YYYYMMDD.log
```

#### 取得結果確認
```bash
# 取得した定価データ
kaitori-hikaku\data\json\retail_prices_found.json
```

### ステップ3: products.json にマージ

```bash
npm run merge-prices
```

これで以下が自動実行されます：
1. ✅ バックアップ作成（`products.backup.json`）
2. ✅ 定価データをマージ
3. ✅ 差額・還元率を再計算
4. ✅ 統計情報を表示

### ステップ4: 確認

```bash
npm run dev
```

http://localhost:3000 で確認

## 📊 実行中の動作

### 処理フロー（1商品あたり）

1. **Google検索** → JANコード + "定価" で検索（2秒）
2. **価格.com検索** → メーカー希望小売価格を取得（1秒）
3. **Amazon検索** → 商品ページから価格抽出（1秒）
4. **推定計算** → 見つからない場合は買取価格から逆算

### 進捗確認

実行中は以下のように表示されます：

```
[1/1682] PlayStation 5 Slim CFI-2000A01...
  JAN: 4948872415934, Buyback: ¥46,000
  ✓ Google: ¥66,980

[2/1682] Nintendo Switch 有機ELモデル...
  JAN: 4902370548495, Buyback: ¥28,000
  ✓ Kakaku: ¥37,980

[3/1682] Tiger 炊飯器 JPI-X100...
  JAN: 4904710437681, Buyback: ¥58,000
  ✗ No price found
  ~ Estimated: ¥116,000 (from buyback ratio)

[Saved 20 prices]  # 20商品ごとに自動保存
```

## 📁 出力ファイル

### retail_prices_found.json
```json
{
  "4948872415934": {
    "retail_price": 66980,
    "source": "google",
    "product_name": "PlayStation 5 Slim CFI-2000A01"
  },
  "4902370548495": {
    "retail_price": 37980,
    "source": "kakaku",
    "product_name": "Nintendo Switch 有機ELモデル"
  },
  "4904710437681": {
    "retail_price": 116000,
    "source": "estimated",
    "product_name": "Tiger 炊飯器 JPI-X100"
  }
}
```

### ログファイル（例）
```
[1/1682] EPSON ホームシアタープロジェクター...
  JAN: 4988617498861, Buyback: ¥270,000
  ✓ Amazon: ¥498,000
[2/1682] Dyson Cyclone V10 Fluffy...
  JAN: 5025155070857, Buyback: ¥35,000
  ✓ Google: ¥75,900
...

=== Summary ===
New prices found: 1124
Total prices saved: 1124
Errors: 558
Output: data\json\retail_prices_found.json
```

## ⚠️ トラブルシューティング

### 問題1: 文字化けする

**原因**: Windowsコンソールのエンコーディング
**対処**: バッチファイル（`run-overnight.bat`）を使用
→ 自動で `chcp 65001` を実行してUTF-8に設定

### 問題2: IPブロックされる

**症状**: 途中で大量のエラー
**対処1**: スクリプトを編集して遅延時間を増やす

```python
# fetch-retail-prices-bulk.py の19行目
DELAY_BETWEEN_REQUESTS = 5.0  # 2.0 → 5.0 に変更
```

**対処2**: 分割実行

```python
# 20行目
MAX_PRODUCTS = 200  # 2000 → 200 に変更
# 1日200商品ずつ実行
```

### 問題3: 中断してしまった

**大丈夫！**: 20商品ごとに自動保存されています

再実行すると：
- ✅ 既に取得済みの商品はスキップ
- ✅ 未取得の商品のみ処理

```bash
# そのまま再実行でOK
npm run fetch-prices:bulk
```

## 📈 期待される結果

### 取得成功率の予測

| ソース | 成功率 | 備考 |
|--------|--------|------|
| Google | 30-40% | JANコードで定価が見つかる |
| 価格.com | 20-30% | メーカー希望小売価格 |
| Amazon | 10-20% | 現在価格（定価ではない場合も） |
| 推定 | 100% | 買取価格から逆算 |

### 最終的な定価データ

- **直接取得**: 約600〜800商品（50〜60%）
- **推定値**: 約800〜1,000商品（40〜50%）
- **合計**: 1,682商品すべて

## 🎯 実行後の確認ポイント

### 1. 取得統計

```bash
npm run merge-prices
```

出力例：
```
✅ マージ完了
   更新: 1124商品
   定価あり: 1148/1706商品
   定価なし: 558商品
```

### 2. 還元率の分布

開発サーバーで確認：
```bash
npm run dev
```

- 還元率70%以上（緑）: 高還元
- 還元率50-70%（黄）: 中還元
- 還元率50%未満（赤）: 低還元

### 3. 推定値の精度

推定値（`source: "estimated"`）の商品を確認：
- 還元率が極端（90%以上、30%以下）な商品はチェック
- 手動で定価を修正可能

## 💾 バックアップ

マージ前に自動バックアップが作成されます：
```
data/json/products.backup.json
```

元に戻す場合：
```bash
cd kaitori-hikaku/data/json
copy products.backup.json products.json
```

## 🚀 次のステップ

1. ✅ 夜間実行完了
2. ✅ マージ完了
3. ✅ データ確認
4. 🔄 Vercel再デプロイ（オプション）

```bash
npm run export-json  # 必要に応じて
git add .
git commit -m "feat: 定価データ1,682商品追加"
git push
```

---

## 📞 ヘルプ

問題が発生した場合：
1. ログファイルを確認（`logs/`）
2. `retail_prices_found.json` が存在するか確認
3. バックアップから復元（`products.backup.json`）

楽しい夜間実行を！ 🌙✨
