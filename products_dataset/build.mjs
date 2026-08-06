/**
 * Builds the Checkstar product dataset from the Checkers Sixty60 image cache.
 *
 * - Reads every image in ../checkers_images (webp/jpg)
 * - Drops products whose names contain "gourmet", "the menu" or "padkos/padka"
 * - Renames each product (clean retail name, verified against Checkers listing
 *   where the cached name was truncated) and rewrites the image file to
 *   images/<category>/<slug>.<ext>
 * - Assigns a category, unit, brand, tags and a modelled base price
 *
 * Output: products.json + images/ (both committed).
 */
import { readdirSync, readFileSync, copyFileSync, mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, '..', 'checkers_images');
const OUT = __dirname;

// ---- Categories (mirrors backend/database/seeders/CategorySeeder.php + 2 new) ----
const CATEGORIES = [
  { id: 1, name: 'Fruits & Vegetables', slug: 'fruits-vegetables', sort_order: 1 },
  { id: 2, name: 'Meat & Poultry', slug: 'meat-poultry', sort_order: 2 },
  { id: 3, name: 'Bakery', slug: 'bakery', sort_order: 3 },
  { id: 4, name: 'Dairy & Eggs', slug: 'dairy-eggs', sort_order: 4 },
  { id: 5, name: 'Beverages', slug: 'beverages', sort_order: 5 },
  { id: 6, name: 'Snacks & Treats', slug: 'snacks-treats', sort_order: 6 },
  { id: 7, name: 'Pantry Staples', slug: 'pantry-staples', sort_order: 7 },
  { id: 8, name: 'Frozen Foods', slug: 'frozen-foods', sort_order: 8 },
  { id: 9, name: 'Household', slug: 'household', sort_order: 9 },
  { id: 10, name: 'Baby & Toddler', slug: 'baby-toddler', sort_order: 10 },
  { id: 11, name: 'Health & Beauty', slug: 'health-beauty', sort_order: 11 },
  { id: 12, name: 'Wines & Spirits', slug: 'wines-spirits', sort_order: 12 },
  { id: 13, name: 'Pet Supplies', slug: 'pet-supplies', sort_order: 13 },
  { id: 14, name: 'Ready Meals & Deli', slug: 'ready-meals-deli', sort_order: 14 },
  { id: 15, name: 'Stationery & School', slug: 'stationery-school', sort_order: 15 },
];
const CAT_BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));

// ---- Exclusions ----
const EXCLUDE = /\b(gourmet)\b|\bthe menu\b|\bpadk(a|os)\b/i;

