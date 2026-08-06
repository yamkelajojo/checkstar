import { View, Text } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { typeScale, weights, letterSpacing } from '../../theme/typography';
import { useQuery } from '@tanstack/react-query';
import { fetchOrder } from '../../lib/apiClient';
import { queryKeys } from '../../lib/queryKeys';
import { formatZar } from '../../lib/currency';
import { TactilePressable } from '../../components/shared/TactilePressable';
import { copy } from '../../lib/strings';
import { FadeSlideIn } from '../../components/shared/FadeSlideIn';
import type { RootStackParamList } from '../../navigation/types';

export function OrderPlacedScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { orderId } = route.params as { orderId: number };
  const { data: order } = useQuery({
    queryKey: queryKeys.order(orderId),
    queryFn: () => fetchOrder(orderId),
  });

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 }}>
      <FadeSlideIn distance={20}>
        <View style={{ alignItems: 'center', gap: 16 }}>
          <CheckCircle2 size={72} color={brand.success} strokeWidth={1.5} />
          <Text style={{ fontSize: typeScale.title, fontWeight: weights.extrabold, color: theme.colors.text }}>
            {copy.orders.placedTitle}
          </Text>
          <Text style={{ fontSize: typeScale.body, color: theme.colors.textMuted, textAlign: 'center', lineHeight: 22 }}>
            {copy.orders.placedBody.replace('{store}', order?.store?.name ?? 'the store')}
          </Text>
          {order != null && (
            <View style={{ backgroundColor: theme.colors.surface, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 24, alignItems: 'center', gap: 2 }}>
              <Text style={{ fontSize: typeScale.caption, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: letterSpacing.wide }}>
                Order #{order.id}
              </Text>
              <Text style={{ fontSize: typeScale.price, fontWeight: weights.black, color: theme.colors.text }}>
                {formatZar(order.total_cents ?? 0)}
              </Text>
            </View>
          )}
        </View>
      </FadeSlideIn>

      <View style={{ alignSelf: 'stretch', gap: 12 }}>
        <TactilePressable
          onPress={() => navigation.replace('OrderDetail', { orderId })}
          hapticOnPress="commit"
          accessibilityRole="button"
          style={{ backgroundColor: brand.primary, borderRadius: 999 }}
        >
          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: weights.bold, textTransform: 'uppercase', letterSpacing: letterSpacing.wide }}>
            {copy.orders.trackOrder}
          </Text>
        </TactilePressable>
        <TactilePressable
          onPress={() => navigation.navigate('Tabs')}
          hapticOnPress="selection"
          accessibilityRole="button"
        >
          <Text style={{ textAlign: 'center', color: theme.colors.textMuted, fontWeight: weights.semibold }}>
            {copy.orders.done}
          </Text>
        </TactilePressable>
      </View>
    </View>
  );
}
