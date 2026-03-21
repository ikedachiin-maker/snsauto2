#!/usr/bin/env python3
"""
給付金・補助金 自動申請スクリプト
Claude Code + Playwright MCP を使ってブラウザ操作で申請を自動化します

使い方:
  python3 scripts/apply_subsidy.py [subsidy_id]
  
  例:
  python3 scripts/apply_subsidy.py helmet_shibuya
  python3 scripts/apply_subsidy.py 018support

注意:
  このスクリプトはClaude Code環境（Playwright MCP設定済み）で実行してください。
  単体実行の場合は、ブラウザ操作の指示書を出力します。
"""

import json
import sys
import os
from pathlib import Path
from datetime import datetime

# パス設定
BASE_DIR = Path(__file__).parent.parent
CONFIG_DIR = BASE_DIR / "config"
SUBSIDIES_FILE = CONFIG_DIR / "subsidies.json"
USER_PROFILE_FILE = CONFIG_DIR / "user_profile.json"
LOGS_DIR = BASE_DIR / "logs"
SCREENSHOTS_DIR = BASE_DIR / "screenshots"


def load_json(filepath: Path) -> dict:
    """JSONファイルを読み込む"""
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(filepath: Path, data: dict):
    """JSONファイルを保存する"""
    filepath.parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def get_subsidy_by_id(subsidies_data: dict, subsidy_id: str) -> dict | None:
    """IDで給付金情報を取得"""
    for subsidy in subsidies_data["subsidies"]:
        if subsidy["id"] == subsidy_id:
            return subsidy
    return None


def generate_application_instructions(subsidy: dict, profile: dict) -> str:
    """
    Claude Code（Playwright MCP）向けの申請手順を生成する
    これをClaude Codeに渡すことで自動申請が実行される
    """
    
    personal = profile.get("personal", {})
    address = profile.get("address", {})
    bank = profile.get("bank_account", {})
    
    full_name = f"{personal.get('last_name', '')} {personal.get('first_name', '')}"
    full_name_kana = f"{personal.get('last_name_kana', '')} {personal.get('first_name_kana', '')}"
    full_address = f"{address.get('postal_code', '')} {address.get('prefecture', '')}{address.get('city', '')}{address.get('town', '')}{address.get('block', '')}{address.get('building', '')}"
    
    instructions = f"""
# 給付金自動申請指示書
## 対象: {subsidy['name']}
## 申請URL: {subsidy['application_url']}
## 申請方法: {subsidy['application_method']}

---

## ユーザー情報（フォーム入力用）

| 項目 | 値 |
|------|-----|
| 氏名 | {full_name} |
| 氏名（カナ） | {full_name_kana} |
| 生年月日 | {personal.get('birth_date', '')} |
| 電話番号 | {personal.get('phone', '')} |
| メールアドレス | {personal.get('email', '')} |
| 郵便番号 | {address.get('postal_code', '')} |
| 住所 | {full_address} |
| 銀行名 | {bank.get('bank_name', '')} |
| 支店名 | {bank.get('branch_name', '')} |
| 口座種別 | {bank.get('account_type', '')} |
| 口座番号 | {bank.get('account_number', '')} |
| 口座名義 | {bank.get('account_holder', '')} |

---

## Playwright MCPによる申請手順

"""
    
    # 申請方法別の手順を生成
    method = subsidy.get("application_method", "")
    
    if method == "web" or method == "web_form" or method == "web_or_window":
        instructions += f"""
### ステップ1: 申請ページにアクセス
- URL: {subsidy['application_url']} を開く
- ページが完全に読み込まれるまで待機

### ステップ2: 申請フォームを探す
- 「新規申請」「申請する」「申請はこちら」などのボタンを探してクリック
- ログインが必要な場合は、メールアドレス {personal.get('email', '')} で登録

### ステップ3: フォームに情報を入力
以下の情報を対応するフィールドに入力してください：
- 氏名: {full_name}
- 氏名（フリガナ）: {full_name_kana}
- 生年月日: {personal.get('birth_date', '')}
- 電話番号: {personal.get('phone', '')}
- メールアドレス: {personal.get('email', '')}
- 郵便番号: {address.get('postal_code', '')}（入力後、住所自動補完があれば利用）
- 都道府県: {address.get('prefecture', '')}
- 市区町村: {address.get('city', '')}
- 番地以降: {address.get('town', '')}{address.get('block', '')}{address.get('building', '')}

### ステップ4: 振込口座情報を入力（必要な場合）
- 銀行名: {bank.get('bank_name', '')}
- 支店名: {bank.get('branch_name', '')}
- 口座種別: {bank.get('account_type', '')}
- 口座番号: {bank.get('account_number', '')}
- 口座名義（カナ）: {bank.get('account_holder', '')}

### ステップ5: 確認・送信
- 入力内容を確認する
- スクリーンショットを撮影して保存（screenshots/ フォルダに保存）
- ユーザーに確認を求める
- 承認後、送信ボタンをクリック

### ステップ6: 完了確認
- 申請完了画面のスクリーンショットを保存
- 受付番号や確認メールの情報を記録
"""
    
    elif method == "LINE_form":
        instructions += f"""
### ステップ1: LINEアカウントにアクセス
- 渋谷区公式LINE (@shibuyacity) を開く
- または申請ページ {subsidy['application_url']} からQRコードを確認

### ステップ2: LINE申請フォームに入力
- LINEのメッセージ画面から申請フォームにアクセス
- 氏名: {full_name}
- 住所: {full_address}
- 身分証明書の画像をアップロード（マイナンバーカードまたは運転免許証）

### ステップ3: 申請完了確認
- 承認通知が届くまで待機（数日かかる場合あり）
- 承認後、事業協力店でヘルメット購入時に承認通知を提示
"""
    
    elif method == "jgrants_web":
        instructions += f"""
### ステップ1: jGrants（Jグランツ）にアクセス
- URL: https://jgrants.go.jp/ を開く
- GビズIDでログイン（未登録の場合は事前登録が必要）

### ステップ2: 補助金を検索
- 「東京ゼロエミ住宅」で検索
- 対象の補助金を選択

### ステップ3: 申請書類を準備・入力
- 住宅の設計図書
- 省エネ性能を示す書類
- 申請者情報を入力

注意: この申請は着工前に行う必要があります。
"""
    
    instructions += f"""
---

## 申請後の記録

申請が完了したら、以下の情報を記録してください：
- 申請日時: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
- 申請ID: {subsidy['id']}
- 受付番号: [申請完了後に記録]
- 確認メール: [受信後に記録]

この情報は `config/user_profile.json` の `applied_subsidies.in_progress` に追加してください。
"""
    
    return instructions