// ---- Name completion for entries truncated by the cache downloader ----
const COMPLETIONS = [
  ['Simple Truth Gluten Free Lime & Coriander Chutney Flavoured', 'Simple Truth Gluten Free Lime & Coriander Chutney Flavoured Ancient Grain Rice Chips 85g'],
  ['Simple Truth Gluten Free Parmesan Flavoured Ancient Grain Ri', 'Simple Truth Gluten Free Parmesan Flavoured Ancient Grain Rice Chips 85g'],
  ['Simple Truth Gluten Free Sour Cream & Chives Flavoured Ancie', 'Simple Truth Gluten Free Sour Cream & Chives Flavoured Ancient Grain Rice Chips 85g'],
  ['Goldi Chicken Frozen Chicken Mixed Portions with Brine-Based', 'Goldi Chicken Frozen Chicken Mixed Portions with Brine-Based Mixture 2kg'],
  ["Farmer's Choice Individually Quick Frozen Mixed Chicken Port", "Farmer's Choice Individually Quick Frozen Mixed Chicken Portions 2kg"],
  ['PURITY From 6 Months Sweet Potato, Sweetcorn & Apple Veggi 1', 'PURITY From 6 Months Sweet Potato, Sweetcorn & Apple Veggie 110ml'],
  ['PURITY Custard & Prune With Vanilla Flavour Puree 8 Months+ ', 'PURITY Custard & Prune With Vanilla Flavour Puree 8 Months+ 110ml'],
  ['PURITY Yoghurt With Apple, Granadilla, Kiwi & Vanilla Flavou', 'PURITY Yoghurt With Apple, Granadilla, Kiwi & Vanilla Flavour Yogi 110ml'],
  ['Grain Field Chickens Frozen Whole Chicken in Brine with Gibl', 'Grain Field Chickens Frozen Whole Chicken in Brine with Giblets'],
  ['Dettol Lavender All Purpose Disinfectant & Floor Cleaner 1.5', 'Dettol Lavender All Purpose Disinfectant & Floor Cleaner 1.5L'],
  ['Plush Supreme Orange Blossom Wood & Laminate Floor Cleaner B', 'Plush Supreme Orange Blossom Wood & Laminate Floor Cleaner 750ml'],
  ['Grain Field Chickens Fresh Chicken Drumsticks & Thighs Per k', 'Grain Field Chickens Fresh Chicken Drumsticks & Thighs Per kg'],
  ['County Fair Riverside Whole Fresh Chicken With Giblets Per k', 'County Fair Riverside Whole Fresh Chicken With Giblets Per kg'],
  ['Fresh Choice Fresh Drumsticks & Thigh Mixed Chicken Portions', 'Fresh Choice Fresh Drumsticks & Thighs Mixed Chicken Portions Per kg'],
  ['Simple Truth Free-Range Skinless Chicken Thighs & Drumsticks', 'Simple Truth Free-Range Skinless Chicken Thighs & Drumsticks Per kg'],
  ['PURITY From 6 Months Yoghurt with Mixed Berries & Apple Yogi', 'PURITY From 6 Months Yoghurt with Mixed Berries & Apple Yogi 110ml'],
  ['PURITY From 8 Months Mango, Granadilla & Yogurt with Vanilla', 'PURITY From 8 Months Mango, Granadilla & Yogurt with Vanilla Yogi 110ml'],
  ['PURITY From 6 Months Creamy Sweet Potato with Cinnamon Veggi', 'PURITY From 6 Months Creamy Sweet Potato with Cinnamon Veggie 110ml'],
];

// ---- Small text fixes applied after completion ----
const NAME_FIXES = [
  [/20 Pac\b/, '20 Pack'],
  [/18-Pack\b/, '18 Pack'],
  [/8s$/, '8 Pack'],
  [/Peach Peach\b/, 'Peach'],
  [/Less Sugar Less Sugar\b/, 'Less Sugar'],
  [/™/, ''],
  [/\s*\(600g - 800g\)\s*$/, ' (per kg)'],
  [/\s*\(300g - 500g\)\s*$/, ' (per kg)'],
  [/\s*\(450g - 650g\)\s*$/, ' (per kg)'],
  [/\s*\(800g - 1000g\)\s*$/, ' (per kg)'],
  [/Per kg$/i, 'Per kg'],
  [/\bCar\b/, 'Car'],
];

// ---- Category rules (first match wins, most specific first) ----
const CATEGORY_RULES = [
  { slug: 'frozen-foods', re: /cape point|frozen|ice cream|i\.?q\.?f/i },
  { slug: 'baby-toddler', re: /\bpurity\b|\bsquish\b|puree|yogi\b|fruiti\b|veggi\b|brekki\b|from \d months/i },
  { slug: 'pet-supplies', re: /\bwhiskas\b|cat food|dog food/i },
  { slug: 'stationery-school', re: /\bscholar\b|quire|hardcover book|page\b/i },
  { slug: 'household', re: /foil|cleaner|drain|polish|toilet|tissue|window|shampoo|wax|dettol|windolene|carpet/i },
  { slug: 'health-beauty', re: /nivea|\bspf\b|sun (spray|lotion|cream|spray)|sunscreen|plasters|band-aid|lip balm|\busn\b|protein|\belastoplast\b|piz buin|everysun|\brenew\b/i },
  { slug: 'ready-meals-deli', re: /simply great|gourmade|café culture|cafe culture|bella vita|spice indian|\bwrap\b|sandwich|cottage pie|pasta salad|pumpkin fritters/i },
  { slug: 'meat-poultry', re: /chicken|beef|mince|oxtail|stewing|potjiekos|braai pack|thighs|drumsticks|wings|breast fillet/i },
  { slug: 'snacks-treats', re: /pringles|chips|popcorn|tim tam|crisps|bread crisps|pretzel knots|nuts|cashew|almonds|peanuts|walnuts|pecan|goji|rice chips/i },
  { slug: 'beverages', re: /\bcoca[- ]?cola\b|\bcola\b|pepsi|\btab\b|soft drink|juice|cordial|water|sparkling|tropika|squash|dairy fruit mix|almond milk/i },
  { slug: 'bakery', re: /\bbread\b|sasko|albany|blue ribbon|sunbake|muffin|croissant|rolls?|biscuits|pretzel/i },
  { slug: 'dairy-eggs', re: /milk|butter|cheese|mozzarella|brie|yoghurt|yogurt|cream|happy cow|babybel|eggs/i },
  { slug: 'fruits-vegetables', re: /apple|banana|grapes|lemon|nectarine|blueberries|spanspek|peaches|papaya|pineapple|strawberr|celery|salad/i },
  { slug: 'pantry-staples', re: /flour|pre-mix|premix|bake|rice\b|pasta|oil\b|spice|corn chips/i },
];
const DEFAULT_CAT = 'pantry-staples';

