/**
 * Navigation Transition & Motion Service
 *
 * Centralized architecture for:
 * - Navigation state tracking (start, progress, complete)
 * - Page leave / enter orchestration
 * - Loading progress indicator
 * - Reduced motion handling
 * - Rapid/cancelled navigation cleanup
 */

import { useRef, useCallback, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';

// ============================================================================
// STATE
// ============================================================================

type NavState = 'idle' | 'leaving' | 'entering';
type NavStatus = 'ready' | 'loading';

let globalNavState: NavState = 'idle';
let globalNavStatus: NavStatus = 'ready';
let globalProgress = 0;
let subscribers: Set<() => void> = new Set();
// Handle for the post-complete reset so a fresh navigation can cancel it
// (rapid navs would otherwise clear the new bar mid-sweep).
let completeResetTimer: ReturnType<typeof setTimeout> | null = null;

function emit() {
  subscribers.forEach((fn) => fn());
}

export function getNavState(): NavState {
  return globalNavState;
}
export function getNavStatus(): NavStatus {
  return globalNavStatus;
}
export function getProgress(): number {
  return globalProgress;
}

export function setNavState(s: NavState) {
  globalNavState = s;
  emit();
}
export function setNavStatus(s: NavStatus) {
  globalNavStatus = s;
  emit();
}
export function setProgress(p: number) {
  globalProgress = Math.max(0, Math.min(1, p));
  emit();
}

export function subscribeToNav(cb: () => void): () => void {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}

// ============================================================================
// NAVIGATION LIFECYCLE HOOKS
// ============================================================================

/**
 * Starts a navigation (called on link click).
 * Initiates the leave transition and loading state.
 */
export function startNavigation(): () => void {
  if (completeResetTimer) {
    clearTimeout(completeResetTimer);
    completeResetTimer = null;
  }
  setNavState('leaving');
  setNavStatus('loading');
  setProgress(0);

  // Animate progress quickly to ~40% to show activity,
  // then hold until response arrives
  const interval = setInterval(() => {
    const current = globalProgress;
    const next = current + 0.05;
    if (next >= 0.4) {
      clearInterval(interval);
      setProgress(0.4);
    } else {
      setProgress(next);
    }
  }, 80);

  return () => {
    clearInterval(interval);
  };
}

/**
 * Completes navigation (called when new page content is ready).
 * Resolves leave transition quickly, then triggers enter.
 */
export function completeNavigation(): () => void {
  // If we're still in leaving state, resolve quickly
  if (globalNavState === 'leaving') {
    setNavState('entering');
    setProgress(1);

    // Fast resolve then back to idle
    completeResetTimer = setTimeout(() => {
      completeResetTimer = null;
      setNavStatus('ready');
      setProgress(0);
      setNavState('idle');
    }, 300);
  } else {
    setNavStatus('ready');
    setProgress(0);
    setNavState('idle');
  }
  return () => {};
}

/**
 * Cancels navigation (e.g. user clicked back or interrupted).
 */
export function cancelNavigation() {
  setNavState('idle');
  setNavStatus('ready');
  setProgress(0);
}

// ============================================================================
// REACT HOOK
// ============================================================================

export function useNavigationState() {
  const state = useSyncExternalStore(subscribeToNav, () => globalNavState, () => globalNavState);
  const status = useSyncExternalStore(subscribeToNav, () => globalNavStatus, () => globalNavStatus);
  const progress = useSyncExternalStore(subscribeToNav, () => globalProgress, () => globalProgress);
  return { state, status, progress };
}