def log_application(subsidy_id: str, status: str, notes: str = ""):
    """申請ログを記録"""
    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    log_file = LOGS_DIR / "application_log.json"
    
    logs = []
    if log_file.exists():
        logs = load_json(log_file)
    
    logs.append({
        "timestamp": datetime.now().isoformat(),
        "subsidy_id": subsidy_id,
        "status": status,
        "notes": notes
    })
    
    save_json(log_file, logs)


def main():
    if len(sys.argv) < 2:
        print("使い方: python3 apply_subsidy.py [subsidy_id]")
        print("\n利用可能なsubsidy_id:")
        
        if SUBSIDIES_FILE.exists():
            data = load_json(SUBSIDIES_FILE)
            for s in data["subsidies"]:
                auto = "✅" if s.get("auto_apply_possible") else "⚠️"
                print(f"  {auto} {s['id']:30} {s['name']}")
        return
    
    subsidy_id = sys.argv[1]
    
    # ファイル存在チェック
    if not SUBSIDIES_FILE.exists():
        print(f"❌ エラー: {SUBSIDIES_FILE} が見つかりません")
        return
    
    if not USER_PROFILE_FILE.exists():
        print(f"❌ エラー: {USER_PROFILE_FILE} が見つかりません")
        print(f"   {CONFIG_DIR}/user_profile.example.json をコピーして作成してください")
        return
    
    # データ読み込み
    subsidies_data = load_json(SUBSIDIES_FILE)
    profile = load_json(USER_PROFILE_FILE)
    
    # 給付金情報を取得
    subsidy = get_subsidy_by_id(subsidies_data, subsidy_id)
    if not subsidy:
        print(f"❌ エラー: subsidy_id '{subsidy_id}' が見つかりません")
        return
    
    # 自動申請可能かチェック
    if not subsidy.get("auto_apply_possible"):
        print(f"⚠️  {subsidy['name']} は自動申請に対応していません")
        print(f"   理由: {subsidy.get('reason_not_auto', '手動申請が必要')}")
        print(f"   申請URL: {subsidy['application_url']}")
        return
    
    # 申請手順を生成
    print(f"\n🚀 {subsidy['name']} の自動申請を開始します")
    print(f"   金額: {subsidy.get('amount', 0):,}円")
    print(f"   申請URL: {subsidy['application_url']}")
    
    instructions = generate_application_instructions(subsidy, profile)
    
    # 指示書を保存
    instructions_file = BASE_DIR / f"apply_{subsidy_id}_instructions.md"
    with open(instructions_file, "w", encoding="utf-8") as f:
        f.write(instructions)
    
    print(f"\n📋 申請手順書を生成しました: {instructions_file}")
    print("\n" + "="*60)
    print(instructions)
    print("="*60)
    
    # ログ記録
    log_application(subsidy_id, "instructions_generated")
    
    print(f"\n✅ Claude Code（Playwright MCP）で上記の手順を実行してください")
    print(f"   または: /apply-subsidy {subsidy_id} とClaude Codeに指示してください")


if __name__ == "__main__":
    main()