function categorize(name) {
  for (const rule of CATEGORY_RULES) {
    if (rule.re.test(name)) return rule.slug;
  }
  return DEFAULT_CAT;
}

// ---- Brand extraction ----
const BRANDS = ['NIVEA', 'PURITY', 'Squish', 'Whiskas', 'Simple Truth', 'Checkers Housebrand', 'Checkers', 'Goldi Chicken', "Farmer's Choice", 'Grain Field Chickens', 'Fresh Choice', 'Festive Fresh', 'Anca', 'County Fair', 'Coca-Cola', 'Pepsi', 'Tropika', 'Krush', 'Rose\u2019s', 'Rose\'s', 'aQuellé', 'aQuelle', 'Valpré', 'Valpre', 'Eastern Highlands', 'Banting Revolution', 'Health Connection Wholefoods', 'SASKO', 'Albany', 'Blue Ribbon', 'Sunbake', 'Lurpak', 'Kerrygold', 'Crystal Valley', 'Ladismith', 'Clover', 'Fair Cape Dairies', 'Douglasdale', 'Parmalat', 'Babybel', 'Galbani', 'LANCEWOOD', 'Ile De France', 'Happy Cow', 'Almond Breeze', 'Pringles', 'Tait\u2019s', "Tait's", 'Tim Tam', 'Elastoplast', 'Band-Aid', 'Labello', 'USN', 'Piz Buin', 'Everysun', 'Renew', 'Mr Muscle', 'Mr. Sheen', 'Cobra', 'Plush Supreme', 'Windolene', 'Dettol', 'Drain Power', 'Chemico', 'Baby Soft', 'Scholar', 'Simple Truth Gluten Free'];

function extractBrand(name) {
  for (const brand of BRANDS) {
    if (name.toLowerCase().startsWith(brand.toLowerCase())) return brand;
  }
  for (const brand of BRANDS) {
    if (name.toLowerCase().includes(brand.toLowerCase()) && brand.length > 3) return brand;
  }
  return null;
}

// ---- Unit extraction ----
function normalizeUnit(unit) {
  return unit.replace(/(\d)l$/g, '$1L');
}

function extractUnit(name) {
  const multi = name.match(/(\d+)\s*x\s*(\d[\d.]*)\s*(kg|g|ml|l|m)\b/i);
  if (multi) return normalizeUnit(`${multi[1]} x ${multi[2]}${multi[3].toLowerCase()}`);
  if (/per kg/i.test(name)) return 'kg';
  const single = name.match(/(\d[\d.]*)\s*(kg|g|ml|l|m)\b/i);
  if (single) return normalizeUnit(`${single[1]}${single[2].toLowerCase()}`);
  if (/caps\b/i.test(name)) return 'caps';
  if (/page\b/i.test(name)) return 'each';
  if (/pack|pac\b|roll\b/i.test(name)) return 'pack';
  return 'each';
}

