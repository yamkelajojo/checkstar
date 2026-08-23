# 14 — Auth + Onboarding Screens Overhaul

**What to build:** Splash (`SplashScreen.tsx`), Onboarding (`OnboardingScreen.tsx`), Auth (`AuthScreen.tsx`), StorePicker (`StorePickerScreen.tsx`) polished with consistent branding, form validation, smooth transitions.

**Blocked by:** 01-fix-logo-crash, 06-migrate-shared-components-batch1, 07-migrate-feedback-components, 08-port-greenbidder-utils, 09-replace-lucide-icons, 17-logo-asset-swap

**Status:** ready-for-agent

- [ ] Splash: `AnimatedLogo` stacked variant, centered, fades to Onboarding/Auth; <1s to first interaction
- [ ] Onboarding: hero value prop ("Fresh groceries delivered to your door, Durban"), `ProgressBar` (3 steps), CTA → Auth or StorePicker
- [ ] Auth: email/password + OTP flow (Customer), separate Rider registration (vehicle, banking), form validation, error toasts, `Logo` lockup at top
- [ ] StorePicker: modal, list of stores with distance/delivery radius, auto-select nearest with available rider
- [ ] All inputs: `TextInput` with `text.body`, `radius.md`, `shadows.resting`, focus ring `primary`
- [ ] Transitions: `springs.standard` for screen transitions, `springs.gentle` for form field focus
- [ ] TalkBack: form fields labeled, errors announced live

**Notes:** Reference `mobile/src/features/onboarding/SplashScreen.tsx`, `OnboardingScreen.tsx`, `mobile/src/features/auth/AuthScreen.tsx`, `mobile/src/features/store/StorePickerScreen.tsx`. GreenBidder `src/screens/onboarding/`, `src/screens/auth/`. MOBILE_APP_UX.md maps Flutter Splash/Welcome/Registration → these screens. Logo asset swap (17) must complete for correct branding on Splash/Onboarding/Auth.