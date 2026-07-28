import requests, json, re, os, time
from concurrent.futures import ThreadPoolExecutor, as_completed

CHECKERS_DIR = os.path.join(os.path.dirname(__file__), "checkers_images")
PNP_DIR = os.path.join(os.path.dirname(__file__), "pnp_images")
os.makedirs(CHECKERS_DIR, exist_ok=True)
os.makedirs(PNP_DIR, exist_ok=True)

session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept-Language": "en-ZA,en-GB;q=0.9,en;q=0.8",
})

def download_image(url, folder, filename):
    try:
        r = session.get(url, timeout=15)
        r.raise_for_status()
        ct = r.headers.get("Content-Type", "")
        ext = "webp" if "webp" in ct else ("png" if "png" in ct else "jpg")
        path = os.path.join(folder, f"{filename}.{ext}")
        with open(path, "wb") as f:
            f.write(r.content)
        return path, len(r.content)
    except Exception as e:
        return None, 0

def scrape_checkers():
    print("=" * 60)
    print("CHECKERS PRODUCT IMAGES")
    print("=" * 60)

    sitemap_urls = [
        "https://www.checkers.co.za/api/sitemaps/seq_product-sitemap_00.xml",
        "https://www.checkers.co.za/api/sitemaps/seq_product-sitemap_01.xml",
    ]

    product_urls = []
    for sm_url in sitemap_urls:
        try:
            r = session.get(sm_url, timeout=30)
            if r.status_code == 200:
                locs = re.findall(r"<loc>(.*?)</loc>", r.text)
                print(f"  Sitemap: {len(locs)} product URLs")
                product_urls.extend(locs)
        except Exception as e:
            print(f"  Error fetching sitemap: {e}")

    LIMIT = 300
    product_urls = product_urls[:LIMIT]
    print(f"  Processing {len(product_urls)} products...")

    def extract_product_data(url):
        try:
            r = session.get(url, timeout=15)
            if r.status_code != 200:
                return None
            match = re.search(r"__NEXT_DATA__[^>]+>(.*?)</script>", r.text, re.DOTALL)
            if not match:
                return None
            nd = json.loads(match.group(1))
            product = nd.get("props", {}).get("pageProps", {}).get("serverProduct")
            if not product:
                return None
            name = product.get("name", "unknown")
            image_id = product.get("imageId")
            image_ids = product.get("imageIds", [])
            if not image_id:
                return None
            return {"name": name, "image_id": image_id, "image_ids": image_ids}
        except:
            return None

    results = []
    with ThreadPoolExecutor(max_workers=10) as ex:
        futures = {ex.submit(extract_product_data, url): url for url in product_urls}
        for f in as_completed(futures):
            data = f.result()
            if data:
                results.append(data)

    print(f"  Extracted {len(results)} products with image IDs")

    downloaded = 0
    failed = 0

    def dl(p):
        nonlocal downloaded, failed
        safe_name = re.sub(r'[\\/*?:"<>|]', "", p["name"])[:60]
        url = f"https://catalog.sixty60.co.za/v2/files/{p['image_id']}?width=600&height=600"
        result = download_image(url, CHECKERS_DIR, f"checkers_{p['image_id'][:12]}_{safe_name}")
        if result[0]:
            downloaded += 1
            return result
        failed += 1
        return None

    with ThreadPoolExecutor(max_workers=5) as ex:
        futures = {ex.submit(dl, p): p for p in results}
        for f in as_completed(futures):
            r = f.result()
            if r:
                print(f"  [OK] {os.path.basename(r[0])} ({r[1]/1024:.1f} KB)")

    print(f"\n  Checkers done: {downloaded} downloaded, {failed} failed")
    return downloaded

PNP_SEARCH_TERMS = [
    "milk", "bread", "eggs", "butter", "cheese", "yogurt", "chicken",
    "rice", "pasta", "sugar", "coffee", "tea", "juice", "water",
    "apples", "bananas", "potatoes", "onions", "tomatoes",
    "cereal", "biscuits", "chocolate", "soup", "beans", "oil",
    "soap", "shampoo", "toothpaste", "detergent", "toilet paper",
    "cold drink", "beer", "wine", "ice cream", "margarine",
    "jam", "peanut butter", "flour", "maize", "cooking oil",
    "cake", "sauce", "pizza", "poultry", "beef", "pork",
    "fish", "tuna", "salt", "pepper", "spices", "noodles",
    "canned", "baby food", "pet food", "deodorant", "lotion",
]

def scrape_pnp():
    print("\n" + "=" * 60)
    print("PICK N PAY PRODUCT IMAGES")
    print("=" * 60)

    params = "storeCode=WC44&lang=en&curr=ZAR&maxProducts=10"
    seen_codes = set()
    products = []

    for term in PNP_SEARCH_TERMS:
        try:
            r = session.get(
                f"https://www.pnp.co.za/pnphybris/v2/pnp-spa/products/suggestions?term={term}&{params}",
                timeout=15,
            )
            if r.status_code != 200:
                continue
            data = r.json()
            for p in data.get("products", []):
                code = p.get("code", "")
                if code not in seen_codes:
                    seen_codes.add(code)
                    products.append(p)
        except:
            pass
        time.sleep(0.2)

    print(f"  Total unique products: {len(products)}")

    downloaded = 0
    failed = 0

    def dl(p):
        nonlocal downloaded, failed
        name = p.get("name", "unknown")
        code = p.get("code", "unknown")
        safe_name = re.sub(r'[\\/*?:"<>|]', "", name)[:60]
        images = p.get("images", [])

        img_url = None
        for fmt in ["product", "zoom", "carousel"]:
            for img in images:
                if img.get("format") == fmt and img.get("imageType") == "PRIMARY":
                    img_url = img.get("url")
                    break
            if img_url:
                break
        if not img_url and images:
            img_url = images[0].get("url")

        if img_url:
            if img_url.startswith("/"):
                img_url = "https://www.pnp.co.za" + img_url
            result = download_image(img_url, PNP_DIR, f"pnp_{code[:16]}_{safe_name}")
            if result[0]:
                downloaded += 1
                return result
        failed += 1
        return None

    with ThreadPoolExecutor(max_workers=5) as ex:
        futures = {ex.submit(dl, p): p for p in products}
        for f in as_completed(futures):
            r = f.result()
            if r:
                print(f"  [OK] {os.path.basename(r[0])} ({r[1]/1024:.1f} KB)")

    print(f"\n  PnP done: {downloaded} downloaded, {failed} failed")
    return downloaded

if __name__ == "__main__":
    total = scrape_checkers() + scrape_pnp()
    print("\n" + "=" * 60)
    print(f"TOTAL: {total} images saved")
    print(f"  Checkers: {CHECKERS_DIR}")
    print(f"  PnP:      {PNP_DIR}")
    print("=" * 60)
