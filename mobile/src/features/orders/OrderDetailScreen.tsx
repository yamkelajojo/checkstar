import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, TextInput } from 'react-native';
import { Check, RefreshCw, Star } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { textStyle, fontWeight } from '../../theme/typography';
import { semanticSpacing, semanticRadius } from '../../theme/spacing';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchOrder, cancelOrder, confirmDelivery, reviewOrder } from '../../lib/apiClient';
import { apiErrorReason } from '../../lib/api';
import { queryKeys } from '../../lib/queryKeys';
import { formatZar } from '../../lib/currency';
import { TactilePressable } from '../../components/shared/TactilePressable';
import { SkeletonCard } from '../../components/shared/SkeletonCard';
import { haptic } from '../../lib/haptics';
import { useToast } from '../../components/shared/GlassToast';
import { copy } from '../../lib/strings';
import { useCart } from '../cart/store';
import { POLL_BASE_MS, POLL_MAX_MS } from '../../lib/constants';
import { LiveDeliveryMap } from '../../components/shared/LiveDeliveryMap';
import type { RootStackParamList } from '../../navigation/types';
import {
  STATUS_STEPS,
  statusStepIndex,
  isCancelled,
  cancellable,
  isActiveOrderStatus,
  isAwaitingDeliveryConfirmation,
  canReview,
  cancelConflictLabel,
} from './model';
import { useAdaptivePoll, createAdaptiveRefetchInterval } from '../../lib/adaptivePoll';
import { CUSTOMER_STATUS_LABEL as STATUS_LABEL } from '../../lib/status';
import { useTopSafeArea } from '../../components/shared/ScreenHeader';
import { FadeSlideIn } from '../../components/shared/FadeSlideIn';

const PAYMENT_LABEL: Record<string, string> = {
  pending: 'Pending',
  paid: 'Paid',
  refunded: 'Refunded',
};

function isPollingStatus(status: string | undefined): boolean {
  return status != null && isActiveOrderStatus(status);
}

