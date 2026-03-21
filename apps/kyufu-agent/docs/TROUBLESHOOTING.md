# トラブルシューティング

## よくある問題と解決方法

### Playwright MCPが認識されない

**症状**: Claude Codeでブラウザ操作ができない

**解決方法**:

```bash
# MCPの再インストール
claude mcp remove playwright
claude mcp add playwright npx @playwright/mcp@latest

# Playwrightのブラウザをインストール
npx playwright install chromium

# 設定確認
claude mcp list
```

---

### フォームの自動入力が失敗する

**症状**: フォームのフィールドが見つからない、または入力できない

**原因と対策**:

申請サイトがJavaScriptで動的に生成されている場合、ページの読み込み完了を待つ必要があります。Claude Codeに以下のように指示してください：

> 「ページが完全に読み込まれるまで3秒待ってから、フォームに入力してください」

---

### 申請サイトにCAPTCHAがある

**症状**: ロボット認証（CAPTCHA）が表示されて自動申請できない

**対策**: CAPTCHAが表示された場合は、自動申請を一時停止してユーザーに手動での解決を求めます。Claude Codeが自動的に判断して通知します。

---

### ログインが必要な申請サイト

**症状**: 申請前にアカウント登録・ログインが必要

**対策**: 初回のみ手動でアカウントを作成し、ログイン情報を `config/user_profile.json` に追加してください：

```json
{
  "accounts": {
    "018support": {
      "email": "your@email.com",
      "password": "your_password"
    }
  }
}
```

**注意**: パスワードは平文で保存されます。セキュリティに注意してください。

---

### 申請が途中で止まった

**症状**: 申請フォームの途中でエラーが発生した

**対策**:

1. `logs/application_log.json` で申請状況を確認
2. 申請が完了しているか、各サイトで直接確認
3. 未完了の場合は、手動で申請を完了させる

---

### Python スクリプトのエラー

**症状**: `check_subsidies.py` や `apply_subsidy.py` でエラーが発生

**解決方法**:

```bash
# Python バージョン確認
python3 --version  # 3.9以上が必要

# 依存パッケージのインストール
pip3 install -r requirements.txt

# ファイルの存在確認
ls config/user_profile.json
ls config/subsidies.json
```

---

## 申請サイト別の注意事項

### 018サポート（東京都）

- マイナンバーカードまたは本人確認書類2点が必要
- 子供の証明書類（健康保険証等）も必要
- 申請後、審査に数週間かかる場合がある

### 渋谷区 自転車ヘルメット補助

- 渋谷区公式LINEへの友だち登録が必要
- 身分証明書の写真撮影・アップロードが必要
- 承認後、事業協力店でのみ使用可能

### 赤ちゃんファースト

- 妊娠届・出生届の提出が前提
- 区市町村の窓口で案内を受けてから申請
- ギフトカタログ形式のため、現金振込ではない

---

## サポート

問題が解決しない場合は、GitHubのIssueに報告してください：
https://github.com/ikedachiin-maker/snsauto2/issues
