# Mobile app is React Native (Expo), not Flutter

Status: accepted

The Customer delivery app is built with **React Native (Expo SDK 54) + TypeScript**, matching the GreenBidder scaffold we reuse motion/patterns from, instead of the Flutter (`Flutter-GroceryApp-main`) route noted in `MOBILE_APP_UX.md` / `SNEAKSY_DESIGN_SYSTEM.md`. Those notes are superseded by this ADR.

We chose RN/Expo because it is GreenBidder's actual stack (Reanimated 4, Tamagui, @react-navigation, @gorhom/bottom-sheet, expo-bloc of native modules), so the onboarding, motion and press-feel patterns port directly instead of being re-implemented in Dart; and it keeps a single language (TypeScript) and `zustand` shared with the Next.js `frontend/`. From the `.opensrc` cache we adopt only `zustand` 5.0.14 and `react` 19.2.8; the remaining ~43 cached packages are web/DOM-oriented and stay out. Flutter was rejected as a genuine alternative because it would force re-authoring every GreenBidder primitive and split the stack.

Consequences: the "native = Flutter" guidance in the mobile plan docs is now wrong and should be read as RN/Expo; Flutter example code may still inform UX but must not be ported as code.