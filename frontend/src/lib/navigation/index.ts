/**
 * Checkstar Navigation & Motion Service Architecture
 *
 * Components:
 * - transition-service.ts  (global state, start/complete/cancel)
 * - useNavigationMotion.ts (React composable for lifecycle)
 * - NavigationProgress.tsx (visual progress bar)
 * - PageTransitionController.tsx (enter/leave orchestration)
 * - header-motion.ts        (varied motion presets)
 *
 * Usage flow:
 * 1. User clicks link → NavLink triggers startNavigation()
 * 2. NavigationProgress shows loading bar
 * 3. PageTransitionController resolves with enter animation
 * 4. Next page mounts with motion.div enter transition
 * 5. If navigation is interrupted (cancelled or rapid click), abort() cleans up
 */
export { startNavigation, completeNavigation, cancelNavigation } from './transition-service';
export { useNavigationMotion } from './useNavigationMotion';
