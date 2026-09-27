import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { Bike, Star, PackageCheck, ShoppingBag, User, Package, Inbox, Clock } from 'lucide-react-native';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { textStyle, fontWeight } from '../../theme/typography';
import { semanticSpacing, semanticRadius } from '../../theme/spacing';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchRiderStats, fetchActiveDeliveries, fetchAvailableOrders, toggleAvailability, claimOrder } from '../../lib/apiClient';
import { queryKeys } from '../../lib/queryKeys';
import { formatZar } from '../../lib/currency';
import { useSession } from '../../stores/session';
import { TactilePressable } from '../../components/shared/TactilePressable';
import { EmptyState } from '../../components/shared/EmptyState';
import { FadeSlideIn } from '../../components/shared/FadeSlideIn';
import { CrashCascadeIn } from '../../components/shared/CrashCascadeIn';
import { useToast } from '../../components/shared/GlassToast';
import { copy } from '../../lib/strings';
import type { RootStackParamList } from '../../navigation/types';
import { useAdaptivePoll, createAdaptiveRefetchInterval } from '../../lib/adaptivePoll';
import { useRiderLocationUpdates } from './useRiderLocationUpdates';
import { getOrderTotal } from '../../lib/orderTotal';
import { POLL_BASE_MS, POLL_MAX_MS } from '../../lib/constants';
import { useTopSafeArea } from '../../components/shared/ScreenHeader';
import { brand } from '../../theme/colors';
import { formatNumeric } from '../../lib/numbers';

