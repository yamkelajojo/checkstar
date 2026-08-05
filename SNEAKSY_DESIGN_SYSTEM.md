# Sneaksy → Checkstar: Design System & Banner Creator (Plan)

> Source artifact analyzed: `sneaksy.html` (`C:\Users\Acer\Documents\Software\2026\checkstar\sneaksy.html`, 2,276 lines).
>
> **What this doc governs.** We are borrowing two things from Sneaksy and nothing else:
> 1. **A design system** — the dark, glassy **web dashboard** styling → ours **web app**; and the **mockup mobile app** styling (light + dark) → ours **native app** (React Native / Expo).
> 2. **A banner creator module** → a new feature for **Store Owner / Store Manager / Developer** to build product Promotional banners.
>
> Plus a one-time decision about **placeholder product images** (we start with the Sneaksy shoe images).
>
> **Scope boundaries.**
> - **We are NOT touching the web app now.** No code changes. This doc is the plan + design reference so the work is unambiguous when we build.
> - We borrow **concepts, tokens, and layout** — not the vanilla-JS DOM code. Web port is **React/Next** (our stack); native port is **React Native / Expo** (see `docs/adr/0001-mobile-react-native-expo.md`).
> - Terminology: **Customer** (shopper), **Rider** (delivery), **Store Owner / Store Manager / Developer** (roles). See the Checkstar glossary at the bottom.

---

## 1. Sources of truth

| What | Where | Stack |
|------|-------|-------|
| Web dashboard design (Sneaksy Studio editor) | `sneaksy.html` left/right columns | Tailwind CSS v4 (CDN), Plus Jakarta Sans, Lucide, html2canvas |
| Mockup app design (Sneaksy iPhone storefront) | `sneaksy.html` phone screen | Same file, Tailwind `dark:` classes |
| Checkstar **web app** | `frontend/` | **Next.js 15 (App Router), React 19, TypeScript, Tailwind v3, motion (framer-motion), zustand, lucide-react, class-variance-authority, tailwind-merge** |
| Checkstar **native app** | `mobile/` (new) | **React Native (Expo SDK 54), TypeScript, Reanimated 4, Tamagui** |

> Design tokens are already partially encoded in `frontend/tailwind.config.ts`. That file is the **single source of truth for the web app**; this doc records the full intended palette so the config and the native app can both match it.

---

# PART A — DESIGN SYSTEM

## A.1 Brand 🎨 core palette (shared by both apps)

Sneaksy's signature is a **black/zinc neutral scale + a single vivid orange accent**, with semantic greens/reds/ambers reserved for status. Keep this ratio everywhere: ~90% neutrals, accent used sparingly (CTAs, active states, discounts, focus).

Both products must reconcile on the **accent orange**. Use the existing Checkstar `primary` orange as canonical; Sneaksy's is near-identical and we keep Sneaksy's cadence.

| Role | Sneaksy hex | Checkstar canonical (existing) | Use |
|------|-------------|-------------------------------|-----|
| **Brand accent / primary** | `#eb7a43` | `#EB6522` (primary), dark `#CC4400`, light `#FFE0CC` | CTA buttons, active pill, discount badge, focus rings, arrows, brand. **Web app keeps `#EB6522`; native app starts from `#eb7a43`.** |
| Background (page/screen dark) | `#0b0c0e` | — | Body/window deep black |
| Background (screen dark, alt) | `#09090b` (zinc-950) | — | Phone dark-mode screen |
| Surface (panel) | `#18181b` (zinc-900), `rgba(24,24,27,0.75)` glass | — | Cards, panels, glass |
| Border | `#27272a` (zinc-800), `rgba(63,63,70,0.4)` | — | Hairlines, dividers |
| Text primary | `#ffffff` / `#f4f4f5` (zinc-100) | — | Headings / body on dark |
| Text muted | `#a1a1aa` (zinc-400) → `#71717a` (zinc-500) | — | Secondary/labels |
| Text faint | `#52525b` (zinc-600) → `#71717a` | — | Footnotes, footers |
| Success | `#10b981` (emerald), `#2D6A4F` existing Checkstar | existing `success:#2D6A4F` | "In stock", success toasts, confirm |
| Danger / destructive | `#f43f5e` (rose) | existing `accent:#CC0000` | Remove, errors, sale-hot accents |
| Warning / rating | `#fbbf24` / `#f59e0b` (amber) | existing `warning:#E9C46A` | Star ratings |
| Info | `#0ea5e9` (sky) | — | Neutral info accents |

