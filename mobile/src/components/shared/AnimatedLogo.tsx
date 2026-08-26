import { useEffect, useRef } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Logo } from './Logo';
import { useReducedMotion } from './useReducedMotion';
import { useTheme } from '../../theme';

const HERO_DURATION = 650;
const QUICK_DURATION = 250;

const EASE = Easing.out(Easing.cubic);

// Hero-once: the big assembly animation plays on first mount of the process;
// subsequent mounts (navigation revisit) use a quick fade instead. Module-level
// by design — must outlive component unmounts. Tests can reset via resetHeroFlag.
let heroPlayed = false;

export function resetHeroFlag(): void {
  heroPlayed = false;
}

export function AnimatedLogo({ variant }: { variant: 'stacked' | 'lockup' }) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const mounted = useRef(!heroPlayed);
  const hero = mounted.current && !reduceMotion;
  if (hero) heroPlayed = true;

  const opacity = useSharedValue(0);
  const scale = useSharedValue(hero ? 0.6 : 0.92);

  useEffect(() => {
    if (hero) {
      opacity.value = withDelay(80, withTiming(1, { duration: HERO_DURATION, easing: EASE }));
      scale.value = withTiming(1, { duration: HERO_DURATION, easing: EASE });
    } else {
      opacity.value = withTiming(1, { duration: QUICK_DURATION });
      scale.value = withTiming(1, { duration: QUICK_DURATION });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={style}>
      <Logo variant={variant} tone={theme.name} />
    </Animated.View>
  );
}
