import { View, Text, FlatList, ScrollView, RefreshControl } from 'react-native';
import { Bike, Star, PackageCheck, ShoppingBag } from 'lucide-react-native';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
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

const POLL_MS = 15_000;

export function RiderHomeScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const toast = useToast();
  const user = useSession((s) => s.user);
  const isAvailable = user?.rider?.is_available ?? false;
  const [toggling, setToggling] = useState(false);

  const { data: stats } = useQuery({
    queryKey: queryKeys.riderStats,
    queryFn: fetchRiderStats,
  });
  const { data: active = [] } = useQuery({
    queryKey: queryKeys.activeDeliveries,
    queryFn: fetchActiveDeliveries,
    refetchInterval: POLL_MS,
  });
  const { data: available = [] } = useQuery({
    queryKey: queryKeys.availableOrders,
    queryFn: fetchAvailableOrders,
    refetchInterval: isAvailable ? POLL_MS : false,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.availableOrders });
    void queryClient.invalidateQueries({ queryKey: queryKeys.activeDeliveries });
    void queryClient.invalidateQueries({ queryKey: queryKeys.riderStats });
  };

  const onToggle = async () => {
    setToggling(true);
    try {
      await toggleAvailability();
      toast.show(isAvailable ? copy.rider.goOffline : copy.rider.goOnline, { tone: isAvailable ? 'default' : 'success' });
      invalidate();
    } catch {
      toast.show('Could not update availability.');
    } finally {
      setToggling(false);
    }
  };

  const onClaim = async (orderId: number) => {
    try {
      await claimOrder(orderId);
      invalidate();
      navigation.navigate('RiderOrderDetail', { orderId });
    } catch {
      toast.show(copy.auth.alreadyClaimed);
      invalidate();
    }
  };

  const statusBadge = (status: string) => (
    <Text style={{ fontSize: typeScale.caption, color: brand.primary, fontWeight: weights.semibold, textTransform: 'capitalize' }}>
      {status.replace(/_/g, ' ')}
    </Text>
  );

  const orderCard = (order: { id: number; status: string; total_cents: number | null; store?: { name?: string } | null; created_at: string }) => (
    <TactilePressable
      key={order.id}
      variant="card"
      hapticOnPress="selection"
      onPress={() => navigation.navigate('RiderOrderDetail', { orderId: order.id })}
      accessibilityRole="button"
      style={{ backgroundColor: theme.colors.surface, borderRadius: 16 }}
    >
      <View style={{ padding: 14, gap: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontWeight: weights.bold, color: theme.colors.text }}>Order #{order.id}</Text>
          {statusBadge(order.status)}
        </View>
        <Text style={{ fontSize: typeScale.caption, color: theme.colors.textMuted }}>
          {order.store?.name ?? 'Checkstar'} · {formatZar(order.total_cents ?? 0)}
        </Text>
      </View>
    </TactilePressable>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={false} onRefresh={invalidate} tintColor={brand.primary} />}
    >
      <View style={{ paddingTop: 56, paddingHorizontal: 16, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center' }}>
              <Bike size={20} color={brand.primary} />
            </View>
            <Text style={{ fontSize: typeScale.title, fontWeight: weights.extrabold, color: theme.colors.text }}>
              Rider
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: isAvailable ? brand.success : theme.colors.textFaint }} />
            <Text style={{ color: theme.colors.textMuted, fontWeight: weights.semibold }}>
              {isAvailable ? copy.rider.available : copy.rider.offline}
            </Text>
          </View>
        </View>

        <TactilePressable
          onPress={onToggle}
          hapticOnPress="commit"
          disabled={toggling}
          accessibilityRole="button"
          accessibilityState={{ checked: isAvailable }}
          style={{ backgroundColor: isAvailable ? brand.accent : brand.primary, borderRadius: 999, opacity: toggling ? 0.6 : 1 }}
        >
          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: weights.bold, textTransform: 'uppercase', letterSpacing: letterSpacing.wide }}>
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

      <View style={{ marginTop: 20 }}>
        <SectionTitle title={copy.rider.activeDeliveries} />
        {active.length === 0 ? (
          <Text style={{ color: theme.colors.textMuted, paddingHorizontal: 16 }}>{copy.rider.emptyActive}</Text>
        ) : (
          <View style={{ paddingHorizontal: 16, gap: 12 }}>
            {active.map((o) => orderCard(o))}
          </View>
        )}
      </View>

      <View style={{ marginTop: 20 }}>
        <SectionTitle title={copy.rider.availableOrders} />
        {available.length === 0 ? (
          <Text style={{ color: theme.colors.textMuted, paddingHorizontal: 16 }}>{copy.rider.emptyAvailable}</Text>
        ) : (
          <View style={{ paddingHorizontal: 16, gap: 12 }}>
            {available.map((o) => (
              <View key={o.id} style={{ backgroundColor: theme.colors.surface, borderRadius: 16, padding: 14, gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontWeight: weights.bold, color: theme.colors.text }}>Order #{o.id}</Text>
                  {statusBadge(o.status)}
                </View>
                <Text style={{ fontSize: typeScale.caption, color: theme.colors.textMuted }}>
                  {o.store?.name ?? 'Checkstar'} · {formatZar(o.total_cents ?? 0)}
                </Text>
                <TactilePressable
                  onPress={() => onClaim(o.id)}
                  hapticOnPress="commit"
                  accessibilityRole="button"
                  style={{ backgroundColor: brand.primary, borderRadius: 999, marginTop: 4 }}
                >
                  <Text style={{ color: '#fff', textAlign: 'center', fontWeight: weights.bold, textTransform: 'uppercase', letterSpacing: letterSpacing.wide, fontSize: typeScale.caption }}>
                    {copy.rider.claim}
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
    <View style={{ flex: 1, backgroundColor: theme.colors.surface, borderRadius: 16, padding: 14, gap: 6 }}>
      <Icon size={18} color={brand.primary} />
      <Text style={{ fontSize: typeScale.title, fontWeight: weights.extrabold, color: theme.colors.text }}>{value}</Text>
      <Text style={{ fontSize: typeScale.caption, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  const theme = useTheme();
  return (
    <Text style={{ fontSize: typeScale.heading, fontWeight: weights.bold, color: theme.colors.text, paddingHorizontal: 16, marginBottom: 12 }}>
      {title}
    </Text>
  );
}
