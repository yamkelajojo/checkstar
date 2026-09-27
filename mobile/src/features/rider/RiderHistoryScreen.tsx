import { View, Text, FlatList, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Package, Star, MapPin } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { typeScale, weights } from '../../theme/typography';
import { semanticSpacing } from '../../theme/spacing';
import { fetchRiderHistory } from '../../lib/apiClient';
import { queryKeys } from '../../lib/queryKeys';
import { formatZar } from '../../lib/currency';
import { formatDate } from '../../lib/formatters';
import { getOrderTotal } from '../../lib/orderTotal';
import { TactilePressable } from '../../components/shared/TactilePressable';
import { EmptyState } from '../../components/shared/EmptyState';
import type { ApiOrder } from '../../lib/types';
import type { RootStackParamList } from '../../navigation/types';
import { useTopSafeArea } from '../../components/shared/ScreenHeader';

export function RiderHistoryScreen() {
  const theme = useTheme();
  const topInset = useTopSafeArea();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [refreshing, setRefreshing] = useState(false);

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: queryKeys.riderHistory,
    queryFn: fetchRiderHistory,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const renderOrder = ({ item }: { item: ApiOrder }) => {
    const total = getOrderTotal(item);
    const itemCount = item.items?.length ?? 0;

    return (
      <TactilePressable
        variant="card"
        haptic="selection"
        onPress={() => navigation.navigate('RiderOrderDetail', { orderId: item.id })}
        accessibilityRole="button"
        style={{ backgroundColor: theme.colors.surface.primary, borderRadius: 16 }}
      >
        <View style={{ padding: 14, gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontWeight: weights.bold, color: theme.colors.text.primary }}>
              Order #{item.order_number ?? item.id}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Package size={12} color={theme.colors.status.success.primary} />
              <Text style={{ fontSize: typeScale.caption, color: theme.colors.status.success.primary, fontWeight: weights.semibold }}>
                Delivered
              </Text>
            </View>
          </View>

          <Text style={{ fontSize: typeScale.caption, color: theme.colors.text.secondary }}>
            {formatDate(item.created_at)} · {item.store?.name ?? 'Checkstar'}
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: typeScale.caption, color: theme.colors.text.tertiary }}>
              {itemCount} item{itemCount !== 1 ? 's' : ''}
            </Text>
            <Text style={{ fontWeight: weights.bold, color: theme.colors.text.primary }}>
              {formatZar(total)}
            </Text>
          </View>

          {item.rider_rating != null && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Star size={12} color={theme.colors.status.star.primary} />
              <Text style={{ fontSize: typeScale.caption, color: theme.colors.text.secondary }}>
                {item.rider_rating.toFixed(1)} rating
              </Text>
            </View>
          )}
        </View>
      </TactilePressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      {/* Header */}
      <View style={{ paddingTop: topInset, paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TactilePressable
          onPress={() => navigation.goBack()}
          haptic="selection"
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.surface.primary, alignItems: 'center', justifyContent: 'center' }}
        >
          <ArrowLeft size={18} color={theme.colors.text.secondary} />
        </TactilePressable>
        <Text style={{ fontSize: typeScale.title, fontWeight: weights.bold, color: theme.colors.text.primary }}>
          Delivery History
        </Text>
      </View>

      {/* List */}
      <FlatList
        data={orders}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.action.primary.background} />}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon={Package}
              title="No deliveries yet"
              caption="Completed deliveries will appear here."
            />
          ) : null
        }
        renderItem={renderOrder}
      />
    </View>
  );
}