**Preset mood accents** (used only inside the banner creator's curated presets, not the app chrome): fuchsia `#e879f9`, sky `#0ea5e9`, amber `#f59e0b`, red `#ef4444`, emerald `#10b981`.

## A.2 Web app — typography

| Layer | Font | Sizes | Weight |
|-------|------|-------|--------|
| UI body | **Plus Jakarta Sans** (sneaksy) → keep page font | 12/14/16px | 400–500 |
| Displays / headings | sans | 18–40px | 700–800 (`font-extrabold`, `font-black`) |
| Micro-labels | sans, **UPPERCASE + wide tracking** | 9–11px | 700 |
| Code / values | **JetBrains Mono** | 11–12px | 400–700 |

> Weights in use (by frequency in Sneaksy): `font-bold` 700, `font-extrabold` 800, `font-medium` 500, `font-semibold` 600, `font-mono`, `font-black` 900. The sneaksy "voice" is **bold/extrabold titles + bold uppercase micro-labels on muted zinc-400**, with body text at 400/500.

## A.3 Web app — the dark dashboard system (← Sneaksy web)

This is the look the user wants applied to the **web app** (admin/staff surfaces in particular). Steal these structural patterns, not bespoke arbitrary values.

**Surfaces & depth**
- Page bg: `#0b0c0e`. Panels float on it as **zinc-900/zinc-950 cards** with 1px `zinc-800` borders.
- **Glass panel** recipe: `background: rgba(24,24,27,0.75); backdrop-filter: blur(12px); border: 1px solid rgba(63,63,70,0.4);`.
- **Decorative corner glow**: an absolutely-positioned blurred radial blob of the accent (`bg-primary/10 blur-3xl`) in a panel corner.
- Hover card lift: `bg-zinc-900/60` → `bg-zinc-900/100`, border → `border-primary/50`.

**Controls**
- Inputs / selects: `bg-zinc-950`, `border-zinc-800`, hover `border-zinc-700`, **focus ring/border `primary`**, `rounded-xl`, label above at 11px uppercase.
- Buttons (primary): gradient `from-primary to-orange-600`, white text, `rounded-xl`, `active:scale-95` press.
- Buttons (secondary/ghost): `bg-zinc-800` text-300 `border-zinc-700`.
- Sliders: thin track `bg-zinc-800`, thumb `accent-primary`.
- Tab nav (editor): underline indicator `border-b-2 border-primary`, inactive text `zinc-400`.

**Cards & badges**
- Preset/summary card: `rounded-2xl`, image thumb in a `rounded-xl` tile w/ subtle radial-dot texture, title white + hover accent.
- Micro-badges: `text-[8–9px] font-bold`, e.g. `bg-primary/10 text-primary border border-primary/20`.

**Layout & radii scale** (adopt globally): `rounded-lg` 8 → `xl` 12 → `2xl` 16 → `3xl` 24 → `[32px]` drawer → `rounded-full` pills. Sticky header w/ `backdrop-blur`.

**Motion language** (Sneaksy header + card hover): press `active:scale-95/110`, card hover `hover:scale-[1.01..1.05]`, transitions 150–300ms, fade/slide entrances. Keep exit faster than enter.

> **Reconciliation note:** Checkstar frontend is **Tailwind v3 + Next**, currently light (white web pages, `bg-white` cards). Introducing the dark dashboard system is a **new visual layer for staff/admin**; the Customer-facing web pages need not change (out of scope now). Do not delete existing `primary/success/warning` tokens — extend them with the neutral scale and new surfaces.

## A.4 Native app — the mobile system (← Sneaksy mockup app)

The native app is **React Native / Expo** (see ADR-0001). Map these to themed token objects (Tamagui + a `theme/colors.ts` + `theme/typography.ts`); follow the system light/dark mode with `useColorScheme()` driving a light and a dark palette, exactly as the light/dark variants below.

**Light theme (default)**
- Screen bg `#ffffff`; text `#18181b`; surfaces `#fafafa`/`#f4f4f5`; borders `#f4f4f5`.
- Accent `#eb7a43` (primary) used for: active collection pill, discount badge, price text, bottom-nav active, CTA.

**Dark theme**
- Screen bg `#09090b`; surfaces `#18181b` / `#27272a`; text `#ffffff` / `#a1a1aa`; borders `#27272a`.

**Surfaces within both**
- **Status bar**: clock + signal/battery at 11px bold, `zinc-800` (light) / `zinc-100` (dark).
- **App header**: brand at float 22px `font-extrabold`; circular icon buttons `44px` `bg-zinc-50`/`bg-zinc-900` w/ hairline border.
- **Search bar**: `rounded-full`, `bg-zinc-50`/`bg-zinc-900`, 1px hairline, `primary` focus ring.
- **Collection pills** (signature): active `bg-primary text-white`; inactive `bg-zinc-100 text-zinc-600` + hairline border (dark mirrors).
- **Product card** (2-col grid): `rounded-2xl`, `bg-zinc-50`/`bg-zinc-900`, image tile `bg-white`/`bg-zinc-800/40 rounded-xl`; **product image angled `rotate(-12…-30deg)` with soft drop-shadow on a backdrop circle** (the Sneaksy product presentation signature); discount badge `bg-primary/15 text-primary`; price `font-black`, original `line-through`; star rating amber.
- **Bottom tab bar**: blurred (`backdrop-blur`), 5 tabs, active tint `primary`, `52px` tall with counts badge `bg-primary`.
- **Product detail drawer**: bottom sheet `rounded-t-[32px]`, pull handle `w-12 h-1.5 bg-zinc-200`/`bg-zinc-700`, "SPECIAL OFFER" badge, size selector grid, primary CTA (gradient).
- **Toast / alerts**: glass card `rounded-2xl shadow-xl`, success `emerald`.

> RN mapping hints: `ColorScheme.fromSeed(seedColor: #eb7a43)` → Tamagui `theme` tokens seeded from `#eb7a43` for light + a dark palette; `fontWeight` scale 500/600/700/800/900; `Uppercase` + `letterSpacing` for micro-labels; buttons → `Pressable`/Tamagui `Button` with rounded corners; bottom nav → `@react-navigation/bottom-tabs` `Tab.Navigator`; the drawer → `@gorhom/bottom-sheet` with a 32px top radius.

## A.5 Putting tokens to work (avoid drift)

1. **Web app**: encode all of Part A.1–A.3 into `frontend/tailwind.config.ts` (extend the neutral zinc scale already shipped, add `surface`, `border`, `muted`, and keep `primary/success/warning`). Use Tailwind classes only — no ad-hoc hex in components.
2. **Native app**: define one `theme/colors.dart` + `theme/typography.dart` mirroring Part A.4; wire both light & dark into the app's `ThemeData`.
3. Treat these mappings as the **single source of truth** — any colour change updates this doc first.

---

# PART B — BANNER CREATOR MODULE

## B.1 What the module is (source)

A **3-slide flash-sale carousel banner**, each slide independently designed, with a live preview + export. `sneaksy.html` is a single file: **editor (right) drives `state.slides[]` → `renderBanner()` paints the preview (left) → `generateBannerCode()` / `html2canvas` export.**

Extracted, the module is five logical pieces (all reusable):
1. **`state.slides[]` data model** (`sneaksy.html` L935–1020, presets L1611+).
2. **`renderBanner()`** — pure-ish mapping of slide state → DOM (L1373).
3. **SVG pattern library** `patterns{}` (circles/waves/grid/stripes/dots/none) (L1113).
4. **Editor controls** — 5 tabs: Presets, Text & CTA, Shoes Layer, Colors & BG, Export (L447–883).
5. **Export** — `generateBannerCode()` → Tailwind + raw HTML string; `downloadBannerImage()` → PNG (L1830/1966).

## B.2 Porting to React (our stack)

Next.js App Router. **Keep the exact mental model: state → pure render + pure codegen.** Replace only the DOM plumbing.

Proposed file layout under `frontend/src/`:

```
features/banners/
  types.ts            # BannerSlide, ShoeTransform, BannerBackground, patterns enums
  presets.ts          # curated presets: original, neon, luxury, gym-red, hyper-ice, obsidian
  patterns.tsx        # SVG pattern components (circle, wave, grid, stripe, dot) — SVG only
  store.ts            # zustand store: slides[], activeSlide, activeTab, codeType
  components/
    BannerPreview.tsx # renders 1 BannerSlide (aspect-[2/1] card, layered <img>)
    BannerCanvas.tsx  # multi-slide preview + dot/slide switcher
    EditorPanel.tsx   # tab shell (reuse cn() from class-variance-authority)
    tabs/PresetsTab.tsx / TextTab.tsx / ShoesTab.tsx / StyleTab.tsx / ExportTab.tsx
  export/
    generateBannerCode.ts   # pure string fn → Tailwind + raw HTML (port L1830)
    downloadBannerImage.ts  # use html-to-image (cleaner than html2canvas in React)
  page.tsx            # e.g. /admin/banners or /staff/banners
```

**State:** replace the mutable `state` object with a **zustand** store (already a dependency). `BannerSlide` is a plain value object → trivial reactivity, undo later.

**Preview:** a `<BannerPreview slide={slide} />` that maps fields to JSX:
- background: one of `solid` / `linear-gradient(135deg)` / `radial-gradient` inline style;
- pattern: render the chosen `<PatternSvg color opacity>` component absolutely;
- typography block (subtitle, title `fontWeight` prop, CTA `→` arrow via lucide `ArrowUpRight`);
- **two absolutely-positioned `<img>`** at `left/top %`, `zIndex`, `transform: translate(-50%,-50%) rotate() scale()`, width `75%`, drop-shadow;
- `overflow` = toggle `overflow-hidden` / `overflow-visible`.

**Export:** keep `generateBannerCode(slide)` **pure** (string in → string out). Two flavours preserved: Tailwind-class HTML and inline-style HTML. For PNG use **`html-to-image`** (`toPng` on the preview ref) in place of html2canvas.

**Patterns:** each of the 5 SVG patterns is a tiny typed React component taking `{ color, opacity }`; generate the 4-digit-alpha hex exactly like the source (`color + (round(opacity*255)).toString(16).padStart(2,'0')`).

## B.3 Data model (TypeScript, source-of-truth)

```ts
export type FontWeight = 'font-normal' | 'font-semibold' | 'font-bold' | 'font-extrabold' | 'font-black'
export type BgType = 'solid' | 'gradient' | 'radial'
export type PatternType = 'circles' | 'waves' | 'grid' | 'stripes' | 'dots' | 'none'

export interface ShoeTransform {
  image: string
  rotation: number   // deg, -180..180
  scale: number      // 0.5..2.0 (UI shows 50..200%)
  x: number          // % of container, 0..100
  y: number          // % of container, 0..100
  z: number          // stacking
}

export interface BannerBackground {
  type: BgType
  colorStart: string
  colorEnd: string
  pattern: PatternType
  patternColor: string
  patternOpacity: number // 0..1
}

export interface BannerSlide {
  id: string
  subtitle: string        // uppercase micro-label, e.g. "Flash Sale"
  title: string           // e.g. "Up to 50% Off"
  ctaLabel: string        // e.g. "Shop Now"
  weightClass: FontWeight
  textColor: string
  subtitleColor: string
  ctaColor: string
  background: BannerBackground
  shoe1: ShoeTransform
  shoe2: ShoeTransform
  showShoe2: boolean
  overflow: boolean       // 3D bound spill
}

export interface BannerCreative {
  id: string
  name: string
  storeId: number | null  // set when a Store Owner/Manager scopes to a Store
  createdBy: number       // User id
  createdByRole: 'store_owner' | 'store_manager' | 'developer'
  slides: BannerSlide[]
  status: 'draft' | 'published'
  createdAt: string
  updatedAt: string
}
```

**Slider ranges (keep identical):** rotation `-180..180`, scale `50..200`, X `0..100`, Y `0..100`, pattern opacity `0..100`. Banner aspect `2:1`, `min-height ~155–160px`, shoe base width `75%`.

## B.4 Feature shell for roles

Audience: **Store Owner / Store Manager / Developer** (per CONTEXT.md).
- **Store Owner / Store Manager**: create banners **for their Store** only → `storeId` enforced via the **Store Context** seam (already a concept in the codebase).
- **Developer**: full access, may set any `storeId` or leave global (a top-level banner).
- Persist `BannerCreative` in the backend; the **published** banners feed the Customer app "Specials" carousels (tie-in to the existing `specials` screens).

Realistic v1 scope (recommended to confirm): Presets tab + Text & CTA + Colors & BG + Export, single slide, then add Shoes Layer and multi-slide after.

## B.5 Deliberate drops

- The **iPhone device mockup shell**, dynamic island, notification toast, mock shop/drawer/cart — they demo the design system, **not** the creator. Reuse nothing functional from them.
- The **arcade-style "Recreation Mode"**, live clock, glare toggle.
- Loading preset shoe photos from Goat/Unsplash in production (see Part C) — in production use Store/Product imagery.

---

# PART C — PLACEHOLDER IMAGES

## C.1 Where `sneaksy.html` gets its images

**Not an API.** They are **hard-coded direct-hotted CDN URLs** pasted into `state.slides[]`, `state.products[]`, and the `<select>` options:

- **7 sneakers** → Goat's image CDN: `https://image.goat.com/attachments/product_template_pictures/...` (e.g. `.../011/119/994/original/218099_00.png.png`) — **GOAT Group** product photography hotlinked off their CDN.
- **2 non-sneaker shoes** (Oxford brogue, Chelsea boot) → **Unsplash**: `https://images.unsplash.com/photo-1539185441755-769473a23570` and `photo-1549298916-b41d501d3772`.

The full 7 preset shoe URLs (use these as Checkstar's first-cut placeholders):

| URL | Sneaker |
|-----|---------|
| `https://image.goat.com/attachments/product_template_pictures/images/011/119/994/original/218099_00.png.png` | Air Jordan 1 Retro High 'Shadow' (charcoal) |
| `https://image.goat.com/attachments/product_template_pictures/images/008/870/353/original/235806_00.png.png` | Air Jordan 11 'Win Like '96' (red) |
| `https://image.goat.com/attachments/product_template_pictures/images/018/675/311/original/464372_00.png.png` | Air Jordan 6 Infrared (black/orange) |
| `https://image.goat.com/attachments/product_template_pictures/images/021/042/384/original/500924_00.png.png` | Wmns Air Jordan 12 'Reptile' (black) |
| `https://image.goat.com/attachments/product_template_pictures/images/010/634/133/original/303217_00.png.png` | Air Max 270 'White Orange' |
| `https://image.goat.com/attachments/product_template_pictures/images/020/806/444/original/507844_00.png.png` | Air Jordan 1 'Gym Red' |
| `https://image.goat.com/attachments/product_template_pictures/images/008/654/900/original/52015_00.png.png` | Air Jordan 11 'Space Jam' (black) |

> ⚠️ **Relying on Goat/Unsplash hotlinks is fragile & licensing-questionable.** Fine for a local demo; **never ship as real product data.**

## C.2 Free placeholder-image options (web + native)

| Option | How it works | Good for | Caveats |
|--------|--------------|----------|---------|
| **`checkers_images/` (local, 300 files)** | Real SA grocery product photos already in this repo (`.jpg`/`.webp`) | **Best match** — authentic Checkstar-style grocery placeholders, offline, no licensing worry | Filenames are product names; needs a mapping to Products |
| **Sneaksy shoes** (Part C.1) | Hotlined shoe images above | **First-cut per your instruction** — consistent, on-brief | Not grocery; hotlink fragility |
| `https://placehold.co/400x400?text=Bread` | SVG/PNG placeholder w/ text + color | Generic sized boxes, deterministic | Not a photo |
| `https://picsum.photos/seed/xxx/400/400` | Random photo w/ stable seed | Arbitrary demo imagery | Not product-specific |
| `https://loremflickr.com/400/400/bread` | Keyword-tagged photo | Word-matching a category (bread, milk) | Unreliable keywords, throttling |
| Unsplash via `images.unsplash.com` | Direct photo URLs | Curated hero shots | Hotlink fragility |
| `https://placehold.co` endpoint | see above | placeholders | — |

## C.3 Recommendation

1. **Now:** use the **7 Sneaksy shoe images** (Part C.1) as product placeholders in **both web + native** — off the shelf, matches the banner creator's asset set.
2. **Next, before shipping** (or when real Products exist): swap to **`checkers_images/`** (300 real grocery photos already in-repo) as the product placeholder source, since Checkstar is a supermarket and the shoe theme won't fit grocery.
3. Only if an online **API** is ever needed (searchable/rotating placeholder by category): use **Unsplash Source-style direct URLs or Picsum with seeds** — *not* Goat's CDN. Prefer local assets for reliability and to avoid hotlink licence issues.

---

# DECISIONS TO CONFIRM

1. **Web-app direction:** apply the Sneaksy **dark dashboard system** to admin/staff surfaces (recommended), leaving existing Customer web pages untouched for now — OR theme the whole web app dark. ⬅ affects Part A.3 scope.
2. **Accent orange source:** keep existing Checkstar `primary #EB6522` as canonical for web; start native from Sneaksy `#eb7a43`. Confirm both are acceptable (they differ slightly).
3. **Banner v1 scope:** presets + text + colors + export with a **single slide** first (recommended), or include the **dual-shoe layer + 3 slides** immediately?
4. **Placeholder source:** Sneaksy shoes now (your instruction), then `checkers_images/` — confirm the phase-1 → phase-2 swap.
5. Banner **persistence + roles**: confirm banner feature is scoped by **Store Context** (Store Owner/Manager) + Developer global. Deliverable surface lives under the staff/admin dashboards.

---

# GLOSSARY (Checkstar terms — use these, never the banned words)

- **Customer** – a person who shops at Checkstar (avoid *buyer / user* for shoppers).
- **Rider** – a Checkstar employee delivering Orders by motorbike (avoid *runner / courier / delivery person*).
- **Store** – a physical Checkstar retail location (avoid *branch / location*).
- **Store Owner / Store Manager / Logistics Officer / Developer** – operational roles (avoid *boss*).
- **Product** – an individual SKU, in exactly one Category, with a `unit` (each, kg, 2L) and optional `tags`.
- **Special** – a time-bound offer (product `sale_price` or a collection banner); reuse these meanings for banner content.
- **Order** – a Customer request for grocery delivery (avoid *cart/purchase* pre-checkout).