# GreenBidder → Checkstar Boosters

> Living doc for the **mobile app** build. Source: `C:\Users\Acer\Documents\Software\MUT Adv\AppDev\GreenBidder\GreenBidder`.
>
> Purpose: reuse GreenBidder's **motion/transition system** and a few **simple smart-computation ideas**, without dragging in its complex parts. Customer-first, per our brief. Keep it simple — anything heavy that complicates the build gets skipped.

---

## What GreenBidder is

React Native (Expo) farmer marketplace. Big strengths:
- **Motion system** — one UI-thread animation toolkit (Reanimated) with small, reusable primitives + a "spring language" in `config/theme.js`.
- **Intent-based feel** — presses compress like iOS; haptics reinforce, never replace.
- **Layered entrance choreography** — pages "arrive," not "appear."
- **Pricing intelligence** — plain-English price guidance with a spring gauge.

> Tech note: Checkstar's example apps differ in stack (Flutter example vs this RN/Expo one). We borrow **concepts & patterns**, not code — they port cleanly to any framework (Flutter or RN). Flag the stack decision elsewhere.

---

## 1. Motion & Transition Treasure Trove

| Asset | File | What it does | Checkstar use |
|-------|------|--------------|---------------|
| **FadeSlideIn** | `src/components/shared/FadeSlideIn.jsx` | Mount entrance: opacity 0→1 + translateY 12→0 on ONE shared value; `delay` per item = staggered ripple | Entrance for sections/cards/rows on Home, Cart, Product list. Give each card a small delay (0/70/140ms) |
| **TactilePressable** | `src/components/shared/TactilePressable.jsx` | Spring compression on press (scale + lift), 4 variants (`default/compact/card/assertive`), opt-in haptic | **All** tappables: buttons, product cards, steppers. Card variant for big listing cards, assertive for "Remove" |
| **usePressAnimation** | `src/utils/usePressAnimation.js` | The press hook (scale 1→0.96, text animation) | Fallback when you need raw control of a custom pressable |
| **haptics.js** | `src/utils/haptics.js` | Intent-based: `tap / commit / success / warning / error / selection`, platform-tuned | Map to buying actions: cart add = `tap`, checkout submit = `commit`, order placed = `success`, validation fail = `error` |
| **AnimatedLogo** | `src/components/shared/AnimatedLogo.jsx` | **First-mount hero** (letters assemble, ~650ms) vs **subsequent quick fade** (250ms) — mode tracked in module | Checkstar splash/logo. Don't replay the big animation on every visit |
| **AnimatedError** | `src/components/shared/AnimatedError.jsx` | Field error text spring-expands; error banner drops in; `useErrorShake()` = classic "nope" 5-oscillation shake | Checkout + address validation. Shake the field, show inline error — no alerts |
| **FadeEdgeScroll** | `src/components/shared/FadeEdgeScroll.jsx` | Horizontal carousel with scroll-aware edge fades; `decelerationRate 0.92` + snap = fluid, not sticky | "Best Deals / Specials" horizontal strip on Home |
| **ScrollAwareCard** | `src/components/shared/ScrollAwareCard.jsx` | **Cover-flow**: scale 1→0.92 + opacity + ±8px parallax driven by distance-from-center. Focus zone keeps active card full | Featured/Special carousel items on Home |
| **useOnboardingSlideMotion** | `src/hooks/useOnboardingSlideMotion.js` | Staggered phase entrances (image→badge→title→subtitle) + parallax swipe | Onboarding / Welcome carousel |
| **SkeletonCard** | `src/components/shared/SkeletonCard.jsx` | Loading skeleton places | Product grid while fetching (replaces plain spinner) |

**Motion language to adopt (from `config/theme.js` springs):**
- Entrance: `withSpring(1, { damping: 20, stiffness: 180 })` — "settles onto paper."
- Press-in: fast/snappy `{ damping: 18, stiffness: 450 }`; press-out `{ damping: 22, stiffness: 400 }`.
- **Exit faster than enter** (~60-70% duration) — feels physical.
- Animate **opacity + transform only** — anything else (height/color) jumps layout.

---

## 2. Smart Computation — just the Price gauge (for now)

**Decision (confirmed):** we only take the **Price gauge (sale_price vs regular_price) + unit-aware comparison**. Everything else (recommendation engine, score→color, temporal decay, cold-start ranking, diversity cap) is **skipped for now.** Revisit later if we want personalisation.

