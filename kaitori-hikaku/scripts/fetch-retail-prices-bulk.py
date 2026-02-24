#!/usr/bin/env python3
"""
Bulk retail price fetcher for kaitori-hikaku products.
Uses multiple sources to find retail prices (定価) for products by JAN code.
Sources: Google Shopping search snippets, kakaku.com, Amazon.co.jp
"""

import json
import re
import time
import os
import sys
import urllib.parse
from pathlib import Path

# Fix Windows console encoding
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

# Configuration
PRODUCTS_JSON = Path(__file__).parent.parent / "data" / "json" / "products.json"
OUTPUT_FILE = Path(__file__).parent.parent / "data" / "json" / "retail_prices_found.json"
DELAY_BETWEEN_REQUESTS = 2.0  # seconds
MAX_PRODUCTS = 2000  # max products to process
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "ja,en;q=0.9",
}

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
            if 1000 < price < 10000000:  # reasonable price range
                return price
    return None


def search_google_for_price(jan_code: str, product_name: str) -> int | None:
    """Search Google for the retail price using JAN code."""
    try:
        import urllib.request

        # Search with JAN code + 定価
        query = urllib.parse.quote(f"{jan_code} 定価 メーカー希望小売価格")
        url = f"https://www.google.com/search?q={query}&hl=ja"

        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=10) as response:
            html = response.read().decode("utf-8", errors="ignore")

        price = extract_price_from_text(html)
        if price:
            return price

        # Fallback: search with product name
        short_name = product_name[:50]
        query2 = urllib.parse.quote(f"{short_name} 定価")
        url2 = f"https://www.google.com/search?q={query2}&hl=ja"

        req2 = urllib.request.Request(url2, headers=HEADERS)
        with urllib.request.urlopen(req2, timeout=10) as response:
            html2 = response.read().decode("utf-8", errors="ignore")

        return extract_price_from_text(html2)
    except Exception as e:
        print(f"  Google search error: {e}", file=sys.stderr)
        return None


def search_kakaku_for_price(jan_code: str) -> int | None:
    """Search kakaku.com for the retail price."""
    try:
        import urllib.request

        url = f"https://kakaku.com/search_results/{jan_code}/"
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=10) as response:
            html = response.read().decode("utf-8", errors="ignore")

        # Look for メーカー希望小売価格 on kakaku.com
        price = extract_price_from_text(html)
        if price:
            return price

        # Look for the lowest price as reference
        price_patterns = [
            r'最安価格[：:\s]*[¥￥]?\s*([\d,]+)',
            r'priceMin["\s:]*(\d+)',
        ]
        for pattern in price_patterns:
            match = re.search(pattern, html)
            if match:
                p = int(match.group(1).replace(",", ""))
                if 1000 < p < 10000000:
                    return p

        return None
    except Exception as e:
        print(f"  Kakaku search error: {e}", file=sys.stderr)
        return None


def search_amazon_for_price(jan_code: str) -> int | None:
    """Search Amazon.co.jp for the price."""
    try:
        import urllib.request

        url = f"https://www.amazon.co.jp/s?k={jan_code}"
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=10) as response:
            html = response.read().decode("utf-8", errors="ignore")

        # Amazon price patterns
        patterns = [
            r'a-price-whole["\s>]*([\d,]+)',
            r'a-offscreen["\s>]*[¥￥]([\d,]+)',
            r'a-color-price["\s>]*[¥￥]\s*([\d,]+)',
        ]
        for pattern in patterns:
            match = re.search(pattern, html)
            if match:
                price = int(match.group(1).replace(",", ""))
                if 1000 < price < 10000000:
                    return price

        return None
    except Exception as e:
        print(f"  Amazon search error: {e}", file=sys.stderr)
        return None


def estimate_retail_from_buyback(buyback_price: int, category: str) -> int | None:
    """Estimate retail price from buyback price using typical ratios."""
    # Typical buyback ratios by category (buyback is typically 30-70% of retail)
    ratios = {
        "PS5": 0.65,
        "Nintendo Switch": 0.60,
        "Xbox": 0.55,
        "PC": 0.45,
        "PC周辺機器": 0.40,
        "オーディオ": 0.45,
        "レコーダー/テレビ": 0.50,
        "美容家電": 0.50,
        "調理家電": 0.50,
        "掃除機": 0.45,
        "時計": 0.50,
        "シェーバー": 0.50,
        "季節・空調家電": 0.45,
        "ゴルフ": 0.50,
        "アウトドア": 0.45,
        "電動歯ブラシ": 0.50,
        "その他家電": 0.45,
        "その他": 0.45,
    }
    ratio = ratios.get(category, 0.45)
    estimated = int(buyback_price / ratio)
    # Round to nearest 100
    return round(estimated / 100) * 100


def main():
    # Load products
    with open(PRODUCTS_JSON, "r", encoding="utf-8") as f:
        products = json.load(f)

    # Filter products without retail price
    null_products = [p for p in products if p.get("retail_price") is None]
    null_products.sort(key=lambda x: x.get("buyback_price", 0) or 0, reverse=True)

    print(f"Total products without retail price: {len(null_products)}")

    # Load previously found prices
    found_prices = {}
    if OUTPUT_FILE.exists():
        with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
            found_prices = json.load(f)
        print(f"Previously found prices: {len(found_prices)}")

    # Process products
    new_found = 0
    errors = 0

    for i, product in enumerate(null_products[:MAX_PRODUCTS]):
        jan = product.get("jan_code", "")
        if not jan or jan in found_prices:
            continue

        name = product.get("name", "")
        bp = product.get("buyback_price", 0)
        category = product.get("category", "")

        print(f"[{i+1}/{min(len(null_products), MAX_PRODUCTS)}] {name[:50]}...")
        print(f"  JAN: {jan}, Buyback: ¥{bp:,}")

        price = None
        source = ""

        # 1. Try Google search
        price = search_google_for_price(jan, name)
        if price:
            source = "google"
            print(f"  ✓ Google: ¥{price:,}")

        # 2. Try kakaku.com
        if not price:
            time.sleep(1)
            price = search_kakaku_for_price(jan)
            if price:
                source = "kakaku"
                print(f"  ✓ Kakaku: ¥{price:,}")

        # 3. Try Amazon
        if not price:
            time.sleep(1)
            price = search_amazon_for_price(jan)
            if price:
                source = "amazon"
                print(f"  ✓ Amazon: ¥{price:,}")

        # 4. Estimate from buyback price
        if not price and bp > 0:
            price = estimate_retail_from_buyback(bp, category)
            source = "estimated"
            print(f"  ~ Estimated: ¥{price:,} (from buyback ratio)")

        if price:
            found_prices[jan] = {
                "retail_price": price,
                "source": source,
                "product_name": name[:80],
            }
            new_found += 1
        else:
            errors += 1
            print(f"  ✗ No price found")

        # Save periodically
        if (i + 1) % 20 == 0:
            with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
                json.dump(found_prices, f, ensure_ascii=False, indent=2)
            print(f"  [Saved {len(found_prices)} prices]")

        time.sleep(DELAY_BETWEEN_REQUESTS)

    # Final save
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(found_prices, f, ensure_ascii=False, indent=2)

    print(f"\n=== Summary ===")
    print(f"New prices found: {new_found}")
    print(f"Total prices saved: {len(found_prices)}")
    print(f"Errors: {errors}")
    print(f"Output: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
