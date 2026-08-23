# 18 — Final Verification + iPhone Fleet Acceptance

**What to build:** End-to-end verification on Android emulator + final acceptance on iPhone 17 fleet (Expo Go 54.0.2). All quality bar criteria met.

**Blocked by:** 01-fix-logo-crash, 02-env-local-for-emulator, 03-install-tamagui-v2, 04-create-tamagui-config, 05-wrap-tamagui-provider, 06-migrate-shared-components-batch1, 07-migrate-feedback-components, 08-port-greenbidder-utils, 09-replace-lucide-icons, 10-home-tab-overhaul, 11-browse-tab-overhaul, 12-cart-tab-overhaul, 13-account-tab-overhaul, 14-auth-onboarding-overhaul, 15-product-detail-overhaul, 16-checkout-order-detail-overhaul, 17-logo-asset-swap

**Status:** ready-for-agent

- [ ] Android emulator (`Pixel_3a_API_34`):
  - App boots → Splash → Onboarding/Auth → Home tab
  - All 4 tabs navigate without crashes (<300ms switch)
  - Home: carousel, categories, specials scroll 60fps
  - Browse: 2-pane rail + grid, category switching instant
  - Cart: add/remove items, stepper, sticky bottom, checkout flow
  - Account: sign in/out, orders list, order detail
  - Product detail: gallery, price, sticky CTA
  - Checkout → OrderPlaced → OrderDetail status timeline
  - Auth/Onboarding/StorePicker: forms work, validation, toasts
  - All text AA contrast, TalkBack labels present
  - `npm run typecheck` passes
  - `npm test` passes (142/142)
- [ ] iPhone fleet (user):
  - Scan QR from Metro, run on Expo Go 54.0.2
  - Same flow verification on real devices
  - No `expo-notifications` warnings block UI
  - Backend connectivity via LAN IP works
  - Sign off: all acceptance criteria from `docs/grilling/mobile-ui-overhaul.md` met

**Notes:** This is the integration verification ticket. All previous tickets must complete. User does final acceptance on their iPhone 17 fleet per AGENTS.md. Quality bar: zero crashes, 60fps scroll, AA contrast, TalkBack, <300ms tab switch, <1s splash→interaction, offline resilience.