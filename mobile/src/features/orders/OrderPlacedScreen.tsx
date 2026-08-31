import { View, Text } from 'react-native';
import { CheckCircle2, RefreshCw, XCircle } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { typeScale, weights, letterSpacing } from '../../theme/typography';
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
    <View style={{ flex: 1, backgroundColor: theme.colors.bg, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 }}>
      <FadeSlideIn distance={20}>
        <View style={{ alignItems: 'center', gap: 16 }}>
          <Icon size={72} color={tone.color} strokeWidth={1.5} />
          <Text style={{ fontSize: typeScale.title, fontWeight: weights.extrabold, color: theme.colors.text }}>
            {headline}
          </Text>
          <Text style={{ fontSize: typeScale.body, color: theme.colors.textMuted, textAlign: 'center', lineHeight: 22 }}>
            {body}
          </Text>
          {outcome === 'assigned' && (dispatchStoreName || dispatchRiderName || latencyMs != null) && (
            <View style={{ backgroundColor: theme.colors.surface, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, alignSelf: 'stretch', gap: 4 }}>
              {dispatchStoreName && (
                <Text style={{ fontSize: typeScale.caption, color: theme.colors.text, textAlign: 'center' }}>
                  Store: <Text style={{ fontWeight: weights.bold }}>{dispatchStoreName}</Text>
                </Text>
              )}
              {dispatchRiderName && (
                <Text style={{ fontSize: typeScale.caption, color: theme.colors.text, textAlign: 'center' }}>
                  Rider: <Text style={{ fontWeight: weights.bold }}>{dispatchRiderName}</Text>
                </Text>
              )}
              {latencyMs != null && (
                <Text style={{ fontSize: typeScale.caption, color: theme.colors.textMuted, textAlign: 'center' }}>
                  Assigned in {latencyMs}ms
                </Text>
              )}
            </View>
          )}
          {order != null && (
            <View style={{ backgroundColor: theme.colors.surface, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 24, alignItems: 'center', gap: 2 }}>
              <Text style={{ fontSize: typeScale.caption, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: letterSpacing.wide }}>
                Order #{order.id}
              </Text>
              <Text style={{ fontSize: typeScale.price, fontWeight: weights.black, color: theme.colors.text }}>
                {formatZar(order.total_cents ?? 0)}
              </Text>
            </View>
          )}
        </View>
      </FadeSlideIn>

      <View style={{ alignSelf: 'stretch', gap: 12 }}>
        {outcome !== 'cancelled' ? (
          <TactilePressable
            onPress={() => navigation.replace('OrderDetail', { orderId })}
            haptic="commit"
            accessibilityRole="button"
            style={{ backgroundColor: brand.primary, borderRadius: 999 }}
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
            style={{ backgroundColor: brand.primary, borderRadius: 999 }}
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
            distanceKm: 3.2,
            durationMinutes: 15,
            source: 'osrm',
            geometry: null,
          })}
          haptic="selection"
          accessibilityRole="button"
          accessibilityLabel="Open immersive route explorer"
          style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingVertical: 12, paddingHorizontal: 16 }}
        >
          <Text style={{ color: theme.colors.text.tertiary, textAlign: 'center', fontWeight: weights.medium, fontSize: typeScale.caption, letterSpacing: letterSpacing.wide }}>
            Open Immersive Route Explorer →
          </Text>
        </TactilePressable>

        <TactilePressable
          onPress={() => navigation.navigate('Tabs')}
          haptic="selection"
          accessibilityRole="button"
        >
          <Text style={{ textAlign: 'center', color: theme.colors.textMuted, fontWeight: weights.semibold }}>
            {copy.orders.done}
          </Text>
        </TactilePressable>
      </View>
    </View>
  );
}
