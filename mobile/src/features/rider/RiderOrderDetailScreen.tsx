import { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Check } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { typeScale, weights, letterSpacing } from '../../theme/typography';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchOrder, markItemsBought, markOutForDelivery, markDelivered } from '../../lib/apiClient';
import { queryKeys } from '../../lib/queryKeys';
import { formatZar } from '../../lib/currency';
import { TactilePressable } from '../../components/shared/TactilePressable';
import { SkeletonCard } from '../../components/shared/SkeletonCard';
import { useToast } from '../../components/shared/GlassToast';
import { copy } from '../../lib/strings';
import { toggleBoughtId, allItemsSelected, allItemIds } from './model';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function RiderOrderDetailScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId } = route.params as { orderId: number };
  const queryClient = useQueryClient();
  const toast = useToast();
  const [boughtIds, setBoughtIds] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: queryKeys.order(orderId),
    queryFn: () => fetchOrder(orderId),
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

  if (isLoading || !order) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg, padding: 16, paddingTop: 72 }}>
        <SkeletonCard height={360} width={undefined} />
      </View>
    );
  }

  const isPreparing = order.status === 'preparing';
  const isOutForDelivery = order.status === 'out_for_delivery';
  const isDelivered = order.status === 'delivered';
  const allSelected = allItemsSelected(boughtIds, order.items.length);

  const toggleItem = (id: number) => {
    setBoughtIds((current) => toggleBoughtId(current, id));
  };

  const onBought = async () => {
    const ids = allItemIds(order.items);
    setBoughtIds(ids);
    await run(() => markItemsBought(orderId, ids), copy.rider.markItemsBoughtShort);
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
        <View style={{ paddingTop: 56, paddingHorizontal: 16, gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: typeScale.title, fontWeight: weights.extrabold, color: theme.colors.text }}>
              Order #{order.id}
            </Text>
            <Text style={{ color: brand.primary, fontWeight: weights.bold, textTransform: 'capitalize' }}>
              {STATUS_LABEL[order.status] ?? order.status}
            </Text>
          </View>

          <View style={{ backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16, gap: 6 }}>
            <Text style={{ fontWeight: weights.bold, color: theme.colors.text }}>{copy.orders.delivery}</Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: typeScale.body }}>
              {order.delivery_address ?? '—'}
            </Text>
            {order.delivery_notes != null && (
              <Text style={{ color: theme.colors.textFaint, fontSize: typeScale.caption }}>Notes: {order.delivery_notes}</Text>
            )}
          </View>

          <View style={{ backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16, gap: 10 }}>
            <Text style={{ fontWeight: weights.bold, color: theme.colors.text }}>{copy.orders.items}</Text>
            {order.items.map((item) => {
              const name = (item.product_snapshot as { name?: string } | null)?.name ?? `Item ${item.product_id}`;
              const bought = boughtIds.includes(item.id);
              return (
                <TactilePressable
                  key={item.id}
                  onPress={() => isPreparing && toggleItem(item.id)}
                  hapticOnPress={isPreparing ? 'selection' : undefined}
                  disabled={!isPreparing}
                  accessibilityRole="button"
                  accessibilityState={{ checked: isPreparing ? bought : undefined }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
                >
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      borderWidth: 1.5,
                      borderColor: bought ? brand.primary : theme.colors.hairline,
                      backgroundColor: bought ? brand.primary : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {bought && <Check size={14} color="#fff" strokeWidth={3} />}
                  </View>
                  <Text style={{ flex: 1, color: theme.colors.text, fontSize: typeScale.body }}>
                    {item.quantity} × {name}
                  </Text>
                  <Text style={{ color: theme.colors.textMuted, fontSize: typeScale.body }}>
                    {item.unit_price_cents != null ? formatZar(item.unit_price_cents * item.quantity) : ''}
                  </Text>
                </TactilePressable>
              );
            })}
            <View style={{ height: 1, backgroundColor: theme.colors.hairline }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: theme.colors.textMuted }}>{copy.checkout.total}</Text>
              <Text style={{ fontWeight: weights.bold, color: theme.colors.text }}>{formatZar(order.total_cents ?? 0)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, borderTopWidth: 1, borderTopColor: theme.colors.hairline, backgroundColor: theme.colors.bg, gap: 8 }}>
        {isPreparing && (
          <>
            <TactilePressable
              onPress={onBought}
              hapticOnPress="commit"
              disabled={busy}
              accessibilityRole="button"
              style={{ backgroundColor: brand.primary, borderRadius: 999, opacity: busy ? 0.6 : 1 }}
            >
              <Text style={{ color: '#fff', textAlign: 'center', fontWeight: weights.bold, textTransform: 'uppercase', letterSpacing: letterSpacing.wide }}>
                {copy.rider.markItemsBought}
              </Text>
            </TactilePressable>
            {allSelected && (
              <TactilePressable
                onPress={onOutForDelivery}
                hapticOnPress="commit"
                accessibilityRole="button"
                style={{ backgroundColor: brand.success, borderRadius: 999 }}
              >
                <Text style={{ color: '#fff', textAlign: 'center', fontWeight: weights.bold, textTransform: 'uppercase', letterSpacing: letterSpacing.wide }}>
                  {copy.rider.outForDelivery}
                </Text>
              </TactilePressable>
            )}
          </>
        )}
        {isOutForDelivery && (
          <TactilePressable
            onPress={onDelivered}
            hapticOnPress="commit"
            disabled={busy}
            accessibilityRole="button"
            style={{ backgroundColor: brand.success, borderRadius: 999, opacity: busy ? 0.6 : 1 }}
          >
            <Text style={{ color: '#fff', textAlign: 'center', fontWeight: weights.bold, textTransform: 'uppercase', letterSpacing: letterSpacing.wide }}>
              {copy.rider.markDelivered}
            </Text>
          </TactilePressable>
        )}
        {isDelivered && (
          <Text style={{ textAlign: 'center', color: brand.success, fontWeight: weights.bold, textTransform: 'uppercase', letterSpacing: letterSpacing.wide }}>
            {copy.rider.delivered} ✓
          </Text>
        )}
        <TactilePressable onPress={() => navigation.goBack()} hapticOnPress="selection" accessibilityRole="button">
          <Text style={{ textAlign: 'center', color: theme.colors.textMuted, fontWeight: weights.medium }}>{copy.orders.done}</Text>
        </TactilePressable>
      </View>
    </View>
  );
}
