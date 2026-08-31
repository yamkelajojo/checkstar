/**
 * Navigation Motion Architecture
 *
 * This file provides the centralized composable/service layer for navigation motion.
 * It connects Inertia-style navigation events (simulated via router events and component lifecycle)
 * to the animation and progress systems.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { startNavigation, completeNavigation, cancelNavigation } from '@/lib/navigation/transition-service';

/**
 * Central hook for managing page-level navigation motion lifecycle.
 */
export function useNavigationMotion() {
  const router = useRouter();
  const [isLeaving, setIsLeaving] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  const beginLeave = useCallback(() => {
    setIsLeaving(true);
    setIsEntering(false);
    const cleanup = startNavigation();
    cleanupRef.current = cleanup;
  }, []);

  const resolveEnter = useCallback(() => {
    setIsLeaving(false);
    setIsEntering(true);
    completeNavigation();
    setTimeout(() => {
      setIsEntering(false);
      cleanupRef.current?.();
      cleanupRef.current = null;
    }, 250);
  }, []);

  const abort = useCallback(() => {
    setIsLeaving(false);
    setIsEntering(false);
    cancelNavigation();
    cleanupRef.current?.();
    cleanupRef.current = null;
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => abort();
  }, [abort]);

  return { isLeaving, isEntering, beginLeave, resolveEnter, abort };
}
