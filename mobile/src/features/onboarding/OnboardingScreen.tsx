import { useRef, useState } from 'react';
import { View, Text, ScrollView, useWindowDimensions, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { ShoppingBasket, Tag, MapPin } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { typeScale, weights, letterSpacing } from '../../theme/typography';
import { TactilePressable } from '../../components/shared/TactilePressable';
import { Logo } from '../../components/shared/Logo';
import { copy } from '../../lib/strings';
import { storage, STORAGE_KEYS } from '../../lib/storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

const SLIDES = [
  { title: copy.onboarding.slides.groceriesTitle, subtitle: copy.onboarding.slides.groceriesSubtitle, Icon: ShoppingBasket },
  { title: copy.onboarding.slides.specialsTitle, subtitle: copy.onboarding.slides.specialsSubtitle, Icon: Tag },
  { title: copy.onboarding.slides.trackingTitle, subtitle: copy.onboarding.slides.trackingSubtitle, Icon: MapPin },
];

export function OnboardingScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);

  const finish = async () => {
    await storage.set(STORAGE_KEYS.onboardingSeen, true);
  };

  const startShopping = async () => {
    await finish();
    navigation.navigate('Tabs');
  };

  const iAmARider = async () => {
    await finish();
    navigation.navigate('Auth');
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next !== page) setPage(Math.max(0, Math.min(next, SLIDES.length - 1)));
  };

  const next = () => {
    if (page >= SLIDES.length - 1) {
      void startShopping();
      return;
    }
    scrollRef.current?.scrollTo({ x: (page + 1) * width, animated: true });
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: 16 }}>
        <Logo variant="lockup" size={24} tone={theme.name === 'dark' ? 'light' : 'dark'} />
        {page < SLIDES.length - 1 && (
          <TactilePressable onPress={startShopping} hapticOnPress="selection" accessibilityRole="button">
            <Text style={{ color: theme.colors.textMuted, fontWeight: weights.semibold }}>{copy.onboarding.skip}</Text>
          </TactilePressable>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {SLIDES.map(({ title, subtitle, Icon }, i) => (
          <View key={i} style={{ width, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 20 }}>
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: theme.name === 'dark' ? theme.colors.surface : brand.primaryLight,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon size={52} color={brand.primary} strokeWidth={1.75} />
            </View>
            <Text style={{ fontSize: typeScale.display, fontWeight: weights.extrabold, textAlign: 'center', color: theme.colors.text }}>
              {title}
            </Text>
            <Text style={{ fontSize: typeScale.body, textAlign: 'center', color: theme.colors.textMuted, lineHeight: 22 }}>
              {subtitle}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 12 }}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={{
              width: i === page ? 22 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: i === page ? brand.primary : theme.colors.hairline,
            }}
          />
        ))}
      </View>

      <View style={{ padding: 20, gap: 12 }}>
        <TactilePressable
          onPress={next}
          hapticOnPress="commit"
          accessibilityRole="button"
          style={{ backgroundColor: brand.primary, borderRadius: 999 }}
        >
          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: weights.bold, textTransform: 'uppercase', letterSpacing: letterSpacing.wide }}>
            {page === SLIDES.length - 1 ? copy.onboarding.startShopping : 'Next'}
          </Text>
        </TactilePressable>
        <TactilePressable onPress={iAmARider} hapticOnPress="selection" accessibilityRole="button">
          <Text style={{ textAlign: 'center', color: theme.colors.textMuted, fontWeight: weights.semibold }}>
            {copy.onboarding.iAmARider}
          </Text>
        </TactilePressable>
      </View>
    </View>
  );
}