| Idea | Source | What it is | Checkstar use |
|------|--------|------------|---------------|
| **Price gauge** | `PriceGuidance.jsx` (+ `marketPriceService.js`) | Compare a price to a reference on a small gauge with a spring marker + plain-English feedback (`Very low / Competitive / Sweet spot / Premium`) | **Product detail**: show `sale_price` vs `regular_price` on a small gauge — "This Special = Competitive (28% off)". Fits our Special pricing cascade. |
| **Unit-aware comparison** | `UNIT_MULTIPLIERS` in `PriceGuidance.jsx` | Convert a base-unit price to the displayed unit so comparisons are fair | Checkstar Products have a `unit` (each, kg, 2L) — normalize so a 2L vs 330ml cola compare fairly. |

---

## 2b. Confirmed: Product Summary Popup (small modal, **no AI**)

**Decision (confirmed):** reuse the small morph-from-badge **summary modal** on Product cards/detail — but drop the AI analysis/score. It just summarizes real Checkstar Product data.

| Asset | Source | What it does | Checkstar use |
|-------|--------|--------------|---------------|
| **Summary Popup** | `AIModal.jsx` + `AIModalContext.jsx` | Small modal that **springs from the tapped badge's source rect**, morphs open, shows a compact summary; **absorbs back** into the badge on close with a pulse; subtle entrances, tactile close, optional word-by-word reveal | Tap a small pill on a Product card → morphs open to a summary of real data. **No AI score** — content is plain fields |
| **Trigger badge** | `AIBadge.jsx` | The little pill/button on the card that launches the modal and absorbs back on close | The tappable pill on each Product card ("View summary / See deal") |
| **Price gauge inside modal** | `AIPriceScale.jsx` | Small gauge with spring marker (from §2) | Embed the **price gauge** in the modal so the summary shows "This Special = Competitive (28% off)" |

**Summary content (from real Product data, no AI):**
- Name + unit/quantity.
- **Price gauge**: `sale_price` vs `regular_price` + savings % (from our Special cascade).
- Key stat boxes: price per unit, total savings, unit/quantity.
- A static "why buy" note from tags/description, a storage/handling tip, and Store/delivery hint.

> Avoid: any AI-generated text, score dots, or `VisualDefects`-style analysis. Keep the summary factual and data-driven.

---

## 3. What we are NOT taking (deliberately)

- **All other computational ideas for now** — recommendation engine, score→color gradient, temporal decay, cold-start ranking, weighted scoring, diversity cap. Skipped until asked.
- AR / photo-analysis AI (`VisualDefects`, AI condition scoring) — out of scope.
- The **Farmer listing** flow — GreenBidder's supply side maps roughly to Checkstar's **Store Owner / Rider**, not our priority.
- Extra motion on every screen — reserve hero motion for **first impressions** (splash, onboarding, order-placed success).

---

## 4. Concrete mapping onto the Customer app (from MOBILE_APP_UX.md)

| Checkstar screen | Booster applied |
|------------------|-----------------|
| Splash / Onboarding | AnimatedLogo hero-once pattern + staggered welcome (useOnboardingSlideMotion) |
| Home | FadeEdgeScroll + ScrollAwareCard for **Specials** carousel; cold-start popularity ranking; SkeletonCard grid; TactilePressable on every card |
| Product grid / detail | **Special price gauge** (`sale_price` vs `regular_price`, unit-aware); inline TactilePressable stepper; unit-aware price label; tap badge → **Product Summary Popup** (§2b) |
| Cart | FadeSlideIn row entrances; haptic `tap` on add/remove; AnimatedError on min-order nudge |
| Checkout / Address | AnimatedError text + `useErrorShake` on invalid fields; `commit` haptic on submit; `success` on order placed |
| Rider (mock, later) | Order-placed → `success` haptic + success motion; order status timeline styled with FadeSlideIn |

---

## Decisions to confirm next
1. **Stack**: Flutter (the example app) or React Native/Expo (GreenBidder)? Affects how these patterns are re-implemented.
2. Which motion primitives to build **first** — my vote: `FadeSlideIn` + `TactilePressable`, plus the **Special price gauge** (the one computation we're keeping). Small, high-impact, reusable everywhere.
3. Confirm the **price gauge** lives on Product detail for the first cut.
4. **Product Summary Popup is confirmed** (§2b) — small pill on Product cards opens the morph-from-badge summary modal, **no AI**. Needs a Product card badge (dismissable) + modal host wired via a context like `AIModalContext`.