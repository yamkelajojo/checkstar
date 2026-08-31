# Checkstar Navigation & Motion Architecture

## Services
- `transition-service.ts` — Global navigation state (idle/leaving/entering, ready/loading, progress 0-1). Subscribable.
- `useNavigationMotion.ts` — React composable connecting router lifecycle to transition service.
- `header-motion.ts` — 5 motion presets for varied header identity.

## Components
- `Logo.tsx` — Exact mobile logo (SVG paths + typography: Checkstar / cares enough with Handlee accent).
- `NavigationProgress.tsx` — Top progress bar that appears during navigation loading.
- `PageTransitionController.tsx` — Page enter/leave animations via motion.div + AnimatePresence.
- `WritingText.tsx` — Word-by-word or character-by-character reveal animation.
- `AnimatedNumber.tsx` — Animated number counter with bounce/spring motion.
- `CurvyUnderline.tsx` — Decorative hand-drawn curved underline for expressive headers.
- `Header.tsx` — Updated with new logo, warm palette background, motion-enabled mobile menu, animated cart count.

## Design System Updates
- Font: `Handlee` loaded via `next/font/google`, applied to `font-display` and `font-accent`.
- Background: `#FFFCF9` (warm white) matching mobile palette.
- Text: `#1B1816` (warm ink) matching mobile palette.
- Brand orange: `#EB6522` preserved throughout.
- Curvy/hand-drawn header treatment integrated via decorative SVG underline and expressive typography.

## Page-Level Integration
- Public layout (`(public)/layout.tsx`) uses `AnimatePresence` + `motion.main` with page-enter/leave transitions.
- About page (`about/AboutClient.tsx`) uses `WritingText` for paragraphs and `CurvyUnderline` for header.
- Cart drawer (`CartDrawer.tsx`) uses smooth motion animation for empty state appearance.
- Navigation progress appears on internal link clicks via `NavLink` integration with `startNavigation()`.

## Accessibility & Performance
- `useReducedMotion()` respected everywhere; transitions fall back to instant state changes.
- `prefers-reduced-motion` handled at CSS and component level.
- Rapid navigation handled: `cancelNavigation()` cleans up interval/state on interrupted navigation.
- No artificial delays: page leave animation resolves quickly when content is ready; progress bar reflects actual timing.
