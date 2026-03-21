#!/usr/bin/env python3
"""
Retail price fetcher v2 for kaitori-hikaku products.
Improved version with:
  - Rakuten API (primary source, most reliable)
  - Amazon scraping with validation
  - Price validation to reject bad data
  - Estimation from buyback ratios (fallback)

Usage:
  python scripts/fetch-retail-prices-v2.py             # Full run
  python scripts/fetch-retail-prices-v2.py --test 10    # Test with 10 products
  python scripts/fetch-retail-prices-v2.py --start 200  # Start from product #200
"""

import json
import re
import time
import os
import sys
import ssl
import urllib.parse
import urllib.request
from pathlib import Path

# Fix Windows console encoding
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

# Configuration
PRODUCTS_JSON = Path(__file__).parent.parent / "data" / "json" / "products.json"
OUTPUT_FILE = Path(__file__).parent.parent / "data" / "json" / "retail_prices_found.json"
LOG_DIR = Path(__file__).parent.parent / "logs"
DELAY_BETWEEN_REQUESTS = 1.5  # seconds (rakuten limit: 1 req/sec)
MAX_PRODUCTS = 2000

# Load environment variables from .env
def load_env():
    """Load .env file from multiple possible locations."""
    env_paths = [
        Path(__file__).parent.parent / ".env",
        Path(__file__).parent.parent.parent / ".env",
        Path.home() / ".env",
    ]
    for env_path in env_paths:
        if env_path.exists():
            with open(env_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        os.environ.setdefault(key.strip(), value.strip())
            print(f"  .env loaded from: {env_path}")
            return True
    return False

# User-Agent rotation
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
]
_agent_idx = 0

def get_headers():
    global _agent_idx
    _agent_idx = (_agent_idx + 1) % len(USER_AGENTS)
    return {
        "User-Agent": USER_AGENTS[_agent_idx],
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ja,en;q=0.9",
    }


# ============================================================
# Price Validation
# ============================================================

def validate_price(retail_price: int, buyback_price: int, category: str = "") -> bool:
    """Validate that a retail price makes sense relative to buyback price."""
    if not retail_price or retail_price <= 0:
        return False
    if not buyback_price or buyback_price <= 0:
        return retail_price > 1000  # At least reasonable

    # Buyback should never exceed retail price
    if buyback_price > retail_price:
        return False

    return_rate = buyback_price / retail_price

    # Return rate > 95% = suspicious (buyback almost equals retail)
    if return_rate > 0.95:
        return False

    # Return rate < 10% = suspicious (retail way too high)
    if return_rate < 0.10:
        return False

    return True


# ============================================================
# Source 1: Yahoo! Shopping Search (Primary - No API key needed)
# ============================================================

