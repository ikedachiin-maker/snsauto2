# 給付金・補助金 自動申請エージェント

## 概要

東京都在住者向けに「申請しないともらえないお金」を自動申請するClaude Codeエージェントです。
Playwright MCPを使ってブラウザを操作し、各種給付金・補助金の申請フォームを自動入力します。

## セットアップ

### 1. Playwright MCPのインストール

```bash
claude mcp add playwright npx @playwright/mcp@latest
```

### 2. ユーザー情報の設定

`config/user_profile.json` を作成して個人情報を設定してください（テンプレート: `config/user_profile.example.json`）。

### 3. 申請の実行

```bash
# 全申請可能な給付金を確認
/check-subsidies

# 特定の給付金を申請
/apply-subsidy [subsidy_id]

# 申請状況を確認
/check-status
```

## 利用可能なコマンド

| コマンド | 説明 |
|---------|------|
| `/check-subsidies` | 申請可能な給付金一覧を表示 |
| `/apply-subsidy [id]` | 指定した給付金を自動申請 |
| `/apply-all` | 申請可能な全給付金を順番に申請 |
| `/check-status` | 申請状況を確認 |
| `/list-easy` | 簡単に申請できる給付金のみ表示 |

## 重要な注意事項

1. **個人情報の取り扱い**: `config/user_profile.json` には個人情報が含まれます。`.gitignore` に追加して絶対にコミットしないでください。
2. **申請の確認**: 自動申請前に必ず内容を確認してください。誤った申請は取り消しが困難な場合があります。
3. **二重申請の防止**: 既に申請済みの給付金は再申請しないでください。
4. **法的責任**: 虚偽の申請は不正受給となります。正確な情報のみ入力してください。
5. **マイナンバーカード**: 一部の申請にはマイナンバーカードが必要です。

## 申請対象給付金一覧

詳細は `config/subsidies.json` を参照してください。

### 自動申請可能（Webフォーム）

| 給付金名 | 金額目安 | 申請方法 |
|---------|---------|---------|
| 018サポート（東京都） | 月額5,000円×12ヶ月 | Webフォーム |
| 赤ちゃんファースト | 最大10万円相当 | Webフォーム |
| 自転車ヘルメット補助（渋谷区等） | 2,000円 | LINE/Webフォーム |
| 地方移住支援金 | 最大100万円 | Webフォーム |

### 要確認（対面・書類が必要）

| 給付金名 | 金額目安 | 申請場所 |
|---------|---------|---------|
| 運転免許自主返納支援 | 区市町村により異なる | 区市町村窓口 |
| 高齢者インフルエンザ予防接種助成 | 2,000円程度 | 医療機関 |
| 再就職支援（教育訓練給付金） | 最大50万円 | ハローワーク |

## ファイル構成

```
kyufu-agent/
├── CLAUDE.md                    # このファイル（Claude Codeの指示書）
├── config/
│   ├── subsidies.json           # 給付金・補助金データベース
│   ├── user_profile.example.json # ユーザー情報テンプレート
│   └── user_profile.json        # ユーザー情報（要作成・gitignore対象）
├── scripts/
│   ├── check_subsidies.py       # 申請可能な給付金チェック
│   ├── apply_subsidy.py         # 個別申請スクリプト
│   └── apply_all.py             # 一括申請スクリプト
├── .claude/
│   └── commands/                # カスタムコマンド定義
│       ├── check-subsidies.md
│       ├── apply-subsidy.md
│       └── apply-all.md
└── docs/
    ├── SETUP.md                 # 詳細セットアップガイド
    ├── SUBSIDIES_GUIDE.md       # 各給付金の詳細説明
    └── TROUBLESHOOTING.md       # トラブルシューティング
```

## Playwright MCPを使った申請フロー

Claude Codeは以下の手順で自動申請を実行します：

1. `config/user_profile.json` からユーザー情報を読み込む
2. `config/subsidies.json` から申請対象の給付金情報を取得
3. Playwright MCPでブラウザを起動し、申請URLにアクセス
4. フォームの各フィールドにユーザー情報を自動入力
5. 申請前に内容を確認（スクリーンショット保存）
6. ユーザーの承認後に送信
7. 申請完了を確認し、結果を記録

## セキュリティ

- 個人情報は `config/user_profile.json` にのみ保存
- このファイルは `.gitignore` で除外済み
- APIキーや認証情報は環境変数で管理
