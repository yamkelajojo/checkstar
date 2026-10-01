import React, { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { Heart } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useFavoritesStore } from '../../stores/favoritesStore';
import type { ProductVO } from '../../lib/product';
import { useReducedMotion } from './useReducedMotion';

interface SaveHeartProps {
  productId: number;
  product?: ProductVO;
  size?: number;
  style?: any;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function SaveHeart({ productId, product, size = 18, style }: SaveHeartProps) {
  const reduceMotion = useReducedMotion();
  const isFavorite = useFavoritesStore((s) => s.favorites.has(productId));
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);

  const scale = useSharedValue(1);
  const burstScale = useSharedValue(0);
  const burstOpacity = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;

    if (isFavorite) {
      scale.value = withSequence(
        withSpring(1.45, { damping: 10, stiffness: 240 }),
        withSpring(1, { damping: 15, stiffness: 200 }),
      );
      burstScale.value = withSequence(
        withTiming(2.2, { duration: 400 }),
        withTiming(0, { duration: 0 }),
      );
      burstOpacity.value = withSequence(
        withTiming(0.6, { duration: 200 }),
        withTiming(0, { duration: 200 }),
      );
    }
  }, [isFavorite, reduceMotion]);

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const burstStyle = useAnimatedStyle(() => ({
    transform: [{ scale: burstScale.value }],
    opacity: burstOpacity.value,
  }));

  const handlePress = () => {
    toggleFavorite(productId, product);
    if (isFavorite) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
      style={[
        {
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 10,
          width: 30,
          height: 30,
          borderRadius: 15,
          backgroundColor: isFavorite ? 'rgba(255, 59, 48, 0.14)' : 'rgba(255, 255, 255, 0.88)',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.08,
          shadowRadius: 2,
          elevation: 2,
        },
        style,
      ]}
      hitSlop={8}
    >
      <Animated.View
        style={[
          burstStyle,
          {
            position: 'absolute',
            width: size + 16,
            height: size + 16,
            borderRadius: (size + 16) / 2,
            backgroundColor: 'rgba(255, 59, 48, 0.2)',
            top: -(size + 16 - 30) / 2,
            left: -(size + 16 - 30) / 2,
          },
        ]}
      />
      <Animated.View style={heartStyle}>
        <Heart
          size={size}
          color={isFavorite ? '#FF3B30' : '#475569'}
          fill={isFavorite ? '#FF3B30' : 'none'}
          strokeWidth={2}
        />
      </Animated.View>
    </AnimatedPressable>
  );
}