export function OrderDetailScreen() {
  const theme = useTheme();
  const topInset = useTopSafeArea();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { orderId: rawOrderId } = route.params as { orderId: number | string };
  const orderId = Number(rawOrderId);
  const queryClient = useQueryClient();
  const toast = useToast();

  const adaptivePoll = useAdaptivePoll(queryClient, queryKeys.order(orderId) as unknown as unknown[], {
    baseIntervalMs: POLL_BASE_MS,
    maxIntervalMs: POLL_MAX_MS,
    backoffMultiplier: 2,
    shouldPoll: () => isPollingStatus(order?.status),
    onError: (error) => {
      console.warn('[OrderDetail] Polling error:', error);
    },
  });

  const { data: order, isLoading } = useQuery({
    queryKey: queryKeys.order(orderId),
    queryFn: () => fetchOrder(orderId),
    refetchInterval: createAdaptiveRefetchInterval(adaptivePoll),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.order(orderId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.orders });
  };

  const [cancelConflict, setCancelConflict] = useState<string | null>(null);

  const onCancel = () => {
    Alert.alert(copy.orders.cancelThisOrder, copy.orders.cancelWarning, [
      { text: 'Keep order', style: 'cancel' },
      {
        text: copy.orders.cancel,
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelOrder(orderId, 'Cancelled by customer');
            setCancelConflict(null);
            toast.show(copy.auth.orderCancelled);
            invalidate();
          } catch (e) {
            setCancelConflict(apiErrorReason(e));
          }
        },
      },
    ]);
  };

  const onConfirmReceived = async () => {
    try {
      await confirmDelivery(orderId);
      haptic.success();
      toast.show('Delivery confirmed — thanks!', { tone: 'success' });
      invalidate();
    } catch {
      toast.show('Could not confirm the delivery.');
    }
  };

  if (isLoading || !order) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background.primary, padding: semanticSpacing.screenPadding, paddingTop: 72 }}>
        <SkeletonCard height={320} width={undefined} />
      </View>
    );
  }

  const statusIndex = statusStepIndex(order.status);
  const cancelled = isCancelled(order.status);
  const cancellableNow = cancellable(order);
  const awaitingConfirm = isAwaitingDeliveryConfirmation(order.status);
  const reviewable = canReview(order.status, order.rider_rating);
  const canReorder = order.status !== 'pending' && order.status !== 'preparing';

  const handleReorder = () => {
    if (!order?.items) return;
    let added = 0;
    let skipped = 0;
    for (const item of order.items) {
      try {
        useCart.getState().add(String(item.product_id), item.quantity);
        added++;
      } catch {
        skipped++;
      }
    }
    haptic.success();
    if (skipped === 0) {
      toast.show(`${added} item(s) added to cart`, { tone: 'success' });
    } else {
      toast.show(`${added} added, ${skipped} skipped`, { tone: 'success' });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingTop: topInset, paddingHorizontal: semanticSpacing.screenPadding, gap: semanticSpacing.lg }}>
          <FadeSlideIn delay={60} distance={12}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <Text style={[textStyle.h2, { color: theme.colors.text.primary, letterSpacing: -0.3 }]}>
                Order #{order.id}
              </Text>
              <Text style={[textStyle.caption, { color: theme.colors.text.secondary }]}>
                {new Date(order.created_at).toLocaleDateString()}
              </Text>
            </View>
          </FadeSlideIn>

          <FadeSlideIn delay={100} distance={10}>
            <View style={{ backgroundColor: theme.colors.surface.primary, borderRadius: semanticRadius.card, padding: semanticSpacing.md, gap: 14, borderWidth: 1, borderColor: theme.colors.border.subtle, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 }}>
              {cancelled ? (
                <Text style={[textStyle.body, { color: brand.error, fontWeight: fontWeight.bold, textAlign: 'center' }]}>{copy.orders.cancelled}</Text>
              ) : (
                STATUS_STEPS.map((step, i) => {
                  const done = i <= statusIndex;
                  return (
                    <FadeSlideIn key={step} delay={120 + i * 40} distance={8}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: semanticSpacing.inlineGap }}>
                        <View
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 12,
                            backgroundColor: done ? brand.orange : theme.colors.border.subtle,
                            alignItems: 'center',
                            justifyContent: 'center',
                            shadowColor: done ? brand.orange : 'transparent',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: done ? 0.25 : 0,
                            shadowRadius: 4,
                          }}
                        >
                          {done && <Check size={14} color="#fff" strokeWidth={3} />}
                        </View>
                        <Text
                          style={[
                            textStyle.body,
                            {
                              color: done ? theme.colors.text.primary : theme.colors.text.tertiary,
                              fontWeight: done ? fontWeight.semibold : fontWeight.regular,
                              letterSpacing: done ? -0.2 : 0,
                            },
                          ]}
                        >
                          {STATUS_LABEL[step]}
                        </Text>
                      </View>
                    </FadeSlideIn>
                  );
                })
              )}
            </View>
          </FadeSlideIn>

          {['confirmed', 'preparing', 'out_for_delivery'].includes(order.status) && order.store && (
            <FadeSlideIn delay={160} distance={12}>
              <LiveDeliveryMap
                orderId={orderId}
                orderStatus={order.status}
                storeName={order.store.name}
                storeLat={order.store.latitude ?? undefined}
                storeLng={order.store.longitude ?? undefined}
                deliveryAddress={order.delivery_address}
                deliveryLat={order.delivery_latitude ?? undefined}
                deliveryLng={order.delivery_longitude ?? undefined}
                distanceKm={undefined}
                durationMinutes={undefined}
                riderName={order.rider?.user?.name}
                mapHeight={300}
              />
            </FadeSlideIn>
          )}

          <FadeSlideIn delay={200} distance={10}>
            <View style={{ backgroundColor: theme.colors.surface.primary, borderRadius: semanticRadius.card, padding: semanticSpacing.md, gap: semanticSpacing.xxs, borderWidth: 1, borderColor: theme.colors.border.subtle }}>
              <Text style={[textStyle.body, { fontWeight: fontWeight.bold, color: theme.colors.text.primary, letterSpacing: -0.2 }]}>{copy.orders.delivery}</Text>
              <Text style={[textStyle.body, { color: theme.colors.text.secondary }]}>
                {order.delivery_address ?? '\u2014'}
              </Text>
              {order.rider?.user?.name != null && (
                <Text style={[textStyle.body, { color: theme.colors.text.secondary }]}>
                  Rider: <Text style={{ fontWeight: fontWeight.semibold, color: theme.colors.text.primary }}>{order.rider.user.name}</Text>
                </Text>
              )}
            </View>
          </FadeSlideIn>

          <FadeSlideIn delay={240} distance={10}>
            <View style={{ backgroundColor: theme.colors.surface.primary, borderRadius: semanticRadius.card, padding: semanticSpacing.md, gap: semanticSpacing.xs, borderWidth: 1, borderColor: theme.colors.border.subtle }}>
              <Text style={[textStyle.body, { fontWeight: fontWeight.bold, color: theme.colors.text.primary, letterSpacing: -0.2 }]}>{copy.orders.items}</Text>
              {order.items.map((item, idx) => {
                const name = (item.product_snapshot as { name?: string } | null)?.name ?? `Item ${item.product_id}`;
                const unit = (item.product_snapshot as { unit?: string } | null)?.unit ?? '';
                return (
                  <FadeSlideIn key={item.id} delay={260 + idx * 20} distance={6}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={[textStyle.body, { flex: 1, color: theme.colors.text.primary }]}>
                        {item.quantity} {'\u00D7'} {name}
                        {unit ? ` (${unit})` : ''}
                      </Text>
                      <Text style={[textStyle.body, { color: theme.colors.text.secondary }]}>
                        {item.unit_price_cents != null ? formatZar(item.unit_price_cents * item.quantity) : ''}
                      </Text>
                    </View>
                  </FadeSlideIn>
                );
              })}
              <View style={{ height: 1, backgroundColor: theme.colors.border.subtle, marginVertical: 4 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={[textStyle.body, { color: theme.colors.text.secondary }]}>{copy.checkout.total}</Text>
                <Text style={[textStyle.body, { fontWeight: fontWeight.bold, color: theme.colors.text.primary, letterSpacing: -0.2 }]}>{formatZar(order.total_cents ?? 0)}</Text>
              </View>
            </View>
          </FadeSlideIn>

          {canReorder && (
            <FadeSlideIn delay={280} distance={8}>
              <TactilePressable
                onPress={handleReorder}
                haptic="commit"
                accessibilityRole="button"
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: semanticSpacing.xxs, backgroundColor: theme.colors.surface.primary, borderRadius: semanticRadius.buttonPill, paddingVertical: semanticSpacing.sm, borderWidth: 1, borderColor: brand.orange }}
              >
                <RefreshCw size={16} color={brand.orange} />
                <Text style={[textStyle.bodySmall, { color: brand.orange, fontWeight: fontWeight.semibold, letterSpacing: 0.2 }]}>
                  Reorder
                </Text>
              </TactilePressable>
            </FadeSlideIn>
          )}

          <FadeSlideIn delay={300} distance={8}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: theme.colors.surface.primary, borderRadius: semanticRadius.card, padding: semanticSpacing.md, borderWidth: 1, borderColor: theme.colors.border.subtle }}>
              <Text style={[textStyle.body, { color: theme.colors.text.secondary }]}>{copy.orders.payment}</Text>
              <Text style={[textStyle.body, { fontWeight: fontWeight.semibold, color: theme.colors.text.primary }]}>
                {order.payment_method != null ? `${order.payment_method} \u00B7 ` : ''}
                {PAYMENT_LABEL[order.payment_status] ?? order.payment_status}
              </Text>
            </View>
          </FadeSlideIn>

          {order.activity_logs != null && order.activity_logs.length > 0 && (
            <FadeSlideIn delay={340} distance={10}>
              <View style={{ backgroundColor: theme.colors.surface.primary, borderRadius: semanticRadius.card, padding: semanticSpacing.md, gap: semanticSpacing.xs, borderWidth: 1, borderColor: theme.colors.border.subtle }}>
                <Text style={[textStyle.body, { fontWeight: fontWeight.bold, color: theme.colors.text.primary, letterSpacing: -0.2 }]}>{copy.orders.activity}</Text>
                {order.activity_logs.map((log, idx) => (
                  <FadeSlideIn key={log.id} delay={360 + idx * 20} distance={6}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: semanticSpacing.inlineGap }}>
                      <Text style={[textStyle.body, { flex: 1, color: theme.colors.text.secondary }]}>
                        {log.status.replace(/_/g, ' ')}
                      </Text>
                      <Text style={[textStyle.caption, { color: theme.colors.text.tertiary }]}>
                        {new Date(log.created_at).toLocaleString()}
                      </Text>
                    </View>
                  </FadeSlideIn>
                ))}
              </View>
            </FadeSlideIn>
          )}

          {reviewable && (
            <FadeSlideIn delay={380} distance={10}>
              <ReviewCard orderId={orderId} onDone={invalidate} />
            </FadeSlideIn>
          )}
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: semanticSpacing.screenPadding, borderTopWidth: 1, borderTopColor: theme.colors.border.subtle, backgroundColor: theme.colors.background.primary, gap: semanticSpacing.xs }}>
        {cancelConflict != null && (
          <FadeSlideIn delay={0} distance={6}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: semanticSpacing.inlineGap }}>
              <View
                style={{
                  backgroundColor: theme.colors.surface.primary,
                  borderRadius: semanticRadius.buttonPill,
                  paddingHorizontal: semanticSpacing.md,
                  paddingVertical: semanticSpacing.xxs,
                  alignSelf: 'flex-start',
                }}
              >
                <Text style={[textStyle.caption, { color: brand.error, fontWeight: fontWeight.semibold }]}>
                  {cancelConflictLabel(cancelConflict)}
                </Text>
              </View>
            </View>
          </FadeSlideIn>
        )}
        {awaitingConfirm && (
          <TactilePressable
            onPress={onConfirmReceived}
            haptic="commit"
            accessibilityRole="button"
            style={{ backgroundColor: brand.success, borderRadius: semanticRadius.buttonPill, shadowColor: brand.success, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 3 }}
          >
            <Text style={[textStyle.buttonPrimary, { color: theme.colors.text.inverse, textAlign: 'center', fontWeight: fontWeight.bold, textTransform: 'uppercase', letterSpacing: 0.3 }]}>
              {copy.orders.confirmReceived}
            </Text>
          </TactilePressable>
        )}
        {cancellableNow && (
          <TactilePressable onPress={onCancel} haptic="warning" accessibilityRole="button">
            <Text style={[textStyle.bodySmall, { textAlign: 'center', color: brand.error, fontWeight: fontWeight.semibold }]}>
              {copy.orders.cancel}
            </Text>
          </TactilePressable>
        )}
        <TactilePressable onPress={() => navigation.goBack()} haptic="selection" accessibilityRole="button">
          <Text style={[textStyle.bodySmall, { textAlign: 'center', color: theme.colors.text.secondary, fontWeight: fontWeight.medium }]}>
            {copy.orders.done}
          </Text>
        </TactilePressable>
      </View>
    </View>
  );
}