// ---- Tags ----
function extractTags(name, categorySlug) {
  const tags = [];
  if (/gluten free/i.test(name)) tags.push('gluten-free');
  if (/free[- ]?range/i.test(name)) tags.push('free-range');
  if (/braai/i.test(name)) tags.push('braai');
  if (/halal/i.test(name)) tags.push('halal');
  if (/vegan/i.test(name)) tags.push('vegan');
  if (categorySlug === 'baby-toddler') tags.push('baby');
  if (/almond/i.test(name)) tags.push('almond');
  return tags;
}

// ---- Base price (Rand). Modelled estimates anchored to Checkers/Shoprite/PnP listings. ----
const PRICE_RULES = [
  // produce
  [/frooties/i, 19.99],
  [/lemons 7 pack/i, 19.99], [/blueberries 125g/i, 39.99], [/strawberries 250g/i, 29.99],
  [/queen pineapple/i, 29.99], [/papaya 1\.5kg/i, 29.99], [/spanspek/i, 24.99],
  [/apples 1\.5kg|apples 8 pack/i, 34.99],
  [/nectarines 1kg/i, 34.99], [/nectarines 750g/i, 29.99],
  [/grapes 500g/i, 34.99], [/peaches 1kg/i, 32.99],
  [/bananas 1\.2kg/i, 24.99], [/bananas 650g/i, 14.99],
  [/celery fingers 150g/i, 12.99], [/celery 75g/i, 9.99],
  // chicken (per kg)
  [/breast fillets? per kg/i, 69.99], [/fillet breast per kg/i, 69.99],
  [/individually wrapped chicken fillets/i, 74.99],
  [/wings per kg/i, 49.99],
  [/drumsticks & thighs per kg|thighs & drumsticks/i, 43.99],
  [/drumsticks per kg/i, 44.99],
  [/mixed chicken portions per kg/i, 43.99],
  [/thighs per kg/i, 42.99], [/braai pack per kg|16 piece chicken braai/i, 54.99],
  [/whole chicken.*per kg/i, 49.99],
  [/skinless chicken thighs/i, 89.99],
  // beef
  [/extra lean beef mince/i, 79.99], [/lean beef mince bulk/i, 109.99], [/lean beef mince/i, 59.99],
  [/beef mince/i, 49.99], [/beef oxtail/i, 139.99], [/stewing beef/i, 99.99], [/beef potjiekos/i, 89.99],
  // frozen seafood
  [/prawns 800g/i, 159.99], [/platter prawns 700g/i, 149.99], [/oysters/i, 119.99],
  [/calamari 600g/i, 99.99], [/kingklip/i, 99.99], [/tuna steaks/i, 79.99], [/salmon trout/i, 129.99],
  [/norwegian salmon/i, 89.99], [/dorado/i, 69.99], [/hake medallions/i, 69.99],
  [/hake fillets/i, 119.99], [/dressed soles/i, 109.99], [/white clams/i, 89.99],
  [/mussels/i, 59.99], [/pangasius/i, 69.99],
  // frozen chicken
  [/goldi chicken frozen/i, 99.99], [/farmer.?s choice.*5kg/i, 249.99], [/farmer.?s choice/i, 87.99],
  [/frozen whole chicken in brine/i, 89.99],
  // dairy
  [/almond milk 1l/i, 29.99],
  [/milk 1l/i, 16.99], [/milk 2l/i, 34.99], [/milk 3l/i, 48.99], [/milk 6 x 1l/i, 98.99],
  [/housebrand.*milk 2l/i, 29.99], [/housebrand.*milk 6 x 1l/i, 94.99],
  [/kerrygold/i, 49.99], [/lurpak/i, 99.99], [/clover butro/i, 69.99], [/spreado/i, 59.99],
  [/easy spread/i, 69.99], [/unsalted butter/i, 89.99], [/salted butter brick/i, 89.99],
  [/garlic & parsley butter/i, 34.99],
  [/babybel mini/i, 39.99], [/babybel.*110g/i, 42.99], [/galbani/i, 54.99], [/lancewood/i, 49.99],
  [/ile de france/i, 44.99], [/happy cow/i, 44.99],
  // beverages
  [/coca-cola.*2\.25l|zero sugar.*2\.25l|no sugar.*2\.25l/i, 31.99],
  [/coca-cola.*2l/i, 28.99], [/coca-cola.*1l/i, 17.99], [/coca-cola.*440ml/i, 10.99],
  [/pepsi.*2l/i, 26.99], [/tab.*2\.25l|tab.*2l/i, 24.99], [/zip cola|zip zero/i, 16.99],
  [/krush.*1\.5l/i, 27.99], [/krush.*500ml/i, 12.99],
  [/tropika.*2l/i, 26.99], [/tropika.*500ml/i, 12.99],
  [/banting revolution.*48ml/i, 12.99], [/rose.?s.*cordial|banting.*cordial/i, 39.99],
  [/aquelle|aQuellé/i, 8.99], [/valpré.*1l|valpre.*1l/i, 14.99], [/valpré|valpre/i, 10.99], [/eastern highlands/i, 8.99],
  // snacks
  [/pringles/i, 24.99], [/tims? tam/i, 39.99], [/tai.?ts.*popcorn 6 x|6 x 91g/i, 89.99],
  [/tai.?ts.*popcorn 3 x|3 x 91g/i, 49.99], [/tai.?ts.*popcorn 100g/i, 21.99], [/popcorn 91g/i, 19.99],
  [/bread crisps 85g/i, 24.99], [/rice chips 85g/i, 22.99], [/pretzel knots/i, 14.99],
  // pantry
  [/health connection.*almond flour/i, 59.99], [/almond flour/i, 49.99],
  [/banting.*(muffin|bread).*pre-mix/i, 39.99], [/goji berries/i, 44.99],
  // bakery
  [/sasko/i, 21.99], [/albany/i, 19.99], [/blue ribbon/i, 19.99], [/sunbake/i, 18.99],
  [/café culture|cafe culture/i, 39.99],
  // ready meals
  [/gourmade cottage pie/i, 44.99], [/pumpkin fritters/i, 34.99], [/bella vita/i, 44.99],
  [/spice indian/i, 54.99],
  [/simply great.*salad/i, 39.99], [/simply great.*(sandwich|wrap)/i, 32.99], [/simply great.*pasta salad/i, 39.99],
  // baby
  [/purity.*200ml/i, 19.99], [/purity.*110ml|squish/i, 13.99],
  // health & beauty
  [/nivea after sun/i, 99.99], [/nivea.*(200ml|50ml)/i, 119.99], [/nivea.*300ml/i, 149.99],
  [/everysun/i, 69.99], [/piz buin/i, 179.99], [/renew spf/i, 99.99],
  [/elastoplast|band-aid/i, 39.99], [/labello/i, 34.99],
  [/usn.*protein/i, 399.99], [/usn fast grow/i, 599.99], [/usn.*tribulus/i, 349.99],
  // household
  [/foil.*20m/i, 24.99], [/foil.*5m/i, 12.99],
  [/toilet.*18/i, 89.99], [/toilet.*9/i, 44.99], [/toilet.*4/i, 22.99],
  [/dettol.*1\.5l/i, 54.99], [/windolene/i, 44.99], [/mr muscle.*tile/i, 44.99], [/mr muscle.*sink/i, 39.99],
  [/mr muscle.*oven/i, 44.99], [/mr. sheen|carpet cleaner 275ml/i, 34.99], [/carpet shampoo 1l/i, 54.99],
  [/cobra.*1\.5l/i, 54.99], [/cobra.*(tile|oven|braai)/i, 34.99], [/cobra.*floor/i, 39.99], [/cobra.*polish/i, 49.99],
  [/plush.*(oven|window|floor)/i, 39.99], [/plush.*carpet shampoo/i, 54.99],
  [/drain power.*granules/i, 44.99], [/drain power 3-in-1/i, 49.99], [/chemico/i, 29.99],
  // pet
  [/whiskas.*1kg/i, 89.99], [/whiskas.*85g/i, 14.99],
  // stationery
  [/scholar.*288/i, 54.99], [/scholar.*192/i, 39.99], [/scholar.*96/i, 25.99],
];
const CATEGORY_DEFAULT_PRICE = {
  'fruits-vegetables': 29.99, 'meat-poultry': 59.99, bakery: 21.99, 'dairy-eggs': 34.99,
  beverages: 19.99, 'snacks-treats': 24.99, 'pantry-staples': 39.99, 'frozen-foods': 89.99,
  household: 39.99, 'baby-toddler': 13.99, 'health-beauty': 99.99, 'wines-spirits': 79.99,
  'pet-supplies': 29.99, 'ready-meals-deli': 39.99, 'stationery-school': 39.99,
};

