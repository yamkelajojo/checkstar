import { View, Text, ScrollView, Alert } from 'react-native';
import { Star, PackageCheck, ShoppingBag, LogOut, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { textStyle, fontWeight } from '../../theme/typography';
import { semanticSpacing, semanticRadius } from '../../theme/spacing';
import { useQuery } from '@tanstack/react-query';
import { fetchRiderProfile } from '../../lib/apiClient';
import { queryKeys } from '../../lib/queryKeys';
import { TactilePressable } from '../../components/shared/TactilePressable';
import { SkeletonCard } from '../../components/shared/SkeletonCard';
import { FadeSlideIn } from '../../components/shared/FadeSlideIn';
import { CrashCascadeIn } from '../../components/shared/CrashCascadeIn';
import { useSession } from '../../stores/session';
import { copy } from '../../lib/strings';
import { useTopSafeArea } from '../../components/shared/ScreenHeader';
import { brand } from '../../theme/colors';

export function RiderProfileScreen() {
  const theme = useTheme();
  const topInset = useTopSafeArea();
  const signOut = useSession((s) => s.signOut);
  const { data: profile, isLoading } = useQuery({ queryKey: queryKeys.riderProfile, queryFn: fetchRiderProfile });

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign Out', style: 'destructive', onPress: () => signOut() }]);
  };

  if (isLoading || !profile) {
    return <View style={{ flex: 1, backgroundColor: theme.colors.background.primary, padding: 16, paddingTop: 72 }}><SkeletonCard height={300} width={undefined} /></View>;
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background.primary }} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <View style={{ paddingTop: topInset, paddingHorizontal: semanticSpacing.screenPadding, gap: 16 }}>
        <FadeSlideIn delay={60} distance={12}>
          <Text style={{ fontSize: 20, fontWeight: '800', letterSpacing: -0.4, color: theme.colors.text.primary }}>Profile</Text>
        </FadeSlideIn>

        <FadeSlideIn delay={100} distance={10}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <StatCard icon={PackageCheck} label={copy.rider.deliveries} value={String(profile.total_deliveries ?? 0)} index={0} />
            <StatCard icon={Star} label={copy.rider.rating} value={profile.average_rating != null ? profile.average_rating.toFixed(1) : '—'} index={1} />
            <StatCard icon={ShoppingBag} label={copy.rider.level} value={String(profile.level ?? 1)} index={2} />
          </View>
        </FadeSlideIn>

        <FadeSlideIn delay={160} distance={10}>
          <View style={{ backgroundColor: theme.colors.surface.primary, borderRadius: semanticRadius.card, padding: 14, gap: 12, borderWidth: 1, borderColor: theme.colors.border.subtle, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4 }}>
            <InfoRow label="Vehicle" value={profile.vehicle_type ?? 'Not set'} />
            <InfoRow label="License Plate" value={profile.license_plate ?? 'Not set'} />
            <InfoRow label="Store" value={profile.store?.name ?? '—'} />
            <InfoRow label="Max Radius" value={`${profile.max_radius_km ?? 10} km`} />
            <InfoRow label="XP" value={String(profile.xp ?? 0)} />
          </View>
        </FadeSlideIn>

        <FadeSlideIn delay={200} distance={8}>
          <TactilePressable onPress={handleSignOut} haptic="warning" style={{ backgroundColor: theme.colors.surface.primary, borderRadius: semanticRadius.card, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: theme.colors.border.subtle }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', alignItems: 'center', justifyContent: 'center' }}>
                <LogOut size={14} color="#DC2626" strokeWidth={2} />
              </View>
              <Text style={{ color: '#DC2626', fontWeight: '600', fontSize: 13 }}>Sign Out</Text>
            </View>
            <ChevronRight size={14} color={theme.colors.text.tertiary} />
          </TactilePressable>
        </FadeSlideIn>
      </View>
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

function InfoRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text style={{ color: theme.colors.text.secondary, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: theme.colors.text.primary, fontWeight: '600', fontSize: 12 }}>{value}</Text>
    </View>
  );
}
