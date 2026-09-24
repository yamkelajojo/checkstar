import { useMotionPreferences } from '../../stores/motionPreferences';

/** Returns true when the device Reduce Motion accessibility setting is on. */
export function useReducedMotion(): boolean {
  return useMotionPreferences((s) => s.reduceMotion);
}
