import requests
import json
import os
import time
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urlparse, unquote

CHECKERS_DIR = os.path.join(os.path.dirname(__file__), "checkers_images")
PNP_DIR = os.path.join(os.path.dirname(__file__), "pnp_images")
os.makedirs(CHECKERS_DIR, exist_ok=True)
os.makedirs(PNP_DIR, exist_ok=True)

session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-ZA,en-GB;q=0.9,en;q=0.8",
})

CHECKERS_SEARCH_TERMS = [
    "milk", "bread", "eggs", "butter", "cheese", "yogurt", "chicken", "beef",
    "rice", "pasta", "sugar", "salt", "oil", "coffee", "tea", "juice",
    "apples", "bananas", "potatoes", "onions", "tomatoes", "carrots",
    "cereal", "biscuits", "chips", "chocolate", "soup", "beans",
    "soap", "shampoo", "toothpaste", "detergent", "toilet paper",
    "water", "cold drink", "beer", "wine", "ice cream", "margarine",
    "jam", "peanut butter", "flour", "maize", "cooking oil",
]

PNP_SEARCH_TERMS = [
    "milk", "bread", "eggs", "butter", "cheese", "chicken", "rice",
    "sugar", "coffee", "tea", "apples", "bananas", "potatoes",
    "cereal", "biscuits", "chocolate", "water", "cold drink",
    "soap", "shampoo", "toothpaste", "toilet paper", "detergent",
]

