import { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, TextInput } from 'react-native';
import { Check, Star, ChevronLeft } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { textStyle, fontWeight, letterSpacing } from '../../theme/typography';
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
import { useAdaptivePoll, createAdaptiveRefetchInterval } from '../../lib/adaptivePoll';
import { CUSTOMER_STATUS_LABEL as STATUS_LABEL } from '../../lib/status';

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

function isPollingStatus(status: string | undefined): boolean {
  return status != null && isActiveOrderStatus(status);
}

export function OrderDetailScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { orderId } = route.params as { orderId: number };
  const queryClient = useQueryClient();
  const toast = useToast();

  const adaptivePoll = useAdaptivePoll(queryClient, queryKeys.order(orderId) as unknown as unknown[], {
    baseIntervalMs: 10_000,
    maxIntervalMs: 60_000,
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

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      {/* Back button - top left with safe area */}
      <TactilePressable
        onPress={handleBack}
        haptic="selection"
        accessibilityRole="button"
        accessibilityLabel="Back"
        style={{
          position: 'absolute',
          top: 56 + semanticSpacing.md,
          left: semanticSpacing.md,
          zIndex: 10,
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: theme.colors.surface.elevated,
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <ChevronLeft size={18} color={theme.colors.text.primary} strokeWidth={2.2} />
      </TactilePressable>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingTop: 56, paddingHorizontal: semanticSpacing.screenPadding, gap: semanticSpacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <Text style={{ ...textStyle.h2, color: theme.colors.text.primary }}>
              Order #{order.id}
            </Text>
            <Text style={{ color: theme.colors.text.secondary, ...textStyle.caption }}>
              {new Date(order.created_at).toLocaleDateString()}
            </Text>
          </View>

          {/* Status timeline */}
          <View style={{ backgroundColor: theme.colors.surface.primary, borderRadius: semanticRadius.card, padding: semanticSpacing.md, gap: 14 }}>
            {cancelled ? (
              <Text style={{ color: brand.error, fontWeight: fontWeight.bold, textAlign: 'center', ...textStyle.body }}>{copy.orders.cancelled}</Text>
            ) : (
              STATUS_STEPS.map((step, i) => {
                const done = i <= statusIndex;
                return (
                  <View key={step} style={{ flexDirection: 'row', alignItems: 'center', gap: semanticSpacing.inlineGap }}>
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: done ? brand.orange : theme.colors.border.subtle,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {done && <Check size={14} color="#fff" strokeWidth={3} />}
                    </View>
                    <Text
                      style={{
                        color: done ? theme.colors.text.primary : theme.colors.text.tertiary,
                        fontWeight: done ? fontWeight.semibold : fontWeight.regular,
                        ...textStyle.body,
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
          <View style={{ backgroundColor: theme.colors.surface.primary, borderRadius: semanticRadius.card, padding: semanticSpacing.md, gap: semanticSpacing.xxs }}>
            <Text style={{ fontWeight: fontWeight.bold, color: theme.colors.text.primary, ...textStyle.body }}>{copy.orders.delivery}</Text>
            <Text style={{ color: theme.colors.text.secondary, ...textStyle.body }}>
              {order.delivery_address ?? '\u2014'}
            </Text>
            {order.rider?.user?.name != null && (
              <Text style={{ color: theme.colors.text.secondary, ...textStyle.body }}>
                Rider: <Text style={{ fontWeight: fontWeight.semibold, color: theme.colors.text.primary }}>{order.rider.user.name}</Text>
              </Text>
            )}
          </View>

          {/* Items */}
          <View style={{ backgroundColor: theme.colors.surface.primary, borderRadius: semanticRadius.card, padding: semanticSpacing.md, gap: semanticSpacing.xs }}>
            <Text style={{ fontWeight: fontWeight.bold, color: theme.colors.text.primary, ...textStyle.body }}>{copy.orders.items}</Text>
            {order.items.map((item) => {
              const name = (item.product_snapshot as { name?: string } | null)?.name ?? `Item ${item.product_id}`;
              const unit = (item.product_snapshot as { unit?: string } | null)?.unit ?? '';
              return (
                <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ flex: 1, color: theme.colors.text.primary, ...textStyle.body }}>
                    {item.quantity} \u00D7 {name}
                    {unit ? ` (${unit})` : ''}
                  </Text>
                  <Text style={{ color: theme.colors.text.secondary, ...textStyle.body }}>
                    {item.unit_price_cents != null ? formatZar(item.unit_price_cents * item.quantity) : ''}
                  </Text>
                </View>
              );
            })}
            <View style={{ height: 1, backgroundColor: theme.colors.border.subtle }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: theme.colors.text.secondary, ...textStyle.body }}>{copy.checkout.total}</Text>
              <Text style={{ fontWeight: fontWeight.bold, color: theme.colors.text.primary, ...textStyle.body }}>{formatZar(order.total_cents ?? 0)}</Text>
            </View>
          </View>

          {/* Payment */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: theme.colors.text.secondary, ...textStyle.body }}>{copy.orders.payment}</Text>
            <Text style={{ fontWeight: fontWeight.semibold, color: theme.colors.text.primary, ...textStyle.body }}>
              {order.payment_method != null ? `${order.payment_method} \u00B7 ` : ''}
              {PAYMENT_LABEL[order.payment_status] ?? order.payment_status}
            </Text>
          </View>

          {/* Activity log */}
          {order.activity_logs != null && order.activity_logs.length > 0 && (
            <View style={{ backgroundColor: theme.colors.surface.primary, borderRadius: semanticRadius.card, padding: semanticSpacing.md, gap: semanticSpacing.xs }}>
              <Text style={{ fontWeight: fontWeight.bold, color: theme.colors.text.primary, ...textStyle.body }}>{copy.orders.activity}</Text>
              {order.activity_logs.map((log) => (
                <View key={log.id} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: semanticSpacing.inlineGap }}>
                  <Text style={{ flex: 1, color: theme.colors.text.secondary, ...textStyle.body }}>
                    {log.status.replace(/_/g, ' ')}
                  </Text>
                  <Text style={{ color: theme.colors.text.tertiary, ...textStyle.caption }}>
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
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: semanticSpacing.screenPadding, borderTopWidth: 1, borderTopColor: theme.colors.border.subtle, backgroundColor: theme.colors.background.primary, gap: semanticSpacing.xs }}>
        {cancelConflict != null && (
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
              <Text style={{ color: brand.error, ...textStyle.caption, fontWeight: fontWeight.semibold }}>
                {cancelConflictLabel(cancelConflict)}
              </Text>
            </View>
          </View>
        )}
        {awaitingConfirm && (
          <TactilePressable
            onPress={onConfirmReceived}
            haptic="commit"
            accessibilityRole="button"
            style={{ backgroundColor: brand.success, borderRadius: semanticRadius.buttonPill }}
          >
            <Text style={{ color: theme.colors.text.inverse, textAlign: 'center', fontWeight: fontWeight.bold, textTransform: 'uppercase', letterSpacing: letterSpacing.wide, ...textStyle.buttonPrimary }}>
              {copy.orders.confirmReceived}
            </Text>
          </TactilePressable>
        )}
        {cancellableNow && (
          <TactilePressable onPress={onCancel} haptic="warning" accessibilityRole="button">
            <Text style={{ textAlign: 'center', color: brand.error, fontWeight: fontWeight.semibold, ...textStyle.bodySmall }}>
              {copy.orders.cancel}
            </Text>
          </TactilePressable>
        )}
        <TactilePressable onPress={() => navigation.goBack()} haptic="selection" accessibilityRole="button">
          <Text style={{ textAlign: 'center', color: theme.colors.text.secondary, fontWeight: fontWeight.medium, ...textStyle.bodySmall }}>
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
    <View style={{ backgroundColor: theme.colors.surface.primary, borderRadius: semanticRadius.card, padding: semanticSpacing.md, gap: semanticSpacing.inlineGap }}>
      <Text style={{ fontWeight: fontWeight.bold, color: theme.colors.text.primary, ...textStyle.body }}>{copy.review.title}</Text>
      <View style={{ flexDirection: 'row', gap: semanticSpacing.inlineGap }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setRating(n)} accessibilityRole="button" accessibilityLabel={`${n} stars`} hitSlop={6}>
            <Star size={28} color={n <= rating ? brand.star : theme.colors.border.subtle} fill={n <= rating ? brand.star : 'transparent'} />
          </Pressable>
        ))}
      </View>
      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder="How was your Rider?"
        placeholderTextColor={theme.colors.text.tertiary}
        style={{
          backgroundColor: theme.colors.background.secondary,
          borderRadius: semanticRadius.input,
          paddingHorizontal: semanticSpacing.md,
          paddingVertical: semanticSpacing.xs,
          color: theme.colors.text.primary,
          ...textStyle.body,
        }}
      />
      <TactilePressable
        onPress={submit}
        haptic="commit"
        disabled={rating === 0 || submitting}
        accessibilityRole="button"
        style={{ backgroundColor: rating > 0 ? brand.orange : theme.colors.border.subtle, borderRadius: semanticRadius.buttonPill, opacity: rating > 0 ? 1 : 0.6 }}
      >
        <Text style={{ color: rating > 0 ? theme.colors.text.inverse : theme.colors.text.secondary, textAlign: 'center', fontWeight: fontWeight.bold, textTransform: 'uppercase', letterSpacing: letterSpacing.wide, ...textStyle.buttonPrimary }}>
          {submitting ? '\u2026' : copy.review.cta}
        </Text>
      </TactilePressable>
    </View>
  );
}