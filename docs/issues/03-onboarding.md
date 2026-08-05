## What to build

The show-once Onboarding flow: 3 value-prop slides with staggered entrances, branded hero logo, and the two entry CTAs (Guest browse / Rider registration), gated locally so it only plays once.

## Acceptance criteria

- [ ] 3 value-prop slides via `react-native-pager-view`: (1) fresh groceries delivered to your door (Durban), (2) save on Specials, (3) track delivery live; staggered entrances (image → badge → title → subtitle) + parallax swipe.
- [ ] Stacked `Logo` hero-once animation at top; Caveat script on emphasised words.
- [ ] Primary CTA **"Start shopping"** → Browse as Guest (no auth required; sign-in prompted at checkout).
- [ ] Secondary **"I'm a Rider"** → Rider registration route (rider registration form itself is Slice 8; may link to a placeholder here).
- [ ] Skip button; show-once gating via `@react-native-async-storage/async-storage`.
- [ ] Returning users: Splash → Home quick fade (onboarding not replayed).
- [ ] Reduce Motion safe (all entrances snap to end state).

## Blocked by

- Blocked by Slice 2 (brand & motion foundation)
