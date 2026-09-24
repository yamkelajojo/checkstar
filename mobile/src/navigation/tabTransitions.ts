/**
 * Tab Transitions — minimal.
 *
 * The native PagerView owns the swipe; the tab bar indicator owns the
 * position feedback. This module only defines the tab order and the
 * direction helper (kept for haptics/ordering logic and tests).
 *
 * The earlier Apple-polish layer (directional slides, motion blur,
 * stagger coordination) was removed: it added crash surface on device
 * and the motion was not wanted.
 */

export const TAB_ORDER = ['Home', 'Browse', 'Favorites', 'Cart', 'Account'] as const;
export type TabName = typeof TAB_ORDER[number];

export function getTabIndex(name: TabName): number {
  return (TAB_ORDER as readonly string[]).indexOf(name);
}

/**
 * Direction: 1 = moving right (to higher index), -1 = left, 0 = same or initial.
 */
export function getTabDirection(prevIndex: number, nextIndex: number): number {
  if (prevIndex < 0) return 0; // initial mount, no direction
  if (prevIndex === nextIndex) return 0;
  return nextIndex > prevIndex ? 1 : -1;
}
