import { View, Text, FlatList } from 'react-native';
import { LogOut, Package } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { typeScale, weights } from '../../theme/typography';
import { useSession } from '../../stores/session';
import { useQuery } from '@tanstack/react-query';
import { fetchOrders } from '../../lib/apiClient';
import { queryKeys } from '../../lib/queryKeys';
import { formatZar } from '../../lib/currency';
import { TactilePressable } from '../../components/shared/TactilePressable';
import { EmptyState } from '../../components/shared/EmptyState';
import { Logo } from '../../components/shared/Logo';
import { copy } from '../../lib/strings';
import { useToast } from '../../components/shared/GlassToast';
import type { RootStackParamList } from '../../navigation/types';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function AccountScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useSession((s) => s.user);
  const status = useSession((s) => s.status);
  const signOut = useSession((s) => s.signOut);
  const toast = useToast();

  const { data: orders = [] } = useQuery({
    queryKey: queryKeys.orders,
    queryFn: fetchOrders,
    enabled: status === 'authenticated',
  });

  const name = user?.name ?? 'Guest';

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View style={{ paddingTop: 56, paddingHorizontal: 16, gap: 12 }}>
        <Logo variant="lockup" size={26} tone={theme.name === 'dark' ? 'light' : 'dark'} />
        <Text style={{ fontSize: typeScale.heading, fontWeight: weights.bold, color: theme.colors.text }}>
          {name}
        </Text>
        {status === 'authenticated' ? (
          <TactilePressable
            onPress={async () => {
              await signOut();
              toast.show('Signed out');
            }}
            hapticOnPress="tap"
            accessibilityRole="button"
            style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6 }}
          >
            <LogOut size={16} color={theme.colors.textMuted} />
            <Text style={{ color: theme.colors.textMuted }}>Sign out</Text>
          </TactilePressable>
        ) : (
          <TactilePressable
            onPress={() => navigation.navigate('Auth')}
            hapticOnPress="commit"
            style={{ backgroundColor: brand.primary, borderRadius: 999, paddingHorizontal: 20, alignSelf: 'flex-start' }}
          >
            <Text style={{ color: '#fff', fontWeight: weights.bold }}>Sign in</Text>
          </TactilePressable>
        )}
      </View>

      <Text style={{ marginTop: 24, paddingHorizontal: 16, fontSize: typeScale.heading, fontWeight: weights.bold, color: theme.colors.text }}>
        Orders
      </Text>
      {status !== 'authenticated' ? (
        <EmptyState
          icon={Package}
          title="Sign in to see your orders"
          caption="Your order history lives in your account."
        />
      ) : orders.length === 0 ? (
        <EmptyState icon={Package} title={copy.orders.emptyTitle} caption={copy.orders.emptyBody} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => String(o.id)}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <TactilePressable
              onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
              hapticOnPress="selection"
              style={{ backgroundColor: theme.colors.surface, borderRadius: 16, padding: 14 }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontWeight: weights.bold, color: theme.colors.text }}>
                  Order #{item.id}
                </Text>
                <Text style={{ fontSize: typeScale.caption, color: theme.colors.textMuted }}>
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                <Text style={{ fontSize: typeScale.caption, color: brand.primary, fontWeight: weights.semibold }}>
                  {STATUS_LABEL[item.status] ?? item.status}
                </Text>
                <Text style={{ fontWeight: weights.bold, color: theme.colors.text }}>
                  {formatZar(item.total_cents ?? 0)}
                </Text>
              </View>
            </TactilePressable>
          )}
        />
      )}
    </View>
  );
}