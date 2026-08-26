import { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { brand } from '../../theme/colors';
import { useReducedMotion } from './useReducedMotion';

/** Classic 5-oscillation "nope" shake. Returns the trigger + an animated style. */
export function useErrorShake(): { shake: () => void; animatedStyle: ReturnType<typeof useAnimatedStyle> } {
  const reduceMotion = useReducedMotion();
  const offset = useSharedValue(0);

  const shake = () => {
    if (reduceMotion) return;
    offset.value = withSequence(
      withTiming(-8, { duration: 60 }),
      withTiming(8, { duration: 90 }),
      withTiming(-6, { duration: 90 }),
      withTiming(6, { duration: 90 }),
      withTiming(-3, { duration: 90 }),
      withTiming(0, { duration: 90 }),
    );
  };

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));

  return { shake, animatedStyle };
}

interface AnimatedErrorProps {
  message?: string | null;
}

/** Field error text that spring-expands when a message appears. */
export function AnimatedError({ message }: AnimatedErrorProps) {
  const reduceMotion = useReducedMotion();
  const height = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      height.value = message ? 1 : 0;
      opacity.value = message ? 1 : 0;
      return;
    }
    height.value = withSpring(message ? 1 : 0, { damping: 18, stiffness: 220 });
    opacity.value = withTiming(message ? 1 : 0, { duration: 200 });
  }, [message, reduceMotion, height, opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    height: height.value * 18,
  }));

  return (
    <Animated.View style={[{ overflow: 'hidden' }, style]}>
      <Text style={{ color: brand.accent, fontSize: 13 }}>{message}</Text>
    </Animated.View>
  );
}
