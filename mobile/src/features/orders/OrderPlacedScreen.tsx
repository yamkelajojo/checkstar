import { View, Text } from 'react-native';
import { CheckCircle2, RefreshCw, XCircle } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { textStyle, weights, letterSpacing } from '../../theme/typography';
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

const TONE = {
  assigned: { icon: CheckCircle2, color: brand.success },
  retrying: { icon: RefreshCw, color: brand.warning },
  cancelled: { icon: XCircle, color: brand.accent },
} satisfies Record<ApiDispatchStatus, { icon: typeof CheckCircle2; color: string }>;

export function OrderPlacedScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { orderId, dispatch } = route.params as { orderId: number; dispatch?: ApiDispatchOutcome };
  const { data: order } = useQuery({
    queryKey: queryKeys.order(orderId),
    queryFn: () => fetchOrder(orderId),
  });

  const outcome = resolveDispatchOutcome(dispatch, order?.status);
  const tone = TONE[outcome];
  const Icon = tone.icon;
  const headline =
    outcome === 'retrying' ? copy.orders.retryingTitle : outcome === 'cancelled' ? copy.orders.dispatchFailedTitle : copy.orders.placedTitle;
  const body =
    outcome === 'retrying'
      ? copy.orders.retryingBody
      : outcome === 'cancelled'
        ? copy.orders.dispatchFailedBody
        : formatString(copy.orders.placedBody, { store: order?.store?.name ?? 'the store' });

  const dispatchStoreName = dispatch?.store_name ?? order?.store?.name ?? null;
  const dispatchRiderName = dispatch?.rider_name ?? order?.rider?.user?.name ?? null;
  const latencyMs = dispatch?.claim_latency_ms ?? null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.primary, alignItems: 'center', justifyContent: 'center', padding: semanticSpacing.screenPadding, gap: semanticSpacing.md }}>
      <FadeSlideIn distance={20}>
        <View style={{ alignItems: 'center', gap: semanticSpacing.md }}>
          <Icon size={72} color={tone.color} strokeWidth={1.5} />
          <Text style={{ ...textStyle.h1, fontWeight: weights.extrabold, color: theme.colors.text.primary }}>
            {headline}
          </Text>
          <Text style={{ ...textStyle.body, color: theme.colors.text.secondary, textAlign: 'center', lineHeight: 22 }}>
            {body}
          </Text>
          {outcome === 'assigned' && (dispatchStoreName || dispatchRiderName || latencyMs != null) && (
            <View style={{ backgroundColor: theme.colors.surface.primary, borderRadius: semanticRadius.card, paddingVertical: semanticSpacing.sm, paddingHorizontal: semanticSpacing.md, alignSelf: 'stretch', gap: semanticSpacing.xxs }}>
              {dispatchStoreName && (
                <Text style={{ ...textStyle.caption, color: theme.colors.text.secondary, textAlign: 'center' }}>
                  Store: <Text style={{ fontWeight: weights.bold }}>{dispatchStoreName}</Text>
                </Text>
              )}
              {dispatchRiderName && (
                <Text style={{ ...textStyle.caption, color: theme.colors.text.secondary, textAlign: 'center' }}>
                  Rider: <Text style={{ fontWeight: weights.bold }}>{dispatchRiderName}</Text>
                </Text>
              )}
              {latencyMs != null && (
                <Text style={{ ...textStyle.caption, color: theme.colors.text.tertiary, textAlign: 'center' }}>
                  Assigned in {latencyMs}ms
                </Text>
              )}
            </View>
          )}
          {order != null && (
            <View style={{ backgroundColor: theme.colors.surface.primary, borderRadius: semanticRadius.cardLarge, paddingVertical: semanticSpacing.md, paddingHorizontal: semanticSpacing.xl, alignItems: 'center', gap: semanticSpacing.xxs }}>
              <Text style={{ ...textStyle.caption, color: theme.colors.text.tertiary, textTransform: 'uppercase', letterSpacing: letterSpacing.wide }}>
                Order #{order.id}
              </Text>
              <Text style={{ ...textStyle.priceLarge, fontWeight: weights.black, color: theme.colors.text.primary }}>
                {formatZar(order.total_cents ?? 0)}
              </Text>
            </View>
          )}
        </View>
      </FadeSlideIn>

      <View style={{ alignSelf: 'stretch', gap: semanticSpacing.sm }}>
        {outcome !== 'cancelled' ? (
          <TactilePressable
            onPress={() => navigation.replace('OrderDetail', { orderId })}
            haptic="commit"
            accessibilityRole="button"
            style={{ backgroundColor: brand.primary, borderRadius: semanticRadius.buttonPill }}
          >
            <Text style={{ color: '#fff', textAlign: 'center', fontWeight: weights.bold, textTransform: 'uppercase', letterSpacing: letterSpacing.wide }}>
              {copy.orders.trackOrder}
            </Text>
          </TactilePressable>
        ) : (
          <TactilePressable
            onPress={() => navigation.navigate('Checkout')}
            haptic="commit"
            accessibilityRole="button"
            accessibilityLabel="Return to checkout"
            style={{ backgroundColor: brand.primary, borderRadius: semanticRadius.buttonPill }}
          >
            <Text style={{ color: '#fff', textAlign: 'center', fontWeight: weights.bold, textTransform: 'uppercase', letterSpacing: letterSpacing.wide }}>
              {copy.checkout.title}
            </Text>
          </TactilePressable>
        )}
        <TactilePressable
          onPress={() => navigation.navigate('RouteExplorer', {
            storeName: (dispatchStoreName || order?.store?.name) ?? 'Checkstar',
            storeLat: order?.store?.latitude ?? undefined,
            storeLng: order?.store?.longitude ?? undefined,
            deliveryAddress: order?.delivery_address ?? null,
            deliveryLat: order?.delivery_latitude ?? undefined,
            deliveryLng: order?.delivery_longitude ?? undefined,
            distanceKm: order?.store?.latitude != null && order?.delivery_latitude != null ? undefined : undefined,
            durationMinutes: undefined,
            source: 'haversine_fallback',
            geometry: null,
          })}
          haptic="selection"
          accessibilityRole="button"
          accessibilityLabel="Open immersive route explorer"
          style={{ backgroundColor: theme.colors.surface.primary, borderRadius: semanticRadius.buttonPill, borderWidth: 1, borderColor: theme.colors.border.subtle, paddingVertical: semanticSpacing.sm, paddingHorizontal: semanticSpacing.md }}
        >
          <Text style={{ color: theme.colors.text.tertiary, textAlign: 'center', fontWeight: weights.medium, ...textStyle.caption, letterSpacing: letterSpacing.wide }}>
            Open Immersive Route Explorer →
          </Text>
        </TactilePressable>

        <TactilePressable
          onPress={() => navigation.navigate('Tabs')}
          haptic="selection"
          accessibilityRole="button"
        >
          <Text style={{ textAlign: 'center', color: theme.colors.text.tertiary, fontWeight: weights.semibold }}>
            {copy.orders.done}
          </Text>
        </TactilePressable>
      </View>
    </View>
  );
}
