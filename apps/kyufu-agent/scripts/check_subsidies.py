#!/usr/bin/env python3
"""
給付金・補助金 申請可能チェックスクリプト
ユーザープロファイルと照合して申請可能な給付金を表示します
"""

import json
import os
from datetime import datetime, date
from pathlib import Path

# パス設定
BASE_DIR = Path(__file__).parent.parent
CONFIG_DIR = BASE_DIR / "config"
SUBSIDIES_FILE = CONFIG_DIR / "subsidies.json"
USER_PROFILE_FILE = CONFIG_DIR / "user_profile.json"


def load_json(filepath: Path) -> dict:
    """JSONファイルを読み込む"""
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def calculate_age(birth_date_str: str) -> int:
    """生年月日から年齢を計算"""
    birth_date = datetime.strptime(birth_date_str, "%Y-%m-%d").date()
    today = date.today()
    age = today.year - birth_date.year
    if (today.month, today.day) < (birth_date.month, birth_date.day):
        age -= 1
    return age


def check_eligibility(subsidy: dict, profile: dict) -> tuple[bool, list[str]]:
    """
    給付金の申請資格を確認する
    Returns: (eligible: bool, reasons: list[str])
    """
    eligible = True
    reasons = []
    requirements = subsidy.get("requirements", [])
    
    for req in requirements:
        if "東京都在住" in req:
            if profile.get("address", {}).get("prefecture") != "東京都":
                eligible = False
                reasons.append("東京都在住が条件です")
        
        elif "渋谷区在住" in req:
            if profile.get("address", {}).get("city") != "渋谷区":
                eligible = False
                reasons.append("渋谷区在住が条件です（他の区市町村でも類似制度がある場合があります）")
        
        elif "0〜18歳の子供がいる" in req:
            children = profile.get("family", {}).get("children", [])
            has_eligible_child = False
            for child in children:
                age = calculate_age(child.get("birth_date", "2000-01-01"))
                if 0 <= age <= 18:
                    has_eligible_child = True
                    break
            if not has_eligible_child:
                eligible = False
                reasons.append("0〜18歳の子供がいることが条件です")
        
        elif "妊娠届または出生届を提出済み" in req:
            children = profile.get("family", {}).get("children", [])
            if not children:
                eligible = False
                reasons.append("妊娠中または出産後の方が対象です")
        
        elif "65歳以上" in req:
            age = calculate_age(profile.get("personal", {}).get("birth_date", "2000-01-01"))
            if age < 65:
                eligible = False
                reasons.append("65歳以上が条件です")
        
        elif "東京23区在住または通勤" in req:
            city = profile.get("address", {}).get("city", "")
            # 23区の判定（簡易版）
            tokyo_23_wards = [
                "千代田区", "中央区", "港区", "新宿区", "文京区", "台東区",
                "墨田区", "江東区", "品川区", "目黒区", "大田区", "世田谷区",
                "渋谷区", "中野区", "杉並区", "豊島区", "北区", "荒川区",
                "板橋区", "練馬区", "足立区", "葛飾区", "江戸川区"
            ]
            if city not in tokyo_23_wards:
                eligible = False
                reasons.append("東京23区在住または通勤が条件です（地方移住支援金）")
        
        elif "高校生がいる" in req:
            children = profile.get("family", {}).get("children", [])
            has_high_schooler = False
            for child in children:
                age = calculate_age(child.get("birth_date", "2000-01-01"))
                if 15 <= age <= 18:
                    has_high_schooler = True
                    break
            if not has_high_schooler:
                eligible = False
                reasons.append("高校生（15〜18歳）の子供がいることが条件です")
        
        elif "中学校修了前の子供がいる" in req:
            children = profile.get("family", {}).get("children", [])
            has_eligible_child = False
            for child in children:
                age = calculate_age(child.get("birth_date", "2000-01-01"))
                if age <= 15:
                    has_eligible_child = True
                    break
            if not has_eligible_child:
                eligible = False
                reasons.append("中学校修了前（15歳以下）の子供がいることが条件です")
    
    return eligible, reasons


def format_amount(subsidy: dict) -> str:
    """金額を整形して表示"""
    amount = subsidy.get("amount", 0)
    note = subsidy.get("amount_note", "")
    if note:
        return f"最大 {amount:,}円 ({note})"
    return f"{amount:,}円"