def search_yahoo(jan_code: str, buyback_price: int) -> int | None:
    """Search Yahoo! Shopping for retail price by JAN code."""
    try:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        url = f"https://shopping.yahoo.co.jp/search?p={jan_code}"
        req = urllib.request.Request(url, headers=get_headers())
        with urllib.request.urlopen(req, timeout=15, context=ctx) as response:
            html = response.read().decode("utf-8", errors="ignore")

        # Extract prices from Yahoo Shopping results
        prices = re.findall(r'([\d,]+)\s*円', html)
        valid = []
        for p in prices:
            price = int(p.replace(",", ""))
            if 1000 < price < 10000000:
                valid.append(price)

        if not valid:
            return None

        # Filter by validation
        validated = [p for p in valid if validate_price(p, buyback_price)]
        if not validated:
            return None

        # Return median price (most representative)
        validated.sort()
        return validated[len(validated) // 2]

    except Exception as e:
        print(f"    Yahoo error: {e}", file=sys.stderr)
        return None


# ============================================================
# Source 2: Amazon Search (with validation)
# ============================================================

def search_amazon(jan_code: str, buyback_price: int) -> int | None:
    """Search Amazon.co.jp for price with validation."""
    try:
        # Create SSL context that doesn't verify (for Windows compatibility)
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        url = f"https://www.amazon.co.jp/s?k={jan_code}"
        req = urllib.request.Request(url, headers=get_headers())
        with urllib.request.urlopen(req, timeout=15, context=ctx) as response:
            html = response.read().decode("utf-8", errors="ignore")

        # Check for used/parts indicators - skip if found prominently
        used_indicators = ["中古", "部品", "パーツ", "ジャンク", "訳あり", "難あり"]

        # Amazon price patterns (prefer whole price display)
        patterns = [
            r'a-price-whole["\s>]*([\d,]+)',
            r'a-offscreen["\s>]*[¥￥]([\d,]+)',
            r'a-color-price["\s>]*[¥￥]\s*([\d,]+)',
        ]

        candidates = []
        for pattern in patterns:
            for match in re.finditer(pattern, html):
                price = int(match.group(1).replace(",", ""))
                if 1000 < price < 10000000:
                    # Check surrounding context for used/parts indicators
                    start = max(0, match.start() - 200)
                    end = min(len(html), match.end() + 200)
                    context = html[start:end]

                    is_used = any(indicator in context for indicator in used_indicators)
                    if not is_used:
                        candidates.append(price)

        if not candidates:
            return None

        # Filter candidates: must be reasonable relative to buyback price
        valid_prices = []
        for price in candidates:
            if validate_price(price, buyback_price):
                valid_prices.append(price)

        if not valid_prices:
            return None

        # Return median price to avoid outliers
        valid_prices.sort()
        return valid_prices[len(valid_prices) // 2]

    except Exception as e:
        print(f"    Amazon error: {e}", file=sys.stderr)
        return None


# ============================================================
# Source 3: Google Search (with SSL fix)
# ============================================================

def search_google(jan_code: str, product_name: str, buyback_price: int) -> int | None:
    """Search Google for retail price with SSL fix."""
    try:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        query = urllib.parse.quote(f"{jan_code} 定価 メーカー希望小売価格")
        url = f"https://www.google.com/search?q={query}&hl=ja"

        req = urllib.request.Request(url, headers=get_headers())
        with urllib.request.urlopen(req, timeout=20, context=ctx) as response:
            html = response.read().decode("utf-8", errors="ignore")

        price = extract_price_from_text(html)
        if price and validate_price(price, buyback_price):
            return price

        # Fallback: search with product name
        short_name = product_name[:40]
        query2 = urllib.parse.quote(f"{short_name} 定価")
        url2 = f"https://www.google.com/search?q={query2}&hl=ja"

        req2 = urllib.request.Request(url2, headers=get_headers())
        with urllib.request.urlopen(req2, timeout=20, context=ctx) as response:
            html2 = response.read().decode("utf-8", errors="ignore")

        price2 = extract_price_from_text(html2)
        if price2 and validate_price(price2, buyback_price):
            return price2

        return None
    except Exception as e:
        print(f"    Google error: {e}", file=sys.stderr)
        return None


def extract_price_from_text(text: str) -> int | None:
    """Extract a price value from Japanese text."""
    patterns = [
        r'(?:定価|希望小売価格|メーカー希望小売価格|参考価格|税込価格)[：:\s]*[¥￥]?\s*([\d,]+)\s*円',
        r'(?:定価|希望小売価格|メーカー希望小売価格|参考価格)[：:\s]*[¥￥]\s*([\d,]+)',
        r'[¥￥]\s*([\d,]+)\s*[\(（]税込[\)）]',
        r'([\d,]+)\s*円\s*[\(（]税込[\)）]',
        r'価格[：:\s]*[¥￥]?\s*([\d,]+)\s*円',
    ]

    for pattern in patterns:
        matches = re.findall(pattern, text)
        for match in matches:
            price = int(match.replace(",", ""))
            if 1000 < price < 10000000:
                return price
    return None


# ============================================================
# Source 4: Estimation from buyback price (last resort)
# ============================================================

def estimate_retail_from_buyback(buyback_price: int, category: str) -> int | None:
    """Estimate retail price from buyback price using typical ratios."""
    ratios = {
        "PS5": 0.65, "Nintendo Switch": 0.60, "Xbox": 0.55,
        "PC": 0.45, "PC周辺機器": 0.40,
        "オーディオ": 0.45, "レコーダー/テレビ": 0.50,
        "美容家電": 0.50, "調理家電": 0.50, "掃除機": 0.45,
        "時計": 0.50, "シェーバー": 0.50,
        "季節・空調家電": 0.45, "ゴルフ": 0.50,
        "アウトドア": 0.45, "電動歯ブラシ": 0.50,
        "その他家電": 0.45, "その他": 0.45,
    }
    if buyback_price <= 0:
        return None
    ratio = ratios.get(category, 0.45)
    estimated = int(buyback_price / ratio)
    return round(estimated / 100) * 100


# ============================================================
# Main
# ============================================================

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Fetch retail prices v2")
    parser.add_argument("--test", type=int, default=0, help="Test with N products")
    parser.add_argument("--start", type=int, default=0, help="Start from product #N")
    parser.add_argument("--no-estimate", action="store_true", help="Skip estimation fallback")
    args = parser.parse_args()

    print("========================================")
    print("  買取比較くん - 定価取得 v2")
    print("========================================\n")

    # Load env
    load_env()
    print("  ✓ Yahoo!ショッピング検索: 有効（APIキー不要）")
    print("  ✓ Amazon検索: 有効（バリデーション付き）")
    print("  ✓ 推定値: 有効（買取価格から逆算）")

    print()

    # Load products
    with open(PRODUCTS_JSON, "r", encoding="utf-8") as f:
        products = json.load(f)

    # Filter products without retail price
    null_products = [p for p in products if p.get("retail_price") is None]
    null_products.sort(key=lambda x: x.get("buyback_price", 0) or 0, reverse=True)

    print(f"  対象商品数: {len(null_products)}")

    # Apply start offset
    if args.start > 0:
        null_products = null_products[args.start:]
        print(f"  開始位置: #{args.start}")

    # Apply test limit
    max_count = args.test if args.test > 0 else MAX_PRODUCTS
    print(f"  処理件数: {min(len(null_products), max_count)}")
    print()

    # Load previously found prices
    found_prices = {}
    if OUTPUT_FILE.exists():
        with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
            found_prices = json.load(f)
        print(f"  既存データ: {len(found_prices)}件")

    # Ensure log directory exists
    LOG_DIR.mkdir(exist_ok=True)

    # Stats
    stats = {"yahoo": 0, "amazon": 0, "google": 0, "estimated": 0, "failed": 0, "skipped": 0}
    new_found = 0

    print("\n--- 処理開始 ---\n")

    for i, product in enumerate(null_products[:max_count]):
        jan = product.get("jan_code", "")
        if not jan:
            stats["skipped"] += 1
            continue

        # Skip already found
        if jan in found_prices:
            stats["skipped"] += 1
            continue

        name = product.get("name", "")
        bp = product.get("buyback_price", 0) or 0
        category = product.get("category", "")

        print(f"[{i+1}/{min(len(null_products), max_count)}] {name[:55]}")
        print(f"  JAN: {jan}, 買取: {bp:,}円, カテゴリ: {category}")

        price = None
        source = ""

        # 1. Yahoo! Shopping (primary)
        price = search_yahoo(jan, bp)
        if price and validate_price(price, bp, category):
            source = "yahoo"
            print(f"  ✓ Yahoo: {price:,}円")
        else:
            price = None
        time.sleep(DELAY_BETWEEN_REQUESTS)

        # 2. Amazon (with validation)
        if not price:
            price = search_amazon(jan, bp)
            if price and validate_price(price, bp, category):
                source = "amazon"
                print(f"  ✓ Amazon: {price:,}円")
            else:
                price = None
            time.sleep(DELAY_BETWEEN_REQUESTS)

        # 3. Google (with SSL fix)
        if not price:
            price = search_google(jan, name, bp)
            if price:
                source = "google"
                print(f"  ✓ Google: {price:,}円")
            time.sleep(DELAY_BETWEEN_REQUESTS)

        # 4. Estimation (fallback)
        if not price and not args.no_estimate and bp > 0:
            price = estimate_retail_from_buyback(bp, category)
            if price:
                source = "estimated"
                print(f"  ~ 推定: {price:,}円 (買取比率から逆算)")

        # Save result
        if price and source:
            found_prices[jan] = {
                "retail_price": price,
                "source": source,
                "product_name": name[:80],
            }
            new_found += 1
            stats[source] = stats.get(source, 0) + 1
        else:
            stats["failed"] += 1
            print(f"  ✗ 取得失敗")

        # Periodic save (every 20 products)
        if (i + 1) % 20 == 0:
            with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
                json.dump(found_prices, f, ensure_ascii=False, indent=2)
            print(f"\n  💾 保存完了 ({len(found_prices)}件)\n")

    # Final save
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(found_prices, f, ensure_ascii=False, indent=2)

    # Summary
    print("\n========================================")
    print("  結果サマリー")
    print("========================================")
    print(f"  新規取得: {new_found}件")
    print(f"  合計保存: {len(found_prices)}件")
    print(f"  スキップ: {stats['skipped']}件")
    print(f"  失敗: {stats['failed']}件")
    print(f"\n  ソース別:")
    print(f"    Yahoo:  {stats['yahoo']}件")
    print(f"    Amazon: {stats['amazon']}件")
    print(f"    Google: {stats['google']}件")
    print(f"    推定:   {stats['estimated']}件")
    print(f"\n  出力: {OUTPUT_FILE}")
    print("========================================\n")
    print("次のステップ:")
    print("  npm run merge-prices")


if __name__ == "__main__":
    main()