export function RiderHomeScreen() {
  const theme = useTheme();
  const topInset = useTopSafeArea(semanticSpacing.sm);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const toast = useToast();
  const user = useSession((s) => s.user);
  const isAvailable = user?.rider?.is_available ?? false;
  const [toggling, setToggling] = useState(false);
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useRiderLocationUpdates();

  const { data: stats } = useQuery({ queryKey: queryKeys.riderStats, queryFn: fetchRiderStats });
  const activePoll = useAdaptivePoll(queryClient, queryKeys.activeDeliveries as unknown as unknown[], { baseIntervalMs: POLL_BASE_MS, maxIntervalMs: POLL_MAX_MS, backoffMultiplier: 2, shouldPoll: () => true, onError: (e) => console.warn('[RiderHome] polling error', e) });
  const availablePoll = useAdaptivePoll(queryClient, queryKeys.availableOrders as unknown as unknown[], { baseIntervalMs: POLL_BASE_MS, maxIntervalMs: POLL_MAX_MS, backoffMultiplier: 2, shouldPoll: () => isAvailable, onError: (e) => console.warn('[RiderHome] available polling error', e) });

  const { data: active = [], error: activeError } = useQuery({ queryKey: queryKeys.activeDeliveries, queryFn: fetchActiveDeliveries, refetchInterval: createAdaptiveRefetchInterval(activePoll) });
  const { data: available = [], error: availableError } = useQuery({ queryKey: queryKeys.availableOrders, queryFn: fetchAvailableOrders, refetchInterval: createAdaptiveRefetchInterval(availablePoll) });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.availableOrders });
    void queryClient.invalidateQueries({ queryKey: queryKeys.activeDeliveries });
    void queryClient.invalidateQueries({ queryKey: queryKeys.riderStats });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    invalidate();
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
      toast.show(isAvailable ? copy.rider.goOffline : copy.rider.goOnline, { tone: isAvailable ? 'default' : 'success' });
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
      if (msg.includes('already claimed') || msg.includes('unavailable')) toast.show(copy.auth.alreadyClaimed);
      else if (msg.includes('network') || msg.includes('Network')) toast.show('Network error — check your connection.');
      else toast.show('Could not claim order. Try again.');
      invalidate();
    } finally {
      setClaimingId(null);
    }
  };

  const hasError = !!activeError || !!availableError;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background.primary }} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={brand.orange} />}>
      <View style={{ paddingTop: topInset, paddingHorizontal: semanticSpacing.screenPadding, gap: 16 }}>
        <FadeSlideIn delay={60} distance={12}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.surface.primary, borderWidth: 1, borderColor: theme.colors.border.subtle, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6 }}>
                <Bike size={18} color={brand.orange} strokeWidth={2} />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '800', letterSpacing: -0.4, color: theme.colors.text.primary }}>Rider</Text>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isAvailable ? '#22C55E' : theme.colors.text.tertiary, shadowColor: isAvailable ? '#22C55E' : 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 4 }} />
              <Text accessibilityLiveRegion="polite" style={{ fontSize: 12, fontWeight: '700', color: isAvailable ? '#16A34A' : theme.colors.text.tertiary }}>{isAvailable ? copy.rider.available : copy.rider.offline}</Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TactilePressable onPress={() => navigation.navigate('RiderHistory')} haptic="selection" style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.surface.primary, borderWidth: 1, borderColor: theme.colors.border.subtle, alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={16} color={theme.colors.text.secondary} strokeWidth={2} />
              </TactilePressable>
              <TactilePressable onPress={() => navigation.navigate('RiderProfile')} haptic="selection" style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.surface.primary, borderWidth: 1, borderColor: theme.colors.border.subtle, alignItems: 'center', justifyContent: 'center' }}>
                <User size={16} color={theme.colors.text.secondary} strokeWidth={2} />
              </TactilePressable>
            </View>
          </View>
        </FadeSlideIn>

        <FadeSlideIn delay={100} distance={10}>
          <TactilePressable
            onPress={onToggle}
            haptic="commit"
            disabled={toggling}
            style={{
              backgroundColor: isAvailable ? '#EF4444' : theme.colors.text.primary,
              borderRadius: 999,
              paddingVertical: 14,
              alignItems: 'center',
              opacity: toggling ? 0.6 : 1,
              shadowColor: isAvailable ? '#EF4444' : '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12, letterSpacing: 0.3, textTransform: 'uppercase' }}>{isAvailable ? copy.rider.goOffline : copy.rider.goOnline}</Text>
          </TactilePressable>
        </FadeSlideIn>

        <FadeSlideIn delay={140} distance={10}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <StatCard icon={PackageCheck} label={copy.rider.deliveries} value={String(stats?.total_deliveries ?? 0)} index={0} />
            <StatCard icon={Star} label={copy.rider.rating} value={formatNumeric(stats?.average_rating, 1)} index={1} />
            <StatCard icon={ShoppingBag} label={copy.rider.level} value={String(stats?.level ?? 1)} index={2} />
          </View>
        </FadeSlideIn>
      </View>

      {hasError ? (
        <FadeSlideIn delay={180} distance={8}>
          <View style={{ marginHorizontal: semanticSpacing.screenPadding, marginTop: 16, backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#FECACA' }}>
            <Text style={{ color: '#DC2626', fontSize: 11, fontWeight: '600' }}>Connection issue — showing cached data</Text>
          </View>
        </FadeSlideIn>
      ) : null}

      <FadeSlideIn delay={200} distance={10}>
        <View style={{ marginTop: 20 }}>
          <SectionTitle title={copy.rider.activeDeliveries} count={active.length} />
          {active.length === 0 ? (
            <EmptyState icon={Package} title={copy.rider.emptyActive} caption="Orders you've claimed will appear here" />
          ) : (
            <View style={{ paddingHorizontal: semanticSpacing.screenPadding, gap: 10 }}>
              {active.map((o: any, idx: number) => (
                <CrashCascadeIn key={o.id} index={idx}>
                  <TactilePressable onPress={() => navigation.navigate('RiderOrderDetail', { orderId: o.id })} haptic="selection" style={{ backgroundColor: theme.colors.surface.primary, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: theme.colors.border.subtle, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontWeight: '700', color: theme.colors.text.primary, fontSize: 13, letterSpacing: -0.2 }}>Order #{o.id}</Text>
                      <View style={{ backgroundColor: brand.orange + '12', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ fontSize: 10, color: brand.orange, fontWeight: '700', textTransform: 'capitalize' }}>{String(o.status).replace(/_/g, ' ')}</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 11, color: theme.colors.text.secondary, marginTop: 6 }}>{o.store?.name ?? 'Checkstar'} · {formatZar(getOrderTotal(o))}</Text>
                  </TactilePressable>
                </CrashCascadeIn>
              ))}
            </View>
          )}
        </View>
      </FadeSlideIn>

      <FadeSlideIn delay={240} distance={10}>
        <View style={{ marginTop: 24 }}>
          <SectionTitle title={copy.rider.availableOrders} count={available.length} />
          {available.length === 0 ? (
            <EmptyState icon={Inbox} title={copy.rider.emptyAvailable} caption="New orders to claim will appear here" />
          ) : (
            <View style={{ paddingHorizontal: semanticSpacing.screenPadding, gap: 10 }}>
              {available.map((o: any, idx: number) => (
                <CrashCascadeIn key={o.id} index={idx}>
                  <View style={{ backgroundColor: theme.colors.surface.primary, borderRadius: 16, padding: 14, gap: 8, borderWidth: 1, borderColor: theme.colors.border.subtle, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontWeight: '700', color: theme.colors.text.primary, fontSize: 13, letterSpacing: -0.2 }}>Order #{o.id}</Text>
                      <View style={{ backgroundColor: brand.orange + '12', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ fontSize: 10, color: brand.orange, fontWeight: '700', textTransform: 'capitalize' }}>{String(o.status).replace(/_/g, ' ')}</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 11, color: theme.colors.text.secondary }}>{o.store?.name ?? 'Checkstar'} · {formatZar(getOrderTotal(o))}</Text>
                    <TactilePressable onPress={() => onClaim(o.id)} haptic="commit" disabled={claimingId != null} style={{ backgroundColor: theme.colors.text.primary, borderRadius: 999, paddingVertical: 12, alignItems: 'center', marginTop: 4, opacity: claimingId === o.id ? 0.6 : 1 }}>
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 11, letterSpacing: 0.3, textTransform: 'uppercase' }}>{claimingId === o.id ? copy.rider.claiming : copy.rider.claim}</Text>
                    </TactilePressable>
                  </View>
                </CrashCascadeIn>
              ))}
            </View>
          )}
        </View>
      </FadeSlideIn>
    </ScrollView>
  );
}

