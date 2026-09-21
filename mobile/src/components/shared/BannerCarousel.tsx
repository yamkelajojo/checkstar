import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, Pressable, Dimensions, FlatList, type ViewToken } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';
import { textStyle, fontWeight } from '../../theme/typography';
import { semanticSpacing } from '../../theme/spacing';
import type { ApiBanner, ApiBannerSlide } from '../../lib/types';
import { haptic } from '../../lib/haptics';

const SCREEN_WIDTH = Dimensions.get('window').width;
const AUTO_ADVANCE_MS = 5000;

interface BannerCarouselProps {
  banners: ApiBanner[];
  onSlidePress?: (slide: ApiBannerSlide) => void;
}

export function BannerCarousel({ banners, onSlidePress }: BannerCarouselProps) {
  const theme = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeSlides = useMemo(() => {
    const slides: (ApiBannerSlide & { bannerId: number; bannerName: string })[] = [];
    for (const banner of banners) {
      if (banner.slides?.length) {
        for (const slide of banner.slides) {
          slides.push({ ...slide, bannerId: banner.id, bannerName: banner.name });
        }
      }
    }
    return slides;
  }, [banners]);

  const totalSlides = activeSlides.length;

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % totalSlides;
        flatListRef.current?.scrollToOffset({ offset: next * SCREEN_WIDTH, animated: true });
        return next;
      });
    }, AUTO_ADVANCE_MS);
  }, [totalSlides]);

  useEffect(() => {
    if (totalSlides === 0) return;
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [totalSlides, resetTimer]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleSlidePress = useCallback(
    (slide: ApiBannerSlide) => {
      if (onSlidePress) onSlidePress(slide);
    },
    [onSlidePress],
  );

  if (totalSlides === 0) return null;

  const renderSlide = ({ item }: { item: (typeof activeSlides)[number] }) => {
    const colors = item.colors?.length ? item.colors : ['#EB6522', '#CC4400'];
    const isGradient = item.bgType === 'gradient' || item.bgType === 'radial';

    const slideContent = (
      <View
        style={[
          {
            marginHorizontal: semanticSpacing.screenPadding,
            borderRadius: 16,
            padding: semanticSpacing.xl,
            minHeight: 140,
            justifyContent: 'center',
            overflow: 'hidden',
          },
          !isGradient ? { backgroundColor: colors[0] } : undefined,
        ]}
      >
        {item.pattern === 'dots' && <PatternOverlay type="dots" />}
        {item.pattern === 'lines' && <PatternOverlay type="lines" />}
        {item.pattern === 'circles' && <PatternOverlay type="circles" />}

        <View style={{ zIndex: 1 }}>
          {item.subtitle ? (
            <Text
              style={{
                ...textStyle.caption,
                color: 'rgba(255,255,255,0.8)',
                marginBottom: 4,
              }}
              numberOfLines={1}
            >
              {item.subtitle}
            </Text>
          ) : null}
          <Text
            style={{
              ...textStyle.h2,
              fontWeight: fontWeight.bold,
              color: '#FFFFFF',
              marginBottom: item.ctaLabel ? semanticSpacing.sm : 0,
            }}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          {item.ctaLabel ? (
            <View
              style={{
                alignSelf: 'flex-start',
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: 8,
                paddingHorizontal: semanticSpacing.md,
                paddingVertical: semanticSpacing.xs,
                marginTop: semanticSpacing.xs,
              }}
            >
              <Text style={{ ...textStyle.labelStrong, color: '#FFFFFF' }}>
                {item.ctaLabel}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    );

    return (
      <Pressable
        onPress={() => {
          haptic.tap();
          handleSlidePress(item);
        }}
        accessibilityRole="button"
        accessibilityLabel={`${item.title}. ${item.subtitle ?? ''}`}
        style={{ width: SCREEN_WIDTH }}
      >
        {isGradient ? (
          <LinearGradient
            colors={[colors[0], colors[1] ?? colors[0]] as readonly [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              marginHorizontal: semanticSpacing.screenPadding,
              borderRadius: 16,
            }}
          >
            <View style={{ padding: semanticSpacing.xl, minHeight: 140, justifyContent: 'center', overflow: 'hidden' }}>
              {item.pattern === 'dots' && <PatternOverlay type="dots" />}
              {item.pattern === 'lines' && <PatternOverlay type="lines" />}
              {item.pattern === 'circles' && <PatternOverlay type="circles" />}
              <View style={{ zIndex: 1 }}>
                {item.subtitle ? (
                  <Text style={{ ...textStyle.caption, color: 'rgba(255,255,255,0.8)', marginBottom: 4 }} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                ) : null}
                <Text
                  style={{ ...textStyle.h2, fontWeight: fontWeight.bold, color: '#FFFFFF', marginBottom: item.ctaLabel ? semanticSpacing.sm : 0 }}
                  numberOfLines={2}
                >
                  {item.title}
                </Text>
                {item.ctaLabel ? (
                  <View style={{ alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, paddingHorizontal: semanticSpacing.md, paddingVertical: semanticSpacing.xs, marginTop: semanticSpacing.xs }}>
                    <Text style={{ ...textStyle.labelStrong, color: '#FFFFFF' }}>{item.ctaLabel}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </LinearGradient>
        ) : (
          slideContent
        )}
      </Pressable>
    );
  };

  return (
    <View style={{ marginTop: semanticSpacing.lg }}>
      <FlatList
        ref={flatListRef}
        data={activeSlides}
        keyExtractor={(item, index) => `${item.bannerId}-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={SCREEN_WIDTH}
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        renderItem={renderSlide}
      />

      {/* Dot indicators — Apple: scale+width spring */}
      {totalSlides > 1 ? (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
            marginTop: semanticSpacing.md,
          }}
          accessibilityRole="tablist"
          accessibilityLabel="Banner slides"
        >
          {activeSlides.map((_, index) => {
            const isActive = index === currentIndex
            return (
              <View
                key={index}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={`Slide ${index + 1}`}
                style={{
                  width: isActive ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: isActive
                    ? theme.colors.action.primary.background
                    : theme.colors.border.default,
                  opacity: isActive ? 1 : 0.5,
                }}
              />
            )
          })}
        </View>
      ) : null}
    </View>
  );
}

function PatternOverlay({ type }: { type: 'dots' | 'lines' | 'circles' }) {
  const opacity = 0.08;

  if (type === 'dots') {
    return (
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity,
        }}
        pointerEvents="none"
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: '#FFFFFF',
              top: 10 + (i % 4) * 35,
              left: 10 + Math.floor(i / 4) * 60,
            }}
          />
        ))}
      </View>
    );
  }

  if (type === 'lines') {
    return (
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity,
          borderWidth: 0,
          borderColor: 'transparent',
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255,255,255,0.3)',
          borderStyle: 'dashed',
        }}
        pointerEvents="none"
      />
    );
  }

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: opacity * 0.5,
      }}
      pointerEvents="none"
    >
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            width: 60,
            height: 60,
            borderRadius: 30,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.4)',
            top: 20 + i * 30,
            left: 30 + i * 50,
          }}
        />
      ))}
    </View>
  );
}