def get_checkers_token():
    try:
        resp = session.post(
            "https://dc-app-backend-for-frontend.sixty60.co.za/api/v1/token/dsl",
            data={"grant_type": "client_credentials", "scope": "profile"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=15,
        )
        resp.raise_for_status()
        return resp.json().get("access_token")
    except Exception as e:
        print(f"  [!] Checkers token error: {e}")
        return None

def get_checkers_store_context(token):
    try:
        resp = session.post(
            "https://catalog.sixty60.co.za/api/v3/store-contexts",
            json={"latitude": -33.9249, "longitude": 18.4241},
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        items = data.get("items", data.get("data", [])) if isinstance(data, dict) else []
        if not items and isinstance(data, list):
            items = data
        return items
    except Exception as e:
        print(f"  [!] Checkers store context error: {e}")
        return []

def search_checkers_products(token, stores, term):
    try:
        store_contexts = []
        for s in stores:
            sid = s.get("storeId") or s.get("id")
            if sid:
                store_contexts.append({"storeId": sid, "deliveryChannel": "PICKUP"})

        resp = session.post(
            "https://catalog.sixty60.co.za/api/v3/products/product-list-page",
            json={
                "filter": {
                    "productListSource": {"search": term},
                    "paginationOptions": {"page": 0, "pageSize": 20},
                },
                "userContext": {"storeContexts": store_contexts}
            },
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        products = []
        if isinstance(data, dict):
            products = data.get("products", data.get("data", []))
        return products
    except Exception as e:
        return []

def download_image(url, folder, filename):
    try:
        resp = session.get(url, timeout=15)
        resp.raise_for_status()
        ext = "jpg"
        ct = resp.headers.get("Content-Type", "")
        if "png" in ct:
            ext = "png"
        elif "webp" in ct:
            ext = "webp"
        elif "jpeg" in ct or "jpg" in ct:
            ext = "jpg"
        filepath = os.path.join(folder, f"{filename}.{ext}")
        with open(filepath, "wb") as f:
            f.write(resp.content)
        return filepath, len(resp.content)
    except Exception as e:
        return None, 0

def scrape_checkers():
    print("=" * 60)
    print("CHECKERS PRODUCT IMAGES")
    print("=" * 60)

    token = get_checkers_token()
    if not token:
        print("  [!] Failed to get Checkers token")
        return 0

    print(f"  [*] Got BFF token")
    stores = get_checkers_store_context(token)
    if not stores:
        print("  [!] Failed to get store contexts, using default")
        stores = [{"storeId": "CT01", "deliveryChannel": "PICKUP"}]
    print(f"  [*] Got {len(stores)} store(s)")

    all_products = []
    seen_ids = set()

    for term in CHECKERS_SEARCH_TERMS:
        print(f"  [*] Searching: {term}")
        products = search_checkers_products(token, stores, term)
        for p in products:
            pid = p.get("id") or p.get("imageId", "")
            if pid not in seen_ids:
                seen_ids.add(pid)
                all_products.append(p)
        print(f"     Found {len(products)} products, total unique: {len(all_products)}")
        time.sleep(0.3)

    print(f"\n  [*] Total unique products found: {len(all_products)}")
    print(f"  [*] Downloading images...")

    downloaded = 0
    failed = 0

    def dl_product(p):
        nonlocal downloaded, failed
        name = p.get("name", "unknown")
        safe_name = re.sub(r'[\\/*?:"<>|]', "", name)[:80]
        image_id = p.get("imageId")
        image_ids = p.get("imageIds", [])

        urls = []
        if image_id:
            urls.append((image_id, f"https://catalog.sixty60.co.za/files/{image_id}"))
        for iid in (image_ids or []):
            if iid != image_id:
                urls.append((iid, f"https://catalog.sixty60.co.za/files/{iid}"))

        results = []
        for iid, url in urls:
            result = download_image(url, CHECKERS_DIR, f"checkers_{iid[:20]}_{safe_name[:40]}")
            if result[0]:
                results.append(result)

        if results:
            return results, safe_name
        return None, safe_name

    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(dl_product, p): p for p in all_products}
        for future in as_completed(futures):
            result, name = future.result()
            if result:
                for fp, size in result:
                    downloaded += 1
                    print(f"     [OK] {os.path.basename(fp)} ({size / 1024:.1f} KB)")
            else:
                failed += 1

    print(f"\n  [*] Checkers done: {downloaded} images downloaded, {failed} failed")
    return downloaded


def search_pnp_products(term):
    try:
        resp = session.get(
            "https://www.pnp.co.za/pnphybris/v2/pnp-spa/products/suggestions",
            params={
                "term": term,
                "maxSuggestions": 5,
                "maxProducts": 10,
                "storeCode": "WC44",
                "lang": "en",
                "curr": "ZAR",
            },
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        products = data.get("products", []) or data.get("suggestions", [])
        return products
    except Exception as e:
        return []

def get_pnp_product_images():
    try:
        resp = session.get(
            "https://www.pnp.co.za/pnphybris/v2/pnp-spa/products",
            params={
                "fields": "products(images(FULL),name,code)",
                "storeCode": "WC44",
                "lang": "en",
                "curr": "ZAR",
            },
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        return data.get("products", [])
    except:
        return []

def scrape_pnp():
    print("\n" + "=" * 60)
    print("PICK N PAY PRODUCT IMAGES")
    print("=" * 60)

    all_products = []
    seen_codes = set()

    for term in PNP_SEARCH_TERMS:
        print(f"  [*] Searching: {term}")
        products = search_pnp_products(term)
        for p in products:
            code = p.get("code") or p.get("name", "")
            if code not in seen_codes:
                seen_codes.add(code)
                all_products.append(p)
        print(f"     Found {len(products)} products, total unique: {len(all_products)}")
        time.sleep(0.3)

    print(f"\n  [*] Total unique products found: {len(all_products)}")
    print(f"  [*] Downloading images...")

    downloaded = 0
    failed = 0

    def dl_pnp_product(p):
        nonlocal downloaded, failed
        name = p.get("name", "unknown")
        code = p.get("code", "unknown")
        safe_name = re.sub(r'[\\/*?:"<>|]', "", name)[:80]
        images_data = p.get("images", [])

        best_image = None
        for img in images_data:
            if img.get("format") == "product" and img.get("imageType") == "PRIMARY":
                best_image = img.get("url")
                break
        if not best_image:
            for img in images_data:
                if img.get("format") == "zoom":
                    best_image = img.get("url")
                    break
        if not best_image:
            for img in images_data:
                if img.get("imageType") == "PRIMARY":
                    best_image = img.get("url")
                    break
        if not best_image and images_data:
            best_image = images_data[0].get("url")

        if best_image:
            if best_image.startswith("/"):
                best_image = "https://www.pnp.co.za" + best_image
            result = download_image(best_image, PNP_DIR, f"pnp_{code[:20]}_{safe_name[:40]}")
            if result[0]:
                return result
        return None

    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(dl_pnp_product, p): p for p in all_products}
        for future in as_completed(futures):
            result = future.result()
            if result:
                fp, size = result
                downloaded += 1
                print(f"     [OK] {os.path.basename(fp)} ({size / 1024:.1f} KB)")
            else:
                failed += 1

    print(f"\n  [*] PnP done: {downloaded} images downloaded, {failed} failed")
    return downloaded


if __name__ == "__main__":
    total = 0
    total += scrape_checkers()
    total += scrape_pnp()
    print("\n" + "=" * 60)
    print(f"TOTAL: {total} images saved")
    print(f"  Checkers: {CHECKERS_DIR}")
    print(f"  PnP:      {PNP_DIR}")
    print("=" * 60)