function ReviewCard({ orderId, onDone }: { orderId: number; onDone: () => void }) {
  const theme = useTheme();
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      await reviewOrder(orderId, rating, comment.trim() || undefined);
      toast.show(copy.auth.thanksForReview, { tone: 'success' });
      onDone();
    } catch {
      toast.show('Could not submit the review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ backgroundColor: theme.colors.surface.primary, borderRadius: semanticRadius.card, padding: semanticSpacing.md, gap: semanticSpacing.inlineGap, borderWidth: 1, borderColor: theme.colors.border.subtle }}>
      <Text style={[textStyle.body, { fontWeight: fontWeight.bold, color: theme.colors.text.primary, letterSpacing: -0.2 }]}>{copy.review.title}</Text>
      <View style={{ flexDirection: 'row', gap: semanticSpacing.inlineGap }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => { haptic.selection(); setRating(n); }} accessibilityRole="button" accessibilityLabel={`${n} stars`} hitSlop={6}>
            <Star size={28} color={n <= rating ? brand.star : theme.colors.border.subtle} fill={n <= rating ? brand.star : 'transparent'} />
          </Pressable>
        ))}
      </View>
      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder="How was your Rider?"
        placeholderTextColor={theme.colors.text.tertiary}
        style={[
          textStyle.body,
          {
            backgroundColor: theme.colors.background.secondary,
            borderRadius: semanticRadius.input,
            paddingHorizontal: semanticSpacing.md,
            paddingVertical: semanticSpacing.xs,
            color: theme.colors.text.primary,
            borderWidth: 1,
            borderColor: theme.colors.border.subtle,
          },
        ]}
      />
      <TactilePressable
        onPress={submit}
        haptic="commit"
        disabled={rating === 0 || submitting}
        accessibilityRole="button"
        style={{ backgroundColor: rating > 0 ? brand.orange : theme.colors.border.subtle, borderRadius: semanticRadius.buttonPill, opacity: rating > 0 ? 1 : 0.6, shadowColor: rating > 0 ? brand.orange : 'transparent', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 6 }}
      >
        <Text style={[textStyle.buttonPrimary, { color: rating > 0 ? theme.colors.text.inverse : theme.colors.text.secondary, textAlign: 'center', fontWeight: fontWeight.bold, textTransform: 'uppercase', letterSpacing: 0.3 }]}>
          {submitting ? '\u2026' : copy.review.cta}
        </Text>
      </TactilePressable>
    </View>
  );
}
