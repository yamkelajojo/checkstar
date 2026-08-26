import { useMemo } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { springs, onboardingMotionSpec } from '../../../theme/motion';

const PHASE_OFF = 0;
const PHASE_ON = 1;

export const useOnboardingSlideMotion = ({ slideCount, screenWidth }: { slideCount: number; screenWidth: number }) => {
  const pagerOffsetX = useSharedValue(0);
  const activeIndex = useSharedValue(0);
  const phaseProgress = Array.from({ length: slideCount }).map(() =>
    useSharedValue(0)
  );

  const bindPagerScroll = (e: { nativeEvent: { position?: number; offset?: number } }) => {
    const { position = 0, offset = 0 } = e.nativeEvent || {};
    pagerOffsetX.value = (position + offset) * screenWidth;
  };

  const activateSlide = (index: number) => {
    activeIndex.value = index;

    for (let i = 0; i < slideCount; i += 1) {
      if (i === index) {
        phaseProgress[i].value = PHASE_OFF;
        phaseProgress[i].value = withSpring(PHASE_ON, onboardingMotionSpec.enterSpring);
      } else {
        phaseProgress[i].value = withSpring(PHASE_OFF, onboardingMotionSpec.exitSpring);
      }
    }
  };

  const getSlideStyles = (index: number) => {
    const imageStyle = useAnimatedStyle(() => {
      const center = index * screenWidth;
      const translateX = interpolate(
        pagerOffsetX.value,
        [center - screenWidth, center, center + screenWidth],
        [-screenWidth * 0.12, 0, screenWidth * 0.12],
        Extrapolate.CLAMP
      );
      const scale = interpolate(
        pagerOffsetX.value,
        [center - screenWidth, center, center + screenWidth],
        [0.94, 1, 0.94],
        Extrapolate.CLAMP
      );
      const phase = phaseProgress[index].value;
      return {
        opacity: interpolate(
          phase,
          [onboardingMotionSpec.phaseOffsets.image, 1],
          [0, 1],
          Extrapolate.CLAMP
        ),
        transform: [{ translateX }, { scale }],
      };
    });

    const badgeStyle = useAnimatedStyle(() => {
      const phase = phaseProgress[index].value;
      return {
        opacity: interpolate(
          phase,
          [onboardingMotionSpec.phaseOffsets.badge, 1],
          [0, 1],
          Extrapolate.CLAMP
        ),
        transform: [
          {
            translateY: interpolate(
              phase,
              [onboardingMotionSpec.phaseOffsets.badge, 1],
              [14, 0],
              Extrapolate.CLAMP
            ),
          },
        ],
      };
    });

    const titleStyle = useAnimatedStyle(() => {
      const phase = phaseProgress[index].value;
      return {
        opacity: interpolate(
          phase,
          [onboardingMotionSpec.phaseOffsets.title, 1],
          [0, 1],
          Extrapolate.CLAMP
        ),
        transform: [
          {
            translateY: interpolate(
              phase,
              [onboardingMotionSpec.phaseOffsets.title, 1],
              [18, 0],
              Extrapolate.CLAMP
            ),
          },
        ],
      };
    });

    const subtitleStyle = useAnimatedStyle(() => {
      const phase = phaseProgress[index].value;
      return {
        opacity: interpolate(
          phase,
          [onboardingMotionSpec.phaseOffsets.subtitle, 1],
          [0, 1],
          Extrapolate.CLAMP
        ),
        transform: [
          {
            translateY: interpolate(
              phase,
              [onboardingMotionSpec.phaseOffsets.subtitle, 1],
              [12, 0],
              Extrapolate.CLAMP
            ),
          },
        ],
      };
    });

    return { imageStyle, badgeStyle, titleStyle, subtitleStyle };
  };

  const getProgressStyles = useMemo(
    () => () => ({
      activeIndex,
      slideCount,
    }),
    [slideCount]
  );

  return {
    bindPagerScroll,
    activateSlide,
    getSlideStyles,
    getProgressStyles,
  };
};