# セットアップガイド

## 必要なもの

- **Claude Code**（Anthropic公式CLIツール）
- **Node.js** v18以上
- **Python** 3.9以上
- **Anthropic APIキー**

---

## Step 1: Claude Codeのインストール

```bash
npm install -g @anthropic-ai/claude-code
```

インストール確認:

```bash
claude --version
```

---

## Step 2: Playwright MCPのセットアップ

Claude CodeにPlaywright MCPを追加します。これにより、Claude Codeがブラウザを操作できるようになります。

```bash
claude mcp add playwright npx @playwright/mcp@latest
```

設定確認:

```bash
claude mcp list
```

`playwright` が表示されれば成功です。

---

## Step 3: リポジトリのクローン

```bash
git clone https://github.com/ikedachiin-maker/snsauto2.git
cd snsauto2/kyufu-agent
```

---

## Step 4: ユーザー情報の設定

```bash
cp config/user_profile.example.json config/user_profile.json
```

`config/user_profile.json` を開いて、実際の情報を入力してください。

```json
{
  "personal": {
    "last_name": "あなたの姓",
    "first_name": "あなたの名",
    ...
  },
  "address": {
    "postal_code": "150-0001",
    "prefecture": "東京都",
    "city": "渋谷区",
    ...
  }
}
```

**重要**: `user_profile.json` は `.gitignore` で除外されています。絶対にGitにコミットしないでください。

---

## Step 5: 動作確認

```bash
python3 scripts/check_subsidies.py
```

申請可能な給付金の一覧が表示されれば成功です。

---

## Step 6: Claude Codeで申請を実行

```bash
# kyufu-agentディレクトリでClaude Codeを起動
cd snsauto2/kyufu-agent
claude
```

Claude Codeが起動したら、以下のコマンドを入力:

```
/check-subsidies
```

申請可能な給付金が表示されます。申請したい場合:

```
/apply-subsidy helmet_shibuya
```

---

## Playwright MCPの動作確認

Claude Codeで以下を実行して、ブラウザ操作が動作するか確認:

```
Playwright MCPを使って https://www.google.co.jp を開いて、スクリーンショットを撮ってください
```

ブラウザが起動してスクリーンショットが保存されれば、Playwright MCPが正常に動作しています。

---

## トラブルシューティング

### Playwright MCPが動作しない場合

```bash
# Playwrightのブラウザをインストール
npx playwright install chromium
```

### Python関連のエラー

```bash
pip3 install -r requirements.txt
```

### その他の問題

`docs/TROUBLESHOOTING.md` を参照してください。

---

## セキュリティに関する注意

1. `config/user_profile.json` には個人情報が含まれます
2. このファイルは `.gitignore` で除外されていますが、念のため確認してください
3. マイナンバーは特に慎重に扱ってください
4. 申請後は不要な個人情報ファイルを削除することを推奨します
