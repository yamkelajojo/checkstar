import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Check, AlertTriangle } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { textStyle, fontWeight } from '../../theme/typography';
import { semanticSpacing, semanticRadius } from '../../theme/spacing';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchOrder, fetchRouteGeometry, markItemsBought, markOutForDelivery, markDelivered } from '../../lib/apiClient';
import { queryKeys } from '../../lib/queryKeys';
import { formatZar } from '../../lib/currency';
import { TactilePressable } from '../../components/shared/TactilePressable';
import { SkeletonCard } from '../../components/shared/SkeletonCard';
import { EmptyState } from '../../components/shared/EmptyState';
import { FadeSlideIn } from '../../components/shared/FadeSlideIn';
import { CrashCascadeIn } from '../../components/shared/CrashCascadeIn';
import { useToast } from '../../components/shared/GlassToast';
import { copy } from '../../lib/strings';
import { toggleBoughtId, allItemsSelected, allItemIds } from './model';
import { RouteMap } from '../../components/shared/RouteMap';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { ORDER_STATUS_LABEL as STATUS_LABEL } from '../../lib/status';
import { getOrderTotal } from '../../lib/orderTotal';
import { useTopSafeArea } from '../../components/shared/ScreenHeader';
import { haptic } from '../../lib/haptics';
import { brand } from '../../theme/colors';

