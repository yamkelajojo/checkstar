import { View, Text, ScrollView, Alert } from 'react-native';
import { Bike, Star, PackageCheck, ShoppingBag, LogOut, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { typeScale, weights } from '../../theme/typography';
import { useQuery } from '@tanstack/react-query';
import { fetchRiderProfile } from '../../lib/apiClient';
import { queryKeys } from '../../lib/queryKeys';
import { TactilePressable } from '../../components/shared/TactilePressable';
import { SkeletonCard } from '../../components/shared/SkeletonCard';
import { useSession } from '../../stores/session';
import { copy } from '../../lib/strings';
import { useTopSafeArea } from '../../components/shared/ScreenHeader';

export function RiderProfileScreen() {
  const theme = useTheme();
  const topInset = useTopSafeArea();
  const signOut = useSession((s) => s.signOut);

  const { data: profile, isLoading } = useQuery({
    queryKey: queryKeys.riderProfile,
    queryFn: fetchRiderProfile,
  });

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  if (isLoading || !profile) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg, padding: 16, paddingTop: 72 }}>
        <SkeletonCard height={300} width={undefined} />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.bg }} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={{ paddingTop: topInset, paddingHorizontal: 16, gap: 16 }}>
        <Text style={{ fontSize: typeScale.title, fontWeight: weights.extrabold, color: theme.colors.text.primary }}>
          Profile
        </Text>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <StatCard icon={PackageCheck} label={copy.rider.deliveries} value={String(profile.total_deliveries ?? 0)} />
          <StatCard icon={Star} label={copy.rider.rating} value={profile.average_rating != null ? profile.average_rating.toFixed(1) : '—'} />
          <StatCard icon={ShoppingBag} label={copy.rider.level} value={String(profile.level ?? 1)} />
        </View>

        {/* Details */}
        <View style={{ backgroundColor: theme.colors.surface.primary, borderRadius: 16, padding: 16, gap: 12 }}>
          <InfoRow label="Vehicle" value={profile.vehicle_type ?? 'Not set'} />
          <InfoRow label="License Plate" value={profile.license_plate ?? 'Not set'} />
          <InfoRow label="Store" value={profile.store?.name ?? '—'} />
          <InfoRow label="Max Radius" value={`${profile.max_radius_km ?? 10} km`} />
          <InfoRow label="XP" value={String(profile.xp ?? 0)} />
        </View>

        {/* Sign Out */}
        <TactilePressable
          onPress={handleSignOut}
          haptic="commit"
          accessibilityRole="button"
          style={{ backgroundColor: theme.colors.surface.primary, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <LogOut size={20} color={theme.colors.status.error.primary} />
            <Text style={{ color: theme.colors.status.error.primary, fontWeight: weights.semibold }}>Sign Out</Text>
          </View>
          <ChevronRight size={16} color={theme.colors.text.tertiary} />
        </TactilePressable>
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

function InfoRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ color: theme.colors.text.secondary }}>{label}</Text>
      <Text style={{ color: theme.colors.text.primary, fontWeight: weights.semibold }}>{value}</Text>
    </View>
  );
}
