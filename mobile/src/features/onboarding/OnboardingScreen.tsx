import { useRef, useState, useEffect } from 'react';
import Animated from 'react-native-reanimated';
import { View, Text, useWindowDimensions, NativeSyntheticEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import PagerView from 'react-native-pager-view';
import { ShoppingBasket, Tag, MapPin } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { textStyle, fontWeight, letterSpacing } from '../../theme/typography';
import { semanticSpacing, semanticRadius } from '../../theme/spacing';
import { TactilePressable } from '../../components/shared/TactilePressable';
import { Logo } from '../../components/shared/Logo';
import { FadeSlideIn, stagger } from '../../components/shared/FadeSlideIn';
import { copy } from '../../lib/strings';
import { storage, STORAGE_KEYS } from '../../lib/storage';
import { useNavigationSignal } from '../../stores/navigationSignal';
import { ProgressBar } from './components/ProgressBar';
import { useOnboardingSlideMotion } from './hooks/useOnboardingSlideMotion';
import { haptic } from '../../lib/haptics';

const SLIDES = [
  {
    id: 'groceries',
    title: copy.onboarding.slides.groceriesTitle,
    subtitle: copy.onboarding.slides.groceriesSubtitle,
    Icon: ShoppingBasket,
    badge: 'Fresh daily',
    accentColor: brand.orange,
  },
  {
    id: 'specials',
    title: copy.onboarding.slides.specialsTitle,
    subtitle: copy.onboarding.slides.specialsSubtitle,
    Icon: Tag,
    badge: 'Weekly deals',
    accentColor: brand.warning,
  },
  {
    id: 'tracking',
    title: copy.onboarding.slides.trackingTitle,
    subtitle: copy.onboarding.slides.trackingSubtitle,
    Icon: MapPin,
    badge: 'Real-time',
    accentColor: brand.success,
  },
];

export function OnboardingScreen() {
  const theme = useTheme();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const pagerRef = useRef<PagerView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const signal = useNavigationSignal((s) => s.signal);

  const motion = useOnboardingSlideMotion({
    slideCount: SLIDES.length,
    screenWidth: SCREEN_WIDTH,
  });

  useEffect(() => {
    motion.activateSlide(0);
  }, []);

  const finish = async () => {
    await storage.set(STORAGE_KEYS.onboardingSeen, true);
  };

  const startShopping = async () => {
    await finish();
    signal();
  };

  const iAmARider = async () => {
    await finish();
    signal();
  };

  const handlePageSelected = (e: NativeSyntheticEvent<{ position: number }>) => {
    const index = e.nativeEvent.position;
    setActiveIndex(index);
    motion.activateSlide(index);
    haptic.selection();
  };

  const handlePageScroll = (e: NativeSyntheticEvent<{ position?: number; offset?: number }>) => {
    motion.bindPagerScroll(e);
  };

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      pagerRef.current?.setPage(activeIndex + 1);
      return;
    }
    startShopping();
  };

  const handleSkip = () => {
    finish();
    signal();
  };

  const currentSlide = SLIDES[activeIndex];
  const isLastSlide = activeIndex === SLIDES.length - 1;

  const skipContainerStyle = { position: 'absolute' as const, top: semanticSpacing.screenPadding, right: semanticSpacing.screenPadding, zIndex: 10 };
  const skipButtonStyle = { paddingHorizontal: semanticSpacing.md, paddingVertical: semanticSpacing.xxs };
  const skipTextStyle = { ...textStyle.caption, fontWeight: fontWeight.semibold, color: theme.colors.border.subtle };
  const pagerStyle = { flex: 1 };
  const slideStyle = { flex: 1, paddingHorizontal: semanticSpacing.xl, justifyContent: 'center' as const };
  const imageContainerStyle = {
    height: SCREEN_WIDTH * 0.6,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: semanticSpacing.xl,
  };
  const imageFrameStyle = {
    width: SCREEN_WIDTH * 0.84,
    height: SCREEN_WIDTH * 0.58,
    borderRadius: semanticRadius.imageFrame,
    overflow: 'hidden' as const,
    backgroundColor: theme.name === 'dark' ? theme.colors.surface.primary : brand.orangeSoft,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  };
  const contentStyle = { alignItems: 'center' as const };
  const badgeStyle = { paddingHorizontal: semanticSpacing.md, paddingVertical: semanticSpacing.xxs, borderRadius: semanticRadius.badge, marginBottom: semanticSpacing.lg };
  const badgeTextStyle = { ...textStyle.caption, fontWeight: fontWeight.semibold };
  const titleStyle = {
    ...textStyle.h2,
    color: theme.colors.text.primary,
    textAlign: 'center' as const,
    marginBottom: semanticSpacing.md,
  };
  const subtitleStyle = {
    ...textStyle.body,
    color: theme.colors.text.secondary,
    textAlign: 'center' as const,
    paddingHorizontal: semanticSpacing.lg,
  };
  const controlsStyle = { paddingHorizontal: semanticSpacing.xl, paddingBottom: semanticSpacing.xl, alignItems: 'center' as const, backgroundColor: theme.colors.background.primary };
  const nextButtonStyle = {
    height: 56,
    borderRadius: semanticRadius.button,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginTop: semanticSpacing.lg,
    width: '100%' as const,
  };
  const nextButtonTextStyle = { color: theme.colors.text.inverse, ...textStyle.buttonPrimary };
  const riderTextStyle = { textAlign: 'center' as const, color: theme.colors.text.secondary, fontWeight: fontWeight.semibold, ...textStyle.bodySmall };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      <StatusBar
        barStyle={theme.name === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background.primary}
      />

      <View style={skipContainerStyle}>
        {activeIndex < SLIDES.length - 1 && (
          <TactilePressable onPress={handleSkip} haptic="light" style={skipButtonStyle}>
            <Text style={skipTextStyle}>{copy.onboarding.skip}</Text>
          </TactilePressable>
        )}
      </View>

      <PagerView
        ref={pagerRef}
        style={pagerStyle}
        initialPage={0}
        onPageSelected={handlePageSelected}
        onPageScroll={handlePageScroll}
        scrollEnabled
        testID="onboarding-pager"
      >
        {SLIDES.map((slide, index) => {
          const { imageStyle, badgeStyle: motionBadgeStyle, titleStyle: motionTitleStyle, subtitleStyle: motionSubtitleStyle } = motion.getSlideStyles(index);
          return (
            <View key={slide.id} style={slideStyle} collapsable={false}>
              <View style={imageContainerStyle}>
                <FadeSlideIn delay={0} distance={0}>
                  <Animated.View style={[imageFrameStyle, imageStyle]}>
                    <View
                      style={{
                        width: 120,
                        height: 120,
                        borderRadius: 60,
                        backgroundColor: theme.name === 'dark' ? theme.colors.surface.primary : brand.orangeSoft,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <slide.Icon size={52} color={slide.accentColor} strokeWidth={1.75} />
                    </View>
                  </Animated.View>
                </FadeSlideIn>
              </View>

              <View style={contentStyle}>
                <FadeSlideIn delay={stagger.standard}>
                  <Animated.View style={motionBadgeStyle}>
                    <View style={[badgeStyle, { backgroundColor: slide.accentColor + '20' }]}>
                      <Text style={[badgeTextStyle, { color: slide.accentColor }]}>{slide.badge}</Text>
                    </View>
                  </Animated.View>
                </FadeSlideIn>

                <FadeSlideIn delay={stagger.standard * 2}>
                  <Animated.Text style={[titleStyle, motionTitleStyle]}>{slide.title}</Animated.Text>
                </FadeSlideIn>

                <FadeSlideIn delay={stagger.standard * 3}>
                  <Animated.Text style={[subtitleStyle, motionSubtitleStyle]}>{slide.subtitle}</Animated.Text>
                </FadeSlideIn>
              </View>
            </View>
          );
        })}
      </PagerView>

      <View style={controlsStyle}>
        <ProgressBar
          current={activeIndex + 1}
          total={SLIDES.length}
          accentColor={currentSlide.accentColor}
          motionState={motion.getProgressStyles()}
        />
        <TactilePressable
          style={[nextButtonStyle, { backgroundColor: currentSlide.accentColor }]}
          onPress={handleNext}
          haptic="commit"
        >
          <Text style={nextButtonTextStyle}>
            {isLastSlide ? copy.onboarding.startShopping : 'Next'}
          </Text>
        </TactilePressable>
        <TactilePressable onPress={iAmARider} haptic="selection">
          <Text style={riderTextStyle}>{copy.onboarding.iAmARider}</Text>
        </TactilePressable>
      </View>
    </SafeAreaView>
  );
}