# Checkstar Mobile App — UX & Page Map

> Living doc. Updates as we discuss. The page map is derived from the Flutter grocery app (`Flutter-GroceryApp-main`) as a **UX reference only** — the build stack is **React Native (Expo SDK 54 — PINNED, see `mobile/README.md#sdk-pin`) + TypeScript** (see `docs/adr/0001-mobile-react-native-expo.md`). Reuse its UX patterns; do not port its Dart code.
>
> ⚠️ **SDK PIN:** Mobile is locked to **SDK 54** to match **Expo Go 54.0.2** on device fleet (iPhone 17). Upgrading to 55+ breaks loading. See `mobile/AGENTS.md` banner and `mobile/app.json:sdkVersion` — do not upgrade without updating Go on all devices.
>
> **Priority:** Customer (buyer) first. **Rider** second (can be mocked / non-working). Store Owner & Manager dashboards are OUT of scope for now.

_Ubiquitous language from CONTEXT.md applies: Customer, Rider, Store, Order, Dispatch, Special, Product, etc._

---

## Navigation Model

A Customer app = **bottom-nav shell** (4 tabs), same pattern as the Flutter example's `home.dart` (PageView + BottomNavigationBar):

| Tab | Screen | Notes |
|-----|--------|-------|
| 🏪 Home | Browse dashboard | promo, categories, Specials, delivery status |
| 🗂 Browse | Categories → Products | 2-pane browse |
| 🛒 Cart | Cart | live badge count |
| 👤 Account | Profile / Orders | settings + order history |

- **Cart badge** = live stream count, exactly like the Flutter example's `_buildCartNavigationBarItem`.
- Keep tabs alive + **persist cart on app pause** (the example's 72h-save pattern).
- ⚠️ Flutter app mislabels the 4th tab "Settings" while it's really Profile. We'll call it **Account**.

---

## Customer Screens (mapped from Flutter example)

| # | Flutter example page | Checkstar screen | UX notes / what to keep |
|---|----------------------|------------------|--------------------------|
| 1 | Splash | **Splash** | Brand screen. Don't hard-code a sleep; navigate on boot/init-complete. Optional auth check → route to Home or Onboarding. |
| 2 | Welcome | **Onboarding / Welcome** | Hero value prop ("Fresh groceries delivered to your door, Durban"), one CTA. Flutter's "Shop now" misleadingly led to registration — ours can CTA directly into browsing, delay sign-in. |
| 3 | Registration (OTP) | **Sign up / Sign in (phone → OTP)** | Keep phone-first numeric flow with country code, but actually VERIFY the OTP (Flutter stubs this). Split: Customer registers with email+password; Rider has a separate flow. |
| 4 | Dashboard | **Home (delivery-aware)** | Store/resolved-delivery-area header, **free-delivery threshold**, search bar, carousel, categories grid, "Best Deals / Specials 🔥". Show store context + delivery ETA up top. |
| 5 | Categories | **Browse (Categories → Store)** | 2-pane rail + product list. Note: Checkstar needs Store-aware inventory. Prefer a plain list over `ExpansionTile` nesting — fewer taps. |
| 6 | Product grid | **Product grid / Store shelf** | 2-col grid, sale price vs struck-through regular + % off, corner OFF ribbon, and **inline + / count / − stepper**. This is the single most-valuable commerce pattern to steal. |
| 7 | Product detail | **Product detail** | Zoomable gallery, price/unit, key points, sticky bottom CTA (Add to cart / stepper). Make key-points REAL (recalc from data), not hardcoded like Flutter. Ties to Product `sale_price`/Special cascade. |
| 8 | Cart | **Cart** | Item list (tap → detail), **cart-persist trust note**, sticky bottom: subtotal, **min-order nudge**, disabled/enabled **Checkout**. Replaces the Flutter dead-end dialog with a REAL checkout flow. |
| 9 | Profile | **Account** | Avatar, identity, Delivery prefs, location, orders, terms, about/rate/contact. Make orders real (Order status timeline), not "Guest" stub. |

---

## ❗ Replace the Flutter dead-ends with real Checkstar flows

The example is a demo: **search, AR, checkout, and auth are all stubs.** Checkstar must not copy the dead ends. Substitutions:

| Flutter stub | Checkstar real flow |
|--------------|---------------------|
| Fake read-only search bar | Real product search across the Store's inventory |
| Checkout → "Thanks" dialog | Checkout → address → **Dispatch** → order status timeline |
| Skip OTP | Verified phone/email + auth |
| "Guest" profile | Real account + order history |
| (none) | **Delivery tracking** — Rider assignment + status: `pending → confirmed → preparing → out_for_delivery → delivered` |

---

## Rider screens (secondary — may be mocked)

Kept lightweight. Mock is acceptable: the UI exists, it just doesn't need a live backend.

| Flutter ref | Checkstar Rider screen | Notes |
|------------|------------------------|-------|
| — (new) | **Rider Login / Availability** | Toggle `available` on/off. Separate Rider registration (vehicle, banking). |
| — (new) | **Rider Job List** | Incoming confirmed Orders to claim (first-claim-wins, `SKIP LOCKED`). |
| (Product detail) | **Rider Order detail** | Items to buy at the Store, mark items bought → decrements stock. |
| — (new) | **Rider Delivery** | Mark `out_for_delivery`, then confirm delivery. |
| (Profile) | **Rider earnings/stats** | Review-triggered stats (avg rating + deliveries). |

---

## Out of scope (for now)

- Store Owner dashboard
- Store Manager dashboard
- Logistics Officer console

(These exist in the broader platform, but not in this customer-first mobile pass.)

---

## UX principles to carry forward

1. **Inline cart steppers on cards** — cut add-to-cart friction to one tap.
2. **Persist cart + trust messaging** — recover abandoned carts, calm buyers.
3. **Phone-first registration** — right for SA delivery onboarding.
4. **Free-delivery threshold + min-order nudges** — honest, clear cost signals.
5. **Never hardcode commerce data** (prices, ratings, key points) — pull from the real pricing cascade.
6. **Live order-status timeline** — the differentiator vs the demo app.