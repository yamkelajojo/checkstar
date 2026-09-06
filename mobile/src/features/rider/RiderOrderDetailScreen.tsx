import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Check, AlertTriangle } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { typeScale, weights, letterSpacing } from '../../theme/typography';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchOrder, fetchRouteGeometry, markItemsBought, markOutForDelivery, markDelivered } from '../../lib/apiClient';
import { queryKeys } from '../../lib/queryKeys';
import { formatZar } from '../../lib/currency';
import { TactilePressable } from '../../components/shared/TactilePressable';
import { SkeletonCard } from '../../components/shared/SkeletonCard';
import { EmptyState } from '../../components/shared/EmptyState';
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

export function RiderOrderDetailScreen() {
  const theme = useTheme();
  const topInset = useTopSafeArea();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { orderId } = route.params as { orderId: number };
  const queryClient = useQueryClient();
  const toast = useToast();
  const [boughtIds, setBoughtIds] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setBoughtIds([]);
  }, [orderId]);

  const { data: order, isLoading, error } = useQuery({
    queryKey: queryKeys.order(orderId),
    queryFn: () => fetchOrder(orderId),
  });

  const hasRouteCoords = order?.store?.latitude != null && order?.store?.longitude != null &&
    order?.delivery_latitude != null && order?.delivery_longitude != null;

  const { data: routeGeometry } = useQuery({
    queryKey: ['routeGeometry', orderId],
    queryFn: () => fetchRouteGeometry(
      order!.store!.latitude!,
      order!.store!.longitude!,
      order!.delivery_latitude!,
      order!.delivery_longitude!
    ),
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
    try {
      await fn();
      toast.show(message, { tone: 'success' });
      invalidate();
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Action failed.');
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg, padding: 16, paddingTop: 72 }}>
        <SkeletonCard height={360} width={undefined} />
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg, padding: 16, paddingTop: 72 }}>
        <EmptyState
          icon={AlertTriangle}
          title="Could not load order"
          caption={error instanceof Error ? error.message : 'Order may have been removed'}
        />
        <TactilePressable onPress={() => navigation.goBack()} haptic="selection" style={{ marginTop: 16 }}>
          <Text style={{ textAlign: 'center', color: theme.colors.text.secondary, fontWeight: weights.medium }}>{copy.orders.done}</Text>
        </TactilePressable>
      </View>
    );
  }

  const isConfirmed = order.status === 'confirmed';
  const isPreparing = order.status === 'preparing';
  const isOutForDelivery = order.status === 'out_for_delivery';
  const isDelivered = order.status === 'delivered';
  const allSelected = allItemsSelected(boughtIds, order.items.length);

  const toggleItem = (id: number) => {
    setBoughtIds((current) => toggleBoughtId(current, id));
  };

  const onBought = async () => {
    const ids = boughtIds.length > 0 ? boughtIds : allItemIds(order.items);
    setBusy(true);
    try {
      await markItemsBought(orderId, ids);
      setBoughtIds(ids);
      toast.show(copy.rider.markItemsBoughtShort, { tone: 'success' });
      invalidate();
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Action failed.');
    } finally {
      setBusy(false);
    }
  };

  const onOutForDelivery = async () => {
    await run(() => markOutForDelivery(orderId), copy.rider.outForDeliveryShort);
  };

  const onDelivered = async () => {
    await run(() => markDelivered(orderId), copy.rider.delivered);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingTop: topInset, paddingHorizontal: 16, gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: typeScale.title, fontWeight: weights.extrabold, color: theme.colors.text.primary }}>
              Order #{order.id}
            </Text>
            <Text style={{ color: theme.colors.text.brand, fontWeight: weights.bold, textTransform: 'capitalize' }}>
              {STATUS_LABEL[order.status] ?? order.status}
            </Text>
          </View>

          <View style={{ backgroundColor: theme.colors.surface.primary, borderRadius: 16, padding: 16, gap: 6 }}>
            <Text style={{ fontWeight: weights.bold, color: theme.colors.text.primary }}>{copy.orders.delivery}</Text>
            <Text style={{ color: theme.colors.text.secondary, fontSize: typeScale.body }}>
              {order.delivery_address ?? '—'}
            </Text>
            {order.delivery_notes != null && (
              <Text style={{ color: theme.colors.text.tertiary, fontSize: typeScale.caption }}>Notes: {order.delivery_notes}</Text>
            )}
          </View>

          <RouteMap
            storeName={order.store?.name ?? 'Checkstar'}
            storeLat={order.store?.latitude ?? undefined}
            storeLng={order.store?.longitude ?? undefined}
            deliveryAddress={order.delivery_address}
            deliveryLat={order.delivery_latitude ?? undefined}
            deliveryLng={order.delivery_longitude ?? undefined}
            distanceKm={routeGeometry?.distance_km ?? (hasRouteCoords ? 3.2 : undefined)}
            durationMinutes={routeGeometry?.duration_minutes ?? (hasRouteCoords ? 15 : undefined)}
            source={routeGeometry?.source ?? 'mock_fallback'}
            geometry={routeGeometry?.geometry ?? null}
          />

          {hasRouteCoords && (
            <TouchableOpacity
              onPress={() => {
                haptic.tap();
                navigation.navigate('RouteExplorer', {
                storeName: order.store?.name ?? 'Checkstar',
                storeLat: order.store?.latitude ?? undefined,
                storeLng: order.store?.longitude ?? undefined,
                deliveryAddress: order.delivery_address ?? null,
                deliveryLat: order.delivery_latitude ?? undefined,
                deliveryLng: order.delivery_longitude ?? undefined,
                distanceKm: routeGeometry?.distance_km ?? 3.2,
                durationMinutes: routeGeometry?.duration_minutes ?? 15,
                source: routeGeometry?.source ?? 'osrm',
                geometry: routeGeometry?.geometry ?? null,
                });
              }}
              accessibilityRole="button"
              accessibilityLabel="Open immersive route explorer"
              style={{
                backgroundColor: theme.colors.action.primary.background,
                borderRadius: 999,
                paddingVertical: 14,
                paddingHorizontal: 24,
                alignItems: 'center',
                marginTop: 8,
              }}
            >
              <Text style={{ color: theme.colors.action.primary.foreground, fontWeight: weights.bold, textTransform: 'uppercase', letterSpacing: letterSpacing.wide }}>
                Explore Route
              </Text>
            </TouchableOpacity>
          )}

          <View style={{ backgroundColor: theme.colors.surface.primary, borderRadius: 16, padding: 16, gap: 10 }}>
            <Text style={{ fontWeight: weights.bold, color: theme.colors.text.primary }}>{copy.orders.items}</Text>
            {order.items.map((item) => {
              const name = (item.product_snapshot as { name?: string } | null)?.name ?? `Item ${item.product_id}`;
              const bought = boughtIds.includes(item.id);
              const canToggle = isPreparing || isConfirmed;
              return (
                <TactilePressable
                  key={item.id}
                  onPress={() => canToggle && toggleItem(item.id)}
                  haptic={canToggle ? 'selection' : undefined}
                  disabled={!canToggle}
                  accessibilityRole="button"
                  accessibilityState={{ checked: canToggle ? bought : undefined }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
                >
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      borderWidth: 1.5,
                      borderColor: bought ? theme.colors.action.primary.background : theme.colors.hairline,
                      backgroundColor: bought ? theme.colors.action.primary.background : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {bought && <Check size={14} color={theme.colors.action.primary.foreground} strokeWidth={3} />}
                  </View>
                  <Text style={{ flex: 1, color: theme.colors.text.primary, fontSize: typeScale.body }}>
                    {item.quantity} × {name}
                  </Text>
                  <Text style={{ color: theme.colors.text.secondary, fontSize: typeScale.body }}>
                    {item.unit_price_cents != null ? formatZar(item.unit_price_cents * item.quantity) : ''}
                  </Text>
                </TactilePressable>
              );
            })}
            <View style={{ height: 1, backgroundColor: theme.colors.hairline }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: theme.colors.text.secondary }}>{copy.checkout.total}</Text>
              <Text style={{ fontWeight: weights.bold, color: theme.colors.text.primary }}>{formatZar(getOrderTotal(order))}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, borderTopWidth: 1, borderTopColor: theme.colors.hairline, backgroundColor: theme.colors.bg, gap: 8 }}>
        {isConfirmed && (
          <Text style={{ textAlign: 'center', color: theme.colors.text.tertiary, fontSize: typeScale.caption, marginBottom: 4 }}>
            Waiting for store to start preparing...
          </Text>
        )}
        {(isPreparing || isConfirmed) && (
          <>
            <TactilePressable
              onPress={onBought}
              haptic="commit"
              disabled={busy || isConfirmed}
              accessibilityRole="button"
              style={{ backgroundColor: theme.colors.action.primary.background, borderRadius: 999, opacity: busy || isConfirmed ? 0.6 : 1 }}
            >
              <Text style={{ color: theme.colors.action.primary.foreground, textAlign: 'center', fontWeight: weights.bold, textTransform: 'uppercase', letterSpacing: letterSpacing.wide }}>
                {copy.rider.markItemsBought}
              </Text>
            </TactilePressable>
            {allSelected && !isConfirmed && (
              <TactilePressable
                onPress={onOutForDelivery}
                haptic="commit"
                accessibilityRole="button"
                style={{ backgroundColor: theme.colors.status.success.primary, borderRadius: 999 }}
              >
                <Text style={{ color: theme.colors.action.primary.foreground, textAlign: 'center', fontWeight: weights.bold, textTransform: 'uppercase', letterSpacing: letterSpacing.wide }}>
                  {copy.rider.outForDelivery}
                </Text>
              </TactilePressable>
            )}
          </>
        )}
        {isOutForDelivery && (
          <TactilePressable
            onPress={onDelivered}
            haptic="commit"
            disabled={busy}
            accessibilityRole="button"
            style={{ backgroundColor: theme.colors.status.success.primary, borderRadius: 999, opacity: busy ? 0.6 : 1 }}
          >
            <Text style={{ color: theme.colors.action.primary.foreground, textAlign: 'center', fontWeight: weights.bold, textTransform: 'uppercase', letterSpacing: letterSpacing.wide }}>
              {copy.rider.markDelivered}
            </Text>
          </TactilePressable>
        )}
        {isDelivered && (
          <Text style={{ textAlign: 'center', color: theme.colors.status.success.primary, fontWeight: weights.bold, textTransform: 'uppercase', letterSpacing: letterSpacing.wide }}>
            {copy.rider.delivered} ✓
          </Text>
        )}
        <TactilePressable onPress={() => navigation.goBack()} haptic="selection" accessibilityRole="button">
          <Text style={{ textAlign: 'center', color: theme.colors.text.secondary, fontWeight: weights.medium }}>{copy.orders.done}</Text>
        </TactilePressable>
      </View>
    </View>
  );
}