function StatCard({ icon: Icon, label, value, index }: { icon: any; label: string; value: string; index: number }) {
  const theme = useTheme();
  return (
    <CrashCascadeIn index={index}>
      <View style={{ flex: 1, backgroundColor: theme.colors.surface.primary, borderRadius: 16, padding: 14, gap: 6, borderWidth: 1, borderColor: theme.colors.border.subtle, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4 }}>
        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: theme.colors.surface.elevated, borderWidth: 1, borderColor: theme.colors.border.subtle, alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} color={brand.orange} strokeWidth={2} />
        </View>
        <Text style={{ fontSize: 18, fontWeight: '800', letterSpacing: -0.3, color: theme.colors.text.primary }}>{value}</Text>
        <Text style={{ fontSize: 10, color: theme.colors.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' }}>{label}</Text>
      </View>
    </CrashCascadeIn>
  );
}

function SectionTitle({ title, count }: { title: string; count?: number }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: semanticSpacing.screenPadding, marginBottom: 12 }}>
      <Text style={{ fontSize: 14, fontWeight: '700', letterSpacing: -0.2, color: theme.colors.text.primary }}>{title}</Text>
      {count != null && count > 0 ? (
        <View style={{ backgroundColor: brand.orange + '15', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: brand.orange }}>{count}</Text>
        </View>
      ) : null}
    </View>
  );
}
