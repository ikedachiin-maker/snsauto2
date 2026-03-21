# 給付金・補助金 自動申請エージェント

**Claude Code + Playwright MCP** を使って、東京都在住者向けの「申請しないともらえないお金」を自動申請するエージェントです。

---

## 概要

日本には申請しないと受け取れない給付金・補助金が多数存在します。このエージェントは、Claude Codeのブラウザ操作機能（Playwright MCP）を活用し、各種申請フォームへの自動入力・送信を代行します。

対象の給付金は東京都在住者向けに厳選しており、条件が少なく誰でも申請しやすいものを優先しています。

---

## 申請可能な給付金（東京都・条件少なめ）

| 給付金名 | 金額目安 | 自動申請 | 申請方法 |
|---------|---------|---------|---------|
| 自転車ヘルメット補助（渋谷区等） | 2,000円 | 対応 | LINE/Web |
| 018サポート（東京都） | 年間60,000円 | 対応 | Webフォーム |
| 赤ちゃんファースト | 最大100,000円 | 対応 | Webフォーム |
| 児童手当 | 月10,000〜30,000円 | 対応 | Webフォーム |
| 地方移住支援金 | 最大1,000,000円 | 対応 | Webフォーム |
| 東京ゼロエミ住宅 | 最大1,000,000円 | 対応 | jGrants |
| 高齢者インフルエンザ予防接種助成 | 2,000円程度 | 非対応 | 医療機関 |
| 運転免許自主返納支援 | 区により異なる | 非対応 | 窓口 |
| 高等学校等就学支援金 | 年間最大396,000円 | 非対応 | 学校経由 |
| 再就職支援（教育訓練給付金） | 最大500,000円 | 非対応 | ハローワーク |

---

## クイックスタート

### 1. セットアップ

```bash
# Claude Codeのインストール
npm install -g @anthropic-ai/claude-code

# Playwright MCPの追加
claude mcp add playwright npx @playwright/mcp@latest

# ユーザー情報の設定
cp config/user_profile.example.json config/user_profile.json
# user_profile.json を編集して個人情報を入力
```

詳細は [docs/SETUP.md](docs/SETUP.md) を参照してください。

### 2. 申請可能な給付金を確認

```bash
cd kyufu-agent
claude
```

Claude Codeが起動したら:

```
/check-subsidies
```

### 3. 自動申請を実行

```
/apply-subsidy helmet_shibuya
```

または全件まとめて申請:

```
/apply-all
```

---

## ファイル構成

```
kyufu-agent/
├── CLAUDE.md                        # Claude Code用メイン指示書
├── README.md                        # このファイル
├── .gitignore                       # 個人情報ファイルを除外
├── config/
│   ├── subsidies.json               # 給付金データベース
│   ├── user_profile.example.json    # ユーザー情報テンプレート
│   └── user_profile.json            # ユーザー情報（要作成・gitignore対象）
├── scripts/
│   ├── check_subsidies.py           # 申請可能チェックスクリプト
│   └── apply_subsidy.py             # 個別申請スクリプト
├── .claude/
│   └── commands/                    # Claude Codeカスタムコマンド
│       ├── check-subsidies.md
│       ├── apply-subsidy.md
│       └── apply-all.md
└── docs/
    ├── SETUP.md                     # 詳細セットアップガイド
    ├── SUBSIDIES_GUIDE.md           # 各給付金の詳細説明
    └── TROUBLESHOOTING.md           # トラブルシューティング
```

---

## 仕組み

```
ユーザー
  ↓ /apply-subsidy [id] と指示
Claude Code
  ↓ config/user_profile.json を読み込む
  ↓ config/subsidies.json から申請情報を取得
  ↓ Playwright MCPでブラウザを起動
  ↓ 申請URLにアクセス
  ↓ フォームに自動入力
  ↓ スクリーンショットで確認
  ↓ ユーザーに送信前確認を求める
  ↓ 承認後に送信
  ↓ 完了を確認・記録
ユーザー
  ↑ 申請完了の報告を受け取る
```

---

## 重要な注意事項

**個人情報の取り扱い**について、`config/user_profile.json` には氏名・住所・口座情報などの個人情報が含まれます。このファイルは `.gitignore` で除外されていますが、取り扱いには十分注意してください。

**申請内容の確認**について、自動申請前に必ず内容を確認してください。誤った申請は取り消しが困難な場合があります。Claude Codeは送信前に必ずユーザーの承認を求めます。

**二重申請の防止**について、申請済みの給付金は `config/user_profile.json` の `applied_subsidies` に記録されます。同じ給付金を二重申請しないよう注意してください。

**法的責任**について、虚偽の申請は不正受給となり、返還請求や罰則の対象となります。正確な情報のみ入力してください。

---

## ライセンス

MIT License

---

## 関連リンク

- [Claude Code 公式ドキュメント](https://docs.anthropic.com/claude-code)
- [Playwright MCP](https://github.com/microsoft/playwright-mcp)
- [東京都福祉局](https://www.fukushi.metro.tokyo.lg.jp/)
- [018サポート](https://018support.metro.tokyo.lg.jp/)
