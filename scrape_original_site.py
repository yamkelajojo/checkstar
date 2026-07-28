import requests, re, os, sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urljoin, urlparse

BASE_URL = "http://checkstar.co.za"
OUT_DIR = os.path.join(os.path.dirname(__file__), "original_site_assets")
IMG_DIR = os.path.join(OUT_DIR, "images")
CSS_DIR = os.path.join(OUT_DIR, "css")
JS_DIR = os.path.join(OUT_DIR, "js")
PAGE_DIR = os.path.join(OUT_DIR, "pages")
FLASH_DIR = os.path.join(IMG_DIR, "flash")
for d in [IMG_DIR, CSS_DIR, JS_DIR, PAGE_DIR, FLASH_DIR]:
    os.makedirs(d, exist_ok=True)

session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept-Language": "en-ZA,en-GB;q=0.9,en;q=0.8",
})

PAGES = [
    "default.htm", "about.htm", "products.htm", "promotions.htm",
    "consumerservices.htm", "recipes.htm", "gallery.htm", "generaltips.htm",
    "consumerinvolvement.htm", "careers.htm", "competitions.htm",
    "contact.htm", "comments.htm", "businesstobusiness.htm",
]

KNOWN_IMAGES = [
    "05 April 2016 Header.jpg",
    "20-june-2024.jpg",
    "Background2.jpg",
    "menu footer.gif",
    "store locator.jpg", "current promo.jpg", "recipes.jpg",
    "store locator hover.jpg", "current promo hover.jpg", "recipes hover.jpg",
    "bucket shadow.gif", "readmorebutton.gif", "social.jpg",
    "servicebubble.jpg", "servicebubble.png", "menu seperator.gif",
    "webdesignbg.jpg", "smsbg.jpg", "bulkemailbg.jpg", "emailadlbg.jpg",
]
KNOWN_NAV = [f"menu normal_r1_c{i}.jpg" for i in range(1, 13)] + [f"menu hover_r1_c{i}.jpg" for i in range(1, 13)]
ALL_IMAGES = KNOWN_IMAGES + KNOWN_NAV
FLASH_NAMES = ["a.jpg", "b.jpg", "c.jpg"]

downloaded = set()
total_bytes = 0

def log(msg):
    print(msg, flush=True)

def dl(url, folder, filename=None):
    global total_bytes
    if url in downloaded:
        return
    try:
        r = session.get(url, timeout=10)
        r.raise_for_status()
        if not filename:
            filename = os.path.basename(urlparse(url).path)
        if not filename:
            return
        safe = re.sub(r'[\\/*?:"<>|]', "_", filename)
        ct = r.headers.get("Content-Type", "")
        ext_map = {"jpeg": ".jpg", "jpg": ".jpg", "png": ".png", "gif": ".gif", "webp": ".webp", "svg": ".svg"}
        for key, ext in ext_map.items():
            if key in ct and not safe.lower().endswith(ext):
                safe += ext
                break
        path = os.path.join(folder, safe)
        if os.path.exists(path):
            downloaded.add(url)
            return
        with open(path, "wb") as f:
            f.write(r.content)
        downloaded.add(url)
        total_bytes += len(r.content)
        log(f"  [OK] {safe} ({len(r.content)/1024:.1f} KB)")
    except Exception as e:
        log(f"  [ ] {urlparse(url).path} — {type(e).__name__}")

def fetch_page(page):
    url = urljoin(BASE_URL, page)
    try:
        r = session.get(url, timeout=10)
        r.raise_for_status()
    except:
        log(f"  [FAIL] {page}")
        return ""
    html = r.text

    safe_name = page.replace("/", "_")
    path = os.path.join(PAGE_DIR, safe_name)
    with open(path, "wb") as f:
        f.write(r.content)
    log(f"  [PAGE] {safe_name} ({len(r.content)/1024:.1f} KB)")

    # Find images
    for m in re.finditer(r'<img[^>]+src=["\']([^"\']+)["\']', html, re.I):
        src = m.group(1)
        dl(urljoin(BASE_URL, src), IMG_DIR)

    # Find CSS links
    for m in re.finditer(r'<link[^>]+href=["\']([^"\']+\.css)["\']', html, re.I):
        href = m.group(1)
        dl(urljoin(BASE_URL, href), CSS_DIR)

    # Find JS links
    for m in re.finditer(r'<script[^>]+src=["\']([^"\']+\.js)["\']', html, re.I):
        src = m.group(1)
        dl(urljoin(BASE_URL, src), JS_DIR)

    return html

def css_images():
    for fname in os.listdir(CSS_DIR):
        if fname.endswith(".css"):
            css = open(os.path.join(CSS_DIR, fname), encoding="utf-8", errors="ignore").read()
            for m in re.finditer(r"url\(['\"]?(.*?)['\"]?\)", css):
                u = m.group(1)
                if not u.startswith("data:"):
                    dl(urljoin(BASE_URL, u), IMG_DIR)

if __name__ == "__main__":
    log("=" * 60)
    log("CHECKSTAR.CO.ZA — FULL ASSET EXTRACTION")
    log("=" * 60)

    for page in PAGES:
        log(f"\n--- {page} ---")
        fetch_page(page)

    log("\n--- Images from CSS ---")
    css_images()

    log("\n--- Hero/flash images ---")
    for fn in FLASH_NAMES:
        dl(urljoin(BASE_URL, f"images/flash/{fn}"), FLASH_DIR)

    log("\n--- Known images not yet found ---")
    for name in ALL_IMAGES:
        dl(urljoin(BASE_URL, f"images/{name}"), IMG_DIR)

    log("\n" + "=" * 60)
    log(f"COMPLETE: {len(downloaded)} assets downloaded")
    log(f"Total: {total_bytes/1024:.1f} KB ({total_bytes/1024/1024:.2f} MB)")
    log(f"Saved to: {OUT_DIR}")
    log("=" * 60)