def print_subsidy_list(subsidies: list, title: str):
    """給付金リストを表示"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")
    
    if not subsidies:
        print("  該当する給付金はありません")
        return
    
    for i, (subsidy, reasons) in enumerate(subsidies, 1):
        auto = "✅ 自動申請可" if subsidy.get("auto_apply_possible") else "⚠️  要手続き"
        print(f"\n{i}. {subsidy['name']}")
        print(f"   金額: {format_amount(subsidy)}")
        print(f"   カテゴリ: {subsidy['category']}")
        print(f"   申請: {auto}")
        print(f"   ID: {subsidy['id']}")
        if reasons:
            print(f"   注意: {', '.join(reasons)}")
        if subsidy.get("notes"):
            print(f"   備考: {subsidy['notes']}")


def main():
    print("\n🏛️  給付金・補助金 申請可能チェッカー")
    print("   東京都在住者向け 自動申請エージェント")
    
    # ファイル存在チェック
    if not SUBSIDIES_FILE.exists():
        print(f"❌ エラー: {SUBSIDIES_FILE} が見つかりません")
        return
    
    if not USER_PROFILE_FILE.exists():
        print(f"\n⚠️  ユーザープロファイルが設定されていません")
        print(f"   {CONFIG_DIR}/user_profile.example.json をコピーして")
        print(f"   {CONFIG_DIR}/user_profile.json を作成してください")
        print(f"\n全給付金リストを表示します（資格確認なし）:")
        
        data = load_json(SUBSIDIES_FILE)
        for subsidy in data["subsidies"]:
            auto = "✅ 自動申請可" if subsidy.get("auto_apply_possible") else "⚠️  要手続き"
            print(f"\n  • {subsidy['name']}")
            print(f"    金額: {format_amount(subsidy)}")
            print(f"    申請: {auto} | ID: {subsidy['id']}")
        return
    
    # データ読み込み
    subsidies_data = load_json(SUBSIDIES_FILE)
    profile = load_json(USER_PROFILE_FILE)
    
    # 申請済みリスト
    applied = profile.get("applied_subsidies", {}).get("completed", [])
    in_progress = profile.get("applied_subsidies", {}).get("in_progress", [])
    
    # 資格チェック
    eligible_auto = []      # 自動申請可能
    eligible_manual = []    # 手動申請が必要
    not_eligible = []       # 対象外
    already_applied = []    # 申請済み
    
    for subsidy in subsidies_data["subsidies"]:
        subsidy_id = subsidy["id"]
        
        # 申請済みチェック
        if subsidy_id in applied:
            already_applied.append((subsidy, ["申請済み"]))
            continue
        if subsidy_id in in_progress:
            already_applied.append((subsidy, ["申請中"]))
            continue
        
        # 資格チェック
        eligible, reasons = check_eligibility(subsidy, profile)
        
        if eligible:
            if subsidy.get("auto_apply_possible"):
                eligible_auto.append((subsidy, []))
            else:
                eligible_manual.append((subsidy, [subsidy.get("reason_not_auto", "手動申請が必要")]))
        else:
            not_eligible.append((subsidy, reasons))
    
    # 結果表示
    name = profile.get("personal", {}).get("last_name", "") + profile.get("personal", {}).get("first_name", "")
    print(f"\n👤 対象者: {name} 様")
    print(f"📍 住所: {profile.get('address', {}).get('prefecture', '')} {profile.get('address', {}).get('city', '')}")
    
    total_auto = sum(s.get("amount", 0) for s, _ in eligible_auto)
    total_manual = sum(s.get("amount", 0) for s, _ in eligible_manual)
    
    print(f"\n💰 申請可能な給付金の合計:")
    print(f"   自動申請可能: {len(eligible_auto)}件 (最大 {total_auto:,}円)")
    print(f"   手動申請必要: {len(eligible_manual)}件 (最大 {total_manual:,}円)")
    print(f"   合計最大: {total_auto + total_manual:,}円")
    
    print_subsidy_list(eligible_auto, "✅ 自動申請可能な給付金")
    print_subsidy_list(eligible_manual, "⚠️  手動申請が必要な給付金")
    
    if not_eligible:
        print(f"\n{'='*60}")
        print(f"  ℹ️  現在対象外の給付金 ({len(not_eligible)}件)")
        print(f"{'='*60}")
        for subsidy, reasons in not_eligible:
            print(f"  • {subsidy['name']}: {', '.join(reasons)}")
    
    if already_applied:
        print(f"\n{'='*60}")
        print(f"  📋 申請済み・申請中の給付金 ({len(already_applied)}件)")
        print(f"{'='*60}")
        for subsidy, reasons in already_applied:
            print(f"  • {subsidy['name']}: {reasons[0]}")
    
    print(f"\n{'='*60}")
    print("  自動申請を実行するには:")
    print("  python3 scripts/apply_subsidy.py [subsidy_id]")
    print("  または Claude Code で: /apply-subsidy [subsidy_id]")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
