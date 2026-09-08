import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { Bike, Star, PackageCheck, ShoppingBag, User, Package, Inbox, Clock } from 'lucide-react-native';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { typeScale, weights, letterSpacing } from '../../theme/typography';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchRiderStats,
  fetchActiveDeliveries,
  fetchAvailableOrders,
  toggleAvailability,
  claimOrder,
} from '../../lib/apiClient';
import { queryKeys } from '../../lib/queryKeys';
import { formatZar } from '../../lib/currency';
import { useSession } from '../../stores/session';
import { TactilePressable } from '../../components/shared/TactilePressable';
import { EmptyState } from '../../components/shared/EmptyState';
import { useToast } from '../../components/shared/GlassToast';
import { copy } from '../../lib/strings';
import type { RootStackParamList } from '../../navigation/types';
import { useAdaptivePoll, createAdaptiveRefetchInterval } from '../../lib/adaptivePoll';
import { useRiderLocationUpdates } from './useRiderLocationUpdates';

import { getOrderTotal } from '../../lib/orderTotal';
import { POLL_BASE_MS, POLL_MAX_MS } from '../../lib/constants';
import { useTopSafeArea } from '../../components/shared/ScreenHeader';

export function RiderHomeScreen() {
  const theme = useTheme();
  const topInset = useTopSafeArea();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const toast = useToast();
  const user = useSession((s) => s.user);
  const isAvailable = user?.rider?.is_available ?? false;
  const [toggling, setToggling] = useState(false);
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Send location updates while rider has active deliveries
  useRiderLocationUpdates();

  const { data: stats } = useQuery({
    queryKey: queryKeys.riderStats,
    queryFn: fetchRiderStats,
  });

  const activePoll = useAdaptivePoll(queryClient, queryKeys.activeDeliveries as unknown as unknown[], {
    baseIntervalMs: POLL_BASE_MS,
    maxIntervalMs: POLL_MAX_MS,
    backoffMultiplier: 2,
    shouldPoll: () => true,
    onError: (error) => console.warn('[RiderHome] Active deliveries polling error:', error),
  });

  const availablePoll = useAdaptivePoll(queryClient, queryKeys.availableOrders as unknown as unknown[], {
    baseIntervalMs: POLL_BASE_MS,
    maxIntervalMs: POLL_MAX_MS,
    backoffMultiplier: 2,
    shouldPoll: () => isAvailable,
    onError: (error) => console.warn('[RiderHome] Available orders polling error:', error),
  });

  const { data: active = [], error: activeError } = useQuery({
    queryKey: queryKeys.activeDeliveries,
    queryFn: fetchActiveDeliveries,
    refetchInterval: createAdaptiveRefetchInterval(activePoll),
  });

  const { data: available = [], error: availableError } = useQuery({
    queryKey: queryKeys.availableOrders,
    queryFn: fetchAvailableOrders,
    refetchInterval: createAdaptiveRefetchInterval(availablePoll),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.availableOrders });
    void queryClient.invalidateQueries({ queryKey: queryKeys.activeDeliveries });
    void queryClient.invalidateQueries({ queryKey: queryKeys.riderStats });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    invalidate();
    // Brief delay so spinner is visible
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
  };

  const onToggle = async () => {
    setToggling(true);
    try {
      await toggleAvailability();
      try {
        const { fetchCurrentUser } = await import('../../lib/apiClient');
        const fresh = await fetchCurrentUser();
        useSession.setState({ user: fresh });
      } catch {}
      toast.show(isAvailable ? copy.rider.goOnline : copy.rider.goOffline, { tone: isAvailable ? 'success' : 'default' });
      invalidate();
    } catch {
      toast.show('Could not update availability.');
    } finally {
      setToggling(false);
    }
  };

  const onClaim = async (orderId: number) => {
    if (claimingId != null) return;
    setClaimingId(orderId);
    try {
      await claimOrder(orderId);
      invalidate();
      navigation.navigate('RiderOrderDetail', { orderId });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('already claimed') || msg.includes('unavailable')) {
        toast.show(copy.auth.alreadyClaimed);
      } else if (msg.includes('network') || msg.includes('Network')) {
        toast.show('Network error — check your connection.');
      } else {
        toast.show('Could not claim order. Try again.');
      }
      invalidate();
    } finally {
      setClaimingId(null);
    }
  };

  const statusBadge = (status: string) => (
    <Text style={{ fontSize: typeScale.caption, color: theme.colors.text.brand, fontWeight: weights.semibold, textTransform: 'capitalize' }}>
      {status.replace(/_/g, ' ')}
    </Text>
  );

  const orderCard = (order: { id: number; status: string; total?: number | string | null; total_cents?: number | null; store?: { name?: string } | null; created_at: string }) => (
    <TactilePressable
      key={order.id}
      variant="card"
      haptic="selection"
      onPress={() => navigation.navigate('RiderOrderDetail', { orderId: order.id })}
      accessibilityRole="button"
      style={{ backgroundColor: theme.colors.surface.primary, borderRadius: 16 }}
    >
      <View style={{ padding: 14, gap: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontWeight: weights.bold, color: theme.colors.text.primary }}>Order #{order.id}</Text>
          {statusBadge(order.status)}
        </View>
        <Text style={{ fontSize: typeScale.caption, color: theme.colors.text.secondary }}>
          {order.store?.name ?? 'Checkstar'} · {formatZar(getOrderTotal(order))}
        </Text>
      </View>
    </TactilePressable>
  );

  const hasError = !!activeError || !!availableError;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.action.primary.background} />}
    >
      <View style={{ paddingTop: topInset, paddingHorizontal: 16, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.surface.primary, alignItems: 'center', justifyContent: 'center' }}>
              <Bike size={20} color={theme.colors.action.primary.background} />
            </View>
            <Text style={{ fontSize: typeScale.title, fontWeight: weights.extrabold, color: theme.colors.text.primary }}>
              Rider
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TactilePressable
              onPress={() => navigation.navigate('RiderHistory')}
              haptic="selection"
              accessibilityRole="button"
              accessibilityLabel="Delivery history"
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.surface.primary, alignItems: 'center', justifyContent: 'center' }}
            >
              <Clock size={18} color={theme.colors.text.secondary} />
            </TactilePressable>
            <TactilePressable
              onPress={() => navigation.navigate('RiderProfile')}
              haptic="selection"
              accessibilityRole="button"
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.surface.primary, alignItems: 'center', justifyContent: 'center' }}
            >
              <User size={18} color={theme.colors.text.secondary} />
            </TactilePressable>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: isAvailable ? theme.colors.status.success.primary : theme.colors.text.tertiary }} />
            <Text style={{ color: theme.colors.text.secondary, fontWeight: weights.semibold }}>
              {isAvailable ? copy.rider.available : copy.rider.offline}
            </Text>
          </View>
        </View>

        <TactilePressable
          onPress={onToggle}
          haptic="commit"
          disabled={toggling}
          accessibilityRole="button"
          accessibilityState={{ checked: isAvailable }}
          style={{ backgroundColor: isAvailable ? theme.colors.status.error.primary : theme.colors.action.primary.background, borderRadius: 999, opacity: toggling ? 0.6 : 1 }}
        >
          <Text style={{ color: theme.colors.action.primary.foreground, textAlign: 'center', fontWeight: weights.bold, textTransform: 'uppercase', letterSpacing: letterSpacing.wide }}>
            {isAvailable ? copy.rider.goOffline : copy.rider.goOnline}
          </Text>
        </TactilePressable>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <StatCard icon={PackageCheck} label={copy.rider.deliveries} value={String(stats?.total_deliveries ?? 0)} />
          <StatCard icon={Star} label={copy.rider.rating} value={stats?.average_rating != null ? stats.average_rating.toFixed(1) : '—'} />
          <StatCard icon={ShoppingBag} label={copy.rider.level} value={String(stats?.level ?? 1)} />
        </View>
      </View>

      {hasError && (
        <View style={{ marginHorizontal: 16, marginTop: 12, backgroundColor: theme.colors.status.error.primary + '15', borderRadius: 12, padding: 12 }}>
          <Text style={{ color: theme.colors.status.error.primary, fontSize: typeScale.caption, fontWeight: weights.semibold }}>
            Connection issue — showing cached data
          </Text>
        </View>
      )}

      <View style={{ marginTop: 20 }}>
        <SectionTitle title={copy.rider.activeDeliveries} />
        {active.length === 0 ? (
          <EmptyState icon={Package} title={copy.rider.emptyActive} caption="Orders you've claimed will appear here" />
        ) : (
          <View style={{ paddingHorizontal: 16, gap: 12 }}>
            {active.map((o) => orderCard(o))}
          </View>
        )}
      </View>

      <View style={{ marginTop: 20 }}>
        <SectionTitle title={copy.rider.availableOrders} />
        {available.length === 0 ? (
          <EmptyState icon={Inbox} title={copy.rider.emptyAvailable} caption="New orders to claim will appear here" />
        ) : (
          <View style={{ paddingHorizontal: 16, gap: 12 }}>
            {available.map((o) => (
              <View key={o.id} style={{ backgroundColor: theme.colors.surface.primary, borderRadius: 16, padding: 14, gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontWeight: weights.bold, color: theme.colors.text.primary }}>Order #{o.id}</Text>
                  {statusBadge(o.status)}
                </View>
                <Text style={{ fontSize: typeScale.caption, color: theme.colors.text.secondary }}>
                  {o.store?.name ?? 'Checkstar'} · {formatZar(getOrderTotal(o))}
                </Text>
                <TactilePressable
                  onPress={() => onClaim(o.id)}
                  haptic="commit"
                  disabled={claimingId != null}
                  accessibilityRole="button"
                  accessibilityState={{ busy: claimingId === o.id }}
                  style={{ backgroundColor: theme.colors.action.primary.background, borderRadius: 999, marginTop: 4, opacity: claimingId === o.id ? 0.6 : 1 }}
                >
                  <Text style={{ color: theme.colors.action.primary.foreground, textAlign: 'center', fontWeight: weights.bold, textTransform: 'uppercase', letterSpacing: letterSpacing.wide, fontSize: typeScale.caption }}>
                    {claimingId === o.id ? copy.rider.claiming : copy.rider.claim}
                  </Text>
                </TactilePressable>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ size?: number; color?: string }>; label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.surface.primary, borderRadius: 16, padding: 14, gap: 6 }}>
      <Icon size={18} color={theme.colors.action.primary.background} />
      <Text style={{ fontSize: typeScale.title, fontWeight: weights.extrabold, color: theme.colors.text.primary }}>{value}</Text>
      <Text style={{ fontSize: typeScale.caption, color: theme.colors.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  const theme = useTheme();
  return (
    <Text style={{ fontSize: typeScale.heading, fontWeight: weights.bold, color: theme.colors.text.primary, paddingHorizontal: 16, marginBottom: 12 }}>
      {title}
    </Text>
  );
}
