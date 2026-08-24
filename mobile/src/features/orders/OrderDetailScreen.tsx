import { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, TextInput } from 'react-native';
import { Check, Star } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { typeScale, weights, letterSpacing } from '../../theme/typography';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchOrder, cancelOrder, confirmDelivery, reviewOrder } from '../../lib/apiClient';
import { apiErrorReason } from '../../lib/api';
import { queryKeys } from '../../lib/queryKeys';
import { formatZar } from '../../lib/currency';
import { TactilePressable } from '../../components/shared/TactilePressable';
import { SkeletonCard } from '../../components/shared/SkeletonCard';
import { useToast } from '../../components/shared/GlassToast';
import { copy } from '../../lib/strings';
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
  orderUpdateBody,
} from './model';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Order received',
  confirmed: 'Confirmed',
  preparing: 'Being packed',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const PAYMENT_LABEL: Record<string, string> = {
  pending: 'Pending',
  paid: 'Paid',
  refunded: 'Refunded',
};

function useOrderStatusNotification(status: string | undefined, orderId: number) {
  const previousStatus = useRef<string | null>(null);
  useEffect(() => {
    if (status == null) return;
    const previous = previousStatus.current;
    previousStatus.current = status;
    if (previous != null && previous !== status) {
      void Notifications.scheduleNotificationAsync({
        content: {
          title: copy.orders.updateTitle,
          body: orderUpdateBody(status),
          data: { orderId },
        },
        trigger: null,
      });
    }
  }, [status, orderId]);
}

function pollIntervalForStatus(status: string | undefined): number | false {
  return status != null && isActiveOrderStatus(status) ? 10_000 : false;
}

export function OrderDetailScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { orderId } = route.params as { orderId: number };
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: order, isLoading } = useQuery({
    queryKey: queryKeys.order(orderId),
    queryFn: () => fetchOrder(orderId),
    refetchInterval: (query) => pollIntervalForStatus(query.state.data?.status),
  });

  useOrderStatusNotification(order?.status, orderId);

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
      toast.show('Delivery confirmed — thanks!', { tone: 'success' });
      invalidate();
    } catch {
      toast.show('Could not confirm the delivery.');
    }
  };

  if (isLoading || !order) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg, padding: 16, paddingTop: 72 }}>
        <SkeletonCard height={320} width={undefined} />
      </View>
    );
  }

  const statusIndex = statusStepIndex(order.status);
  const cancelled = isCancelled(order.status);
  const cancellableNow = cancellable(order);
  const awaitingConfirm = isAwaitingDeliveryConfirmation(order.status);
  const reviewable = canReview(order.status, order.rider_rating);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingTop: 56, paddingHorizontal: 16, gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: typeScale.title, fontWeight: weights.extrabold, color: theme.colors.text }}>
              Order #{order.id}
            </Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: typeScale.caption }}>
              {new Date(order.created_at).toLocaleDateString()}
            </Text>
          </View>

          {/* Status timeline */}
          <View style={{ backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16, gap: 14 }}>
            {cancelled ? (
              <Text style={{ color: brand.accent, fontWeight: weights.bold, textAlign: 'center' }}>{copy.orders.cancelled}</Text>
            ) : (
              STATUS_STEPS.map((step, i) => {
                const done = i <= statusIndex;
                return (
                  <View key={step} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: done ? brand.primary : theme.colors.hairline,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {done && <Check size={14} color="#fff" strokeWidth={3} />}
                    </View>
                    <Text
                      style={{
                        color: done ? theme.colors.text : theme.colors.textFaint,
                        fontWeight: done ? weights.semibold : weights.regular,
                      }}
                    >
                      {STATUS_LABEL[step]}
                    </Text>
                  </View>
                );
              })
            )}
          </View>

          {/* Address + rider */}
          <View style={{ backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16, gap: 6 }}>
            <Text style={{ fontWeight: weights.bold, color: theme.colors.text }}>{copy.orders.delivery}</Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: typeScale.body }}>
              {order.delivery_address ?? '—'}
            </Text>
            {order.rider?.user?.name != null && (
              <Text style={{ color: theme.colors.textMuted, fontSize: typeScale.body }}>
                Rider: <Text style={{ fontWeight: weights.semibold, color: theme.colors.text }}>{order.rider.user.name}</Text>
              </Text>
            )}
          </View>

          {/* Items */}
          <View style={{ backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16, gap: 10 }}>
            <Text style={{ fontWeight: weights.bold, color: theme.colors.text }}>{copy.orders.items}</Text>
            {order.items.map((item) => {
              const name = (item.product_snapshot as { name?: string } | null)?.name ?? `Item ${item.product_id}`;
              const unit = (item.product_snapshot as { unit?: string } | null)?.unit ?? '';
              return (
                <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ flex: 1, color: theme.colors.text, fontSize: typeScale.body }}>
                    {item.quantity} × {name}
                    {unit ? ` (${unit})` : ''}
                  </Text>
                  <Text style={{ color: theme.colors.textMuted, fontSize: typeScale.body }}>
                    {item.unit_price_cents != null ? formatZar(item.unit_price_cents * item.quantity) : ''}
                  </Text>
                </View>
              );
            })}
            <View style={{ height: 1, backgroundColor: theme.colors.hairline }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: theme.colors.textMuted }}>{copy.checkout.total}</Text>
              <Text style={{ fontWeight: weights.bold, color: theme.colors.text }}>{formatZar(order.total_cents ?? 0)}</Text>
            </View>
          </View>

          {/* Payment */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: theme.colors.textMuted }}>{copy.orders.payment}</Text>
            <Text style={{ fontWeight: weights.semibold, color: theme.colors.text }}>
              {order.payment_method != null ? `${order.payment_method} · ` : ''}
              {PAYMENT_LABEL[order.payment_status] ?? order.payment_status}
            </Text>
          </View>

          {/* Activity log */}
          {order.activity_logs != null && order.activity_logs.length > 0 && (
            <View style={{ backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16, gap: 8 }}>
              <Text style={{ fontWeight: weights.bold, color: theme.colors.text }}>{copy.orders.activity}</Text>
              {order.activity_logs.map((log) => (
                <View key={log.id} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                  <Text style={{ flex: 1, color: theme.colors.textMuted, fontSize: typeScale.body }}>
                    {log.status.replace(/_/g, ' ')}
                  </Text>
                  <Text style={{ color: theme.colors.textFaint, fontSize: typeScale.caption }}>
                    {new Date(log.created_at).toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Review */}
          {reviewable && <ReviewCard orderId={orderId} onDone={invalidate} />}
        </View>
      </ScrollView>

      {/* Sticky actions */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, borderTopWidth: 1, borderTopColor: theme.colors.hairline, backgroundColor: theme.colors.bg, gap: 8 }}>
        {cancelConflict != null && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <View
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 6,
                alignSelf: 'flex-start',
              }}
            >
              <Text style={{ color: brand.accent, fontSize: typeScale.caption, fontWeight: weights.semibold }}>
                {cancelConflictLabel(cancelConflict)}
              </Text>
            </View>
          </View>
        )}
        {awaitingConfirm && (
          <TactilePressable
            onPress={onConfirmReceived}
            hapticOnPress="commit"
            accessibilityRole="button"
            style={{ backgroundColor: brand.success, borderRadius: 999 }}
          >
            <Text style={{ color: '#fff', textAlign: 'center', fontWeight: weights.bold, textTransform: 'uppercase', letterSpacing: letterSpacing.wide }}>
              {copy.orders.confirmReceived}
            </Text>
          </TactilePressable>
        )}
        {cancellableNow && (
          <TactilePressable onPress={onCancel} hapticOnPress="warning" accessibilityRole="button">
            <Text style={{ textAlign: 'center', color: brand.accent, fontWeight: weights.semibold }}>
              {copy.orders.cancel}
            </Text>
          </TactilePressable>
        )}
        <TactilePressable onPress={() => navigation.goBack()} hapticOnPress="selection" accessibilityRole="button">
          <Text style={{ textAlign: 'center', color: theme.colors.textMuted, fontWeight: weights.medium }}>
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
    <View style={{ backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16, gap: 10 }}>
      <Text style={{ fontWeight: weights.bold, color: theme.colors.text }}>{copy.review.title}</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setRating(n)} accessibilityRole="button" accessibilityLabel={`${n} stars`} hitSlop={6}>
            <Star size={28} color={n <= rating ? brand.star : theme.colors.hairline} fill={n <= rating ? brand.star : 'transparent'} />
          </Pressable>
        ))}
      </View>
      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder="How was your Rider?"
        placeholderTextColor={theme.colors.textFaint}
        style={{
          backgroundColor: theme.colors.bgAlt,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 10,
          color: theme.colors.text,
          fontSize: typeScale.body,
        }}
      />
      <TactilePressable
        onPress={submit}
        hapticOnPress="commit"
        disabled={rating === 0 || submitting}
        accessibilityRole="button"
        style={{ backgroundColor: rating > 0 ? brand.primary : theme.colors.hairline, borderRadius: 999, opacity: rating > 0 ? 1 : 0.6 }}
      >
        <Text style={{ color: rating > 0 ? '#fff' : theme.colors.textMuted, textAlign: 'center', fontWeight: weights.bold, textTransform: 'uppercase', letterSpacing: letterSpacing.wide }}>
          {submitting ? '…' : copy.review.cta}
        </Text>
      </TactilePressable>
    </View>
  );
}