function priceFor(name, categorySlug) {
  for (const [re, price] of PRICE_RULES) {
    if (re.test(name)) return price;
  }
  return CATEGORY_DEFAULT_PRICE[categorySlug] ?? 39.99;
}

// ---- Slug ----
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/™|®|©/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ---- Sanitise for file names ----
function sanitizeFile(name) {
  return name.replace(/[/\\?%*:|"<>]/g, '').replace(/\s+/g, ' ').trim();
}

// ---- Main ----
function build() {
  const files = readdirSync(SRC).filter((f) => /\.(webp|jpg)$/i.test(f));
  const products = [];
  const skipped = [];
  const seen = new Set();

  for (const file of files) {
    const m = file.match(/^checkers_[0-9a-f]+_(.+)\.(webp|jpg)$/i);
    if (!m) continue;
    const raw = m[1];
    let name = raw;
    for (const [from, to] of COMPLETIONS) {
      if (name === from || name.startsWith(from)) name = to;
    }
    if (EXCLUDE.test(name)) {
      skipped.push({ file, reason: 'excluded brand/range', name });
      continue;
    }
    for (const [re, to] of NAME_FIXES) name = name.replace(re, to);
    name = name.replace(/\s+/g, ' ').trim();

    const categorySlug = categorize(name);
    const category = CAT_BY_ID.get(CATEGORIES.find((c) => c.slug === categorySlug).id);
    const unit = extractUnit(name);
    const brand = extractBrand(name);
    const tags = extractTags(name, categorySlug);
    const price = priceFor(name, categorySlug);
    const slug = slugify(name);

    let uniqueSlug = slug;
    let n = 2;
    while (seen.has(uniqueSlug)) uniqueSlug = `${slug}-${n++}`;
    seen.add(uniqueSlug);

    products.push({
      name,
      slug: uniqueSlug,
      category_id: category.id,
      category: category.slug,
      unit,
      price,
      sale_price: null,
      brand,
      tags,
      image: `images/${category.slug}/${uniqueSlug}.${m[2]}`,
      is_featured: false,
      source_file: file,
    });
  }

  // Feature a few headline products
  const featureTargets = ['Strawberries 250g', 'Coca-Cola Original Taste Soft Drink 2L', 'Lancewood Medium Fat Mozzarella Cheese 250g', 'Tim Tam Original Biscuits 200g', 'Simple Truth Gluten Free Lime & Coriander Chutney Flavoured Ancient Grain Rice Chips 85g', 'PURITY From 6 Months Banana, Apple & Yoghurt Yogi 110ml', 'SASKO Premium Slices White Bread 700g', 'Kerrygold Butter Brick 250g', 'Beef Mince (per kg)'];
  for (const p of products) {
    if (featureTargets.some((t) => p.name.toLowerCase().startsWith(t.toLowerCase()))) p.is_featured = true;
  }

  // Write images + output
  rmSync(join(OUT, 'images'), { recursive: true, force: true });
  const written = [];
  for (const p of products) {
    const dst = join(OUT, p.image);
    mkdirSync(dirname(dst), { recursive: true });
    copyFileSync(join(SRC, p.source_file), dst);
    written.push(p.image);
  }

  const dataset = {
    generated_at: new Date().toISOString(),
    source: 'Checkers Sixty60 image cache (products renamed for Checkstar)',
    categories: CATEGORIES,
    products,
  };
  writeFileSync(join(OUT, 'products.json'), JSON.stringify(dataset, null, 2), 'utf8');

  return { total: files.length, kept: products.length, skipped: skipped.length, written: written.length, skipped };
}

const result = build();
console.log(`Source images: ${result.total}`);
console.log(`Products kept: ${result.kept}`);
console.log(`Skipped: ${result.skipped.length}`);
console.log(`Images written: ${result.written}`);
for (const s of result.skipped) console.log(`  SKIP: ${s.reason} -> ${s.name}`);
