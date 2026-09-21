import { View, Text } from 'react-native';
import { CheckCircle2, RefreshCw, XCircle } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { textStyle, fontWeight } from '../../theme/typography';
import { semanticSpacing, semanticRadius } from '../../theme/spacing';
import { useQuery } from '@tanstack/react-query';
import { fetchOrder } from '../../lib/apiClient';
import { queryKeys } from '../../lib/queryKeys';
import { formatZar } from '../../lib/currency';
import { TactilePressable } from '../../components/shared/TactilePressable';
import { copy, formatString } from '../../lib/strings';
import { FadeSlideIn } from '../../components/shared/FadeSlideIn';
import type { ApiDispatchOutcome, ApiDispatchStatus } from '../../lib/types';
import type { RootStackParamList } from '../../navigation/types';
import { resolveDispatchOutcome } from './model';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';
import { useEffect } from 'react';
import { springs } from '../../theme/motion';

const TONE = {
  assigned: { icon: CheckCircle2, color: brand.success, bg: '#DCFCE7' },
  retrying: { icon: RefreshCw, color: brand.warning, bg: '#FEF3C7' },
  cancelled: { icon: XCircle, color: brand.error, bg: '#FEE2E2' },
} as const;

export function OrderPlacedScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { orderId, dispatch } = route.params as { orderId: number; dispatch?: ApiDispatchOutcome };
  const { data: order } = useQuery({ queryKey: queryKeys.order(orderId), queryFn: () => fetchOrder(orderId) });

  const outcome = resolveDispatchOutcome(dispatch, order?.status);
  const tone = TONE[outcome as keyof typeof TONE] ?? TONE.assigned;
  const Icon = tone.icon;
  const headline = outcome === 'retrying' ? copy.orders.retryingTitle : outcome === 'cancelled' ? copy.orders.dispatchFailedTitle : copy.orders.placedTitle;
  const body = outcome === 'retrying' ? copy.orders.retryingBody : outcome === 'cancelled' ? copy.orders.dispatchFailedBody : formatString(copy.orders.placedBody, { store: order?.store?.name ?? 'the store' });

  const dispatchStoreName = dispatch?.store_name ?? order?.store?.name ?? null;
  const dispatchRiderName = dispatch?.rider_name ?? order?.rider?.user?.name ?? null;
  const latencyMs = dispatch?.claim_latency_ms ?? null;

  const iconScale = useSharedValue(0.6);
  const iconRotate = useSharedValue(-8);

  useEffect(() => {
    iconScale.value = withDelay(100, withSpring(1, { damping: 18, stiffness: 400, mass: 0.7 }));
    iconRotate.value = withDelay(100, withSpring(0, { damping: 24, stiffness: 300, mass: 0.8 }));
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }, { rotate: `${iconRotate.value}deg` }],
  }));

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.primary, alignItems: 'center', justifyContent: 'center', padding: semanticSpacing.screenPadding, gap: 24 }}>
      <FadeSlideIn delay={60} distance={16} initialScale={0.96}>
        <View style={{ alignItems: 'center', gap: 16 }}>
          <Animated.View style={[{ width: 88, height: 88, borderRadius: 44, backgroundColor: tone.bg, borderWidth: 1, borderColor: tone.color + '20', alignItems: 'center', justifyContent: 'center', shadowColor: tone.color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 3 }, iconStyle]}>
            <Icon size={40} color={tone.color} strokeWidth={1.8} />
          </Animated.View>

          <View style={{ alignItems: 'center', gap: 8 }}>
            <Text style={{ ...textStyle.h1, fontWeight: fontWeight.bold, color: theme.colors.text.primary, letterSpacing: -0.4, textAlign: 'center' }}>{headline}</Text>
            <Text style={{ fontSize: 13, color: theme.colors.text.secondary, textAlign: 'center', lineHeight: 20, maxWidth: 300 }}>{body}</Text>
          </View>

          {outcome === 'assigned' && (dispatchStoreName || dispatchRiderName || latencyMs != null) && (
            <FadeSlideIn delay={160} distance={8}>
              <View style={{ backgroundColor: theme.colors.surface.primary, borderRadius: semanticRadius.card, paddingVertical: 12, paddingHorizontal: 16, alignSelf: 'stretch', gap: 4, borderWidth: 1, borderColor: theme.colors.border.subtle, minWidth: 280 }}>
                {dispatchStoreName ? <Text style={{ fontSize: 11, color: theme.colors.text.secondary, textAlign: 'center' }}>Store: <Text style={{ fontWeight: '700', color: theme.colors.text.primary }}>{dispatchStoreName}</Text></Text> : null}
                {dispatchRiderName ? <Text style={{ fontSize: 11, color: theme.colors.text.secondary, textAlign: 'center' }}>Rider: <Text style={{ fontWeight: '700', color: theme.colors.text.primary }}>{dispatchRiderName}</Text></Text> : null}
                {latencyMs != null ? <Text style={{ fontSize: 10, color: theme.colors.text.tertiary, textAlign: 'center' }}>Assigned in {latencyMs}ms</Text> : null}
              </View>
            </FadeSlideIn>
          )}

          {order != null && (
            <FadeSlideIn delay={200} distance={10} initialScale={0.96}>
              <View style={{ backgroundColor: theme.colors.surface.primary, borderRadius: 20, paddingVertical: 16, paddingHorizontal: 24, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: theme.colors.border.subtle, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 }}>
                <Text style={{ fontSize: 10, color: theme.colors.text.tertiary, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '600' }}>Order #{order.id}</Text>
                <Text style={{ fontSize: 22, fontWeight: '800', color: theme.colors.text.primary, letterSpacing: -0.5 }}>{formatZar(order.total_cents ?? 0)}</Text>
              </View>
            </FadeSlideIn>
          )}
        </View>
      </FadeSlideIn>

      <FadeSlideIn delay={280} distance={12} initialScale={0.98}>
        <View style={{ alignSelf: 'stretch', gap: 10, minWidth: 280 }}>
          {outcome !== 'cancelled' ? (
            <TactilePressable onPress={() => navigation.replace('OrderDetail', { orderId })} haptic="commit" style={{ backgroundColor: theme.colors.text.primary, borderRadius: 999, paddingVertical: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 3 }}>
              <Text style={{ color: theme.colors.text.inverse, fontWeight: '700', fontSize: 12, letterSpacing: 0.3, textTransform: 'uppercase' }}>{copy.orders.trackOrder}</Text>
            </TactilePressable>
          ) : (
            <TactilePressable onPress={() => navigation.navigate('Checkout')} haptic="commit" style={{ backgroundColor: theme.colors.text.primary, borderRadius: 999, paddingVertical: 14, alignItems: 'center' }}>
              <Text style={{ color: theme.colors.text.inverse, fontWeight: '700', fontSize: 12, letterSpacing: 0.3, textTransform: 'uppercase' }}>{copy.checkout.title}</Text>
            </TactilePressable>
          )}

          <TactilePressable
            onPress={() =>
              navigation.navigate('RouteExplorer', {
                storeName: (dispatchStoreName || order?.store?.name) ?? 'Checkstar',
                storeLat: order?.store?.latitude ?? undefined,
                storeLng: order?.store?.longitude ?? undefined,
                deliveryAddress: order?.delivery_address ?? null,
                deliveryLat: order?.delivery_latitude ?? undefined,
                deliveryLng: order?.delivery_longitude ?? undefined,
                distanceKm: undefined,
                durationMinutes: undefined,
                source: 'haversine_fallback',
                geometry: null,
              })
            }
            haptic="selection"
            style={{ backgroundColor: theme.colors.surface.primary, borderRadius: 999, borderWidth: 1, borderColor: theme.colors.border.subtle, paddingVertical: 12, alignItems: 'center' }}
          >
            <Text style={{ color: theme.colors.text.secondary, fontWeight: '600', fontSize: 11, letterSpacing: 0.2 }}>Open Immersive Route Explorer →</Text>
          </TactilePressable>

          <TactilePressable onPress={() => navigation.navigate('Tabs')} haptic="selection" style={{ alignItems: 'center', paddingVertical: 8 }}>
            <Text style={{ color: theme.colors.text.tertiary, fontWeight: '600', fontSize: 12 }}>{copy.orders.done}</Text>
          </TactilePressable>
        </View>
      </FadeSlideIn>
    </View>
  );
}