export function RiderOrderDetailScreen() {
  const theme = useTheme();
  const topInset = useTopSafeArea();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { orderId: rawOrderId } = route.params as { orderId: number | string };
  const orderId = Number(rawOrderId);
  const queryClient = useQueryClient();
  const toast = useToast();
  const [boughtIds, setBoughtIds] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => { setBoughtIds([]); }, [orderId]);

  const { data: order, isLoading, error } = useQuery({ queryKey: queryKeys.order(orderId), queryFn: () => fetchOrder(orderId) });
  const hasRouteCoords = order?.store?.latitude != null && order?.store?.longitude != null && order?.delivery_latitude != null && order?.delivery_longitude != null;
  const { data: routeGeometry } = useQuery({
    queryKey: ['routeGeometry', orderId],
    queryFn: () => fetchRouteGeometry(order!.store!.latitude!, order!.store!.longitude!, order!.delivery_latitude!, order!.delivery_longitude!),
    enabled: hasRouteCoords,
    staleTime: 5 * 60 * 1000,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.order(orderId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.activeDeliveries });
    void queryClient.invalidateQueries({ queryKey: queryKeys.availableOrders });
  };

  const run = async (fn: () => Promise<unknown>, message: string) => {
    setBusy(true);
    try { await fn(); toast.show(message, { tone: 'success' }); invalidate(); } catch (e) { toast.show(e instanceof Error ? e.message : 'Action failed.'); } finally { setBusy(false); }
  };

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: theme.colors.background.primary, padding: 16, paddingTop: 72 }}><SkeletonCard height={360} width={undefined} /></View>;
  }

  if (error || !order) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background.primary, padding: 16, paddingTop: 72 }}>
        <EmptyState icon={AlertTriangle} title="Could not load order" caption={error instanceof Error ? error.message : 'Order may have been removed'} />
        <TactilePressable onPress={() => navigation.goBack()} haptic="selection" style={{ marginTop: 16 }}><Text style={{ textAlign: 'center', color: theme.colors.text.secondary, fontWeight: '600' }}>{copy.orders.done}</Text></TactilePressable>
      </View>
    );
  }

  const isConfirmed = order.status === 'confirmed';
  const isPreparing = order.status === 'preparing';
  const isOutForDelivery = order.status === 'out_for_delivery';
  const isDelivered = order.status === 'delivered';
  const allSelected = allItemsSelected(boughtIds, order.items.length);

  const toggleItem = (id: number) => setBoughtIds((current) => toggleBoughtId(current, id));

  const onBought = async () => {
    const ids = boughtIds.length > 0 ? boughtIds : allItemIds(order.items);
    setBusy(true);
    try { await markItemsBought(orderId, ids); setBoughtIds(ids); toast.show(copy.rider.markItemsBoughtShort, { tone: 'success' }); invalidate(); } catch (e) { toast.show(e instanceof Error ? e.message : 'Action failed.'); } finally { setBusy(false); }
  };
  const onOutForDelivery = async () => { await run(() => markOutForDelivery(orderId), copy.rider.outForDeliveryShort); };
  const onDelivered = async () => { await run(() => markDelivered(orderId), copy.rider.delivered); };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingTop: topInset, paddingHorizontal: semanticSpacing.screenPadding, gap: 16 }}>
          <FadeSlideIn delay={60} distance={12}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 20, fontWeight: '800', letterSpacing: -0.4, color: theme.colors.text.primary }}>Order #{order.id}</Text>
              <View style={{ backgroundColor: brand.orange + '12', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Text style={{ color: brand.orange, fontWeight: '700', fontSize: 10, letterSpacing: 0.3, textTransform: 'uppercase' }}>{STATUS_LABEL[order.status] ?? order.status}</Text>
              </View>
            </View>
          </FadeSlideIn>

          <FadeSlideIn delay={100} distance={10}>
            <View style={{ backgroundColor: theme.colors.surface.primary, borderRadius: semanticRadius.card, padding: 14, gap: 6, borderWidth: 1, borderColor: theme.colors.border.subtle, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4 }}>
              <Text style={{ fontWeight: '700', color: theme.colors.text.primary, fontSize: 12, letterSpacing: -0.2 }}>{copy.orders.delivery}</Text>
              <Text style={{ color: theme.colors.text.secondary, fontSize: 12, lineHeight: 16 }}>{order.delivery_address ?? '—'}</Text>
              {order.delivery_notes != null ? <Text style={{ color: theme.colors.text.tertiary, fontSize: 11 }}>Notes: {order.delivery_notes}</Text> : null}
            </View>
          </FadeSlideIn>

          <FadeSlideIn delay={140} distance={12}>
            <RouteMap storeName={order.store?.name ?? 'Checkstar'} storeLat={order.store?.latitude ?? undefined} storeLng={order.store?.longitude ?? undefined} deliveryAddress={order.delivery_address} deliveryLat={order.delivery_latitude ?? undefined} deliveryLng={order.delivery_longitude ?? undefined} distanceKm={routeGeometry?.distance_km} durationMinutes={routeGeometry?.duration_minutes} source={routeGeometry?.source ?? 'haversine_fallback'} geometry={routeGeometry?.geometry ?? null} />
          </FadeSlideIn>

          {hasRouteCoords ? (
            <FadeSlideIn delay={180} distance={8}>
              <TouchableOpacity
                onPress={() => {
                  haptic.selection();
                  navigation.navigate('RouteExplorer', {
                    storeName: order.store?.name ?? 'Checkstar',
                    storeLat: order.store?.latitude ?? undefined,
                    storeLng: order.store?.longitude ?? undefined,
                    deliveryAddress: order.delivery_address ?? null,
                    deliveryLat: order.delivery_latitude ?? undefined,
                    deliveryLng: order.delivery_longitude ?? undefined,
                    distanceKm: routeGeometry?.distance_km,
                    durationMinutes: routeGeometry?.duration_minutes,
                    source: routeGeometry?.source ?? 'haversine_fallback',
                    geometry: routeGeometry?.geometry ?? null,
                  });
                }}
                style={{ backgroundColor: theme.colors.text.primary, borderRadius: 999, paddingVertical: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 3 }}
              >
                <Text style={{ color: theme.colors.text.inverse, fontWeight: '700', fontSize: 11, letterSpacing: 0.3, textTransform: 'uppercase' }}>Explore Route</Text>
              </TouchableOpacity>
            </FadeSlideIn>
          ) : null}

          <FadeSlideIn delay={200} distance={10}>
            <View style={{ backgroundColor: theme.colors.surface.primary, borderRadius: semanticRadius.card, padding: 14, gap: 10, borderWidth: 1, borderColor: theme.colors.border.subtle, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4 }}>
              <Text style={{ fontWeight: '700', color: theme.colors.text.primary, fontSize: 12, letterSpacing: -0.2 }}>{copy.orders.items}</Text>
              {order.items.map((item: any, idx: number) => {
                const name = (item.product_snapshot as { name?: string } | null)?.name ?? `Item ${item.product_id}`;
                const bought = boughtIds.includes(item.id);
                const canToggle = isPreparing || isConfirmed;
                return (
                  <CrashCascadeIn key={item.id} index={idx}>
                    <TactilePressable onPress={() => canToggle && toggleItem(item.id)} haptic={canToggle ? 'selection' : undefined} disabled={!canToggle} accessibilityState={{ checked: bought, disabled: !canToggle }} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: bought ? theme.colors.text.primary : theme.colors.border.subtle, backgroundColor: bought ? theme.colors.text.primary : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                        {bought ? <Check size={12} color="#fff" strokeWidth={3} /> : null}
                      </View>
                      <Text style={{ flex: 1, color: theme.colors.text.primary, fontSize: 12 }}>{item.quantity} × {name}</Text>
                      <Text style={{ color: theme.colors.text.secondary, fontSize: 11 }}>{item.unit_price_cents != null ? formatZar(item.unit_price_cents * item.quantity) : ''}</Text>
                    </TactilePressable>
                  </CrashCascadeIn>
                );
              })}
              <View style={{ height: 1, backgroundColor: theme.colors.border.subtle, marginVertical: 2 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: theme.colors.text.secondary, fontSize: 12 }}>{copy.checkout.total}</Text>
                <Text style={{ fontWeight: '700', color: theme.colors.text.primary, fontSize: 13, letterSpacing: -0.2 }}>{formatZar(getOrderTotal(order))}</Text>
              </View>
            </View>
          </FadeSlideIn>
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: semanticSpacing.screenPadding, borderTopWidth: 1, borderTopColor: theme.colors.border.subtle, backgroundColor: theme.colors.background.primary, gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 8 }}>
        {isConfirmed ? <Text style={{ textAlign: 'center', color: theme.colors.text.tertiary, fontSize: 11, marginBottom: 4 }}>Waiting for store to start preparing...</Text> : null}
        {(isPreparing || isConfirmed) ? (
          <>
            <TactilePressable onPress={onBought} haptic="commit" disabled={busy || isConfirmed} style={{ backgroundColor: theme.colors.text.primary, borderRadius: 999, paddingVertical: 14, alignItems: 'center', opacity: busy || isConfirmed ? 0.6 : 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6 }}>
              <Text style={{ color: theme.colors.text.inverse, fontWeight: '700', fontSize: 11, letterSpacing: 0.3, textTransform: 'uppercase' }}>{copy.rider.markItemsBought}</Text>
            </TactilePressable>
            {allSelected && !isConfirmed ? (
              <TactilePressable onPress={onOutForDelivery} haptic="commit" style={{ backgroundColor: '#22C55E', borderRadius: 999, paddingVertical: 14, alignItems: 'center', shadowColor: '#22C55E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6 }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 11, letterSpacing: 0.3, textTransform: 'uppercase' }}>{copy.rider.outForDelivery}</Text>
              </TactilePressable>
            ) : null}
          </>
        ) : null}
        {isOutForDelivery ? (
          <TactilePressable onPress={onDelivered} haptic="commit" disabled={busy} style={{ backgroundColor: '#22C55E', borderRadius: 999, paddingVertical: 14, alignItems: 'center', opacity: busy ? 0.6 : 1 }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 11, letterSpacing: 0.3, textTransform: 'uppercase' }}>{copy.rider.markDelivered}</Text>
          </TactilePressable>
        ) : null}
        {isDelivered ? <Text style={{ textAlign: 'center', color: '#22C55E', fontWeight: '700', fontSize: 11, letterSpacing: 0.3, textTransform: 'uppercase' }}>{copy.rider.delivered} ✓</Text> : null}
        <TactilePressable onPress={() => navigation.goBack()} haptic="selection" style={{ alignItems: 'center', paddingVertical: 8 }}><Text style={{ color: theme.colors.text.secondary, fontWeight: '600', fontSize: 12 }}>{copy.orders.done}</Text></TactilePressable>
      </View>
    </View>
  );
}
