import { View, Text, FlatList, Pressable } from 'react-native';
import { ShoppingCart, ArrowRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { typeScale, weights } from '../../theme/typography';
import { useCart } from './store';
import { cartRules } from './model';
import { useProducts } from '../catalog/hooks';
import { useDeliveryStore } from '../../stores/deliveryStore';
import { Stepper } from '../../components/shared/Stepper';
import { FadeSlideIn } from '../../components/shared/FadeSlideIn';
import { EmptyState } from '../../components/shared/EmptyState';
import { formatZar } from '../../lib/currency';
import { TactilePressable } from '../../components/shared/TactilePressable';
import { copy } from '../../lib/strings';
import type { RootStackParamList } from '../../navigation/types';

const MIN_ORDER_CENTS = 5000;

export function CartScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const store = useDeliveryStore((s) => s.store);
  const items = useCart((s) => s.items);
  const { data: products = [] } = useProducts({ storeId: store?.id ?? null });

  const priceOf = (id: string) => products.find((p) => p.id === Number(id))?.effectivePriceCents ?? 0;
  const subtotal = cartRules.subtotalCents(items, priceOf);
  const quantity = cartRules.totalQuantity(items);
  const canCheckout = subtotal >= MIN_ORDER_CENTS && items.length > 0;

  if (items.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <Header title="Cart" />
        <EmptyState
          icon={ShoppingCart}
          title={copy.cart.emptyTitle}
          caption={copy.cart.emptyCaption}
          action={
            <TactilePressable
              onPress={() => navigation.navigate('Tabs', { screen: 'Browse' })}
              hapticOnPress="tap"
              style={{ backgroundColor: brand.primary, borderRadius: 999, paddingHorizontal: 24, marginTop: 12 }}
            >
              <Text style={{ color: '#fff', fontWeight: weights.bold, textTransform: 'uppercase', fontSize: typeScale.caption }}>
                {copy.cart.browseSpecials}
              </Text>
            </TactilePressable>
          }
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <Header title="Cart" />
      <FlatList
        data={items}
        keyExtractor={(i) => i.productId}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListHeaderComponent={
          <Text style={{ fontSize: typeScale.caption, color: theme.colors.textMuted }}>{copy.cart.trustNote}</Text>
        }
        renderItem={({ item, index }) => {
          const product = products.find((p) => p.id === Number(item.productId));
          if (!product) return null;
          return (
            <FadeSlideIn delay={index * 60}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  backgroundColor: theme.colors.surface,
                  borderRadius: 16,
                  padding: 12,
                }}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text numberOfLines={2} style={{ fontWeight: weights.semibold, color: theme.colors.text }}>
                    {product.name}
                  </Text>
                  <Text style={{ fontSize: typeScale.caption, color: theme.colors.textMuted }}>
                    {formatZar(product.effectivePriceCents)} each
                  </Text>
                </View>
                <Text style={{ fontWeight: weights.bold, color: theme.colors.text }}>
                  {formatZar(priceOf(item.productId) * item.quantity)}
                </Text>
                <Stepper
                  quantity={item.quantity}
                  onIncrement={() => useCart.getState().add(item.productId, 1, item.storeProductId)}
                  onDecrement={() => useCart.getState().decrement(item.productId)}
                />
              </View>
            </FadeSlideIn>
          );
        }}
      />
      {/* Sticky totals bar */}
      <View style={{ borderTopWidth: 1, borderTopColor: theme.colors.hairline, padding: 16, gap: 8, backgroundColor: theme.colors.bg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: theme.colors.textMuted }}>Subtotal ({quantity} items)</Text>
          <Text style={{ fontWeight: weights.bold, color: theme.colors.text }}>{formatZar(subtotal)}</Text>
        </View>
        {subtotal < MIN_ORDER_CENTS && (
          <Text style={{ color: brand.accent, fontSize: typeScale.caption }}>
            {copy.cart.minOrder.replace('{minCents}', formatZar(MIN_ORDER_CENTS))}
          </Text>
        )}
        <TactilePressable
          onPress={() => navigation.navigate('Checkout')}
          hapticOnPress="commit"
          disabled={!canCheckout}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canCheckout }}
          style={{
            backgroundColor: canCheckout ? brand.primary : theme.colors.surface,
            borderRadius: 999,
            opacity: canCheckout ? 1 : 0.6,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Text style={{ color: canCheckout ? '#fff' : theme.colors.textMuted, fontWeight: weights.bold, textTransform: 'uppercase', letterSpacing: 1 }}>
              {copy.cart.checkOut}
            </Text>
            <ArrowRight size={18} color={canCheckout ? '#fff' : theme.colors.textMuted} />
          </View>
        </TactilePressable>
      </View>
    </View>
  );
}

function Header({ title }: { title: string }) {
  const theme = useTheme();
  return (
    <Text style={{ paddingTop: 56, paddingHorizontal: 16, fontSize: typeScale.title, fontWeight: weights.extrabold, color: theme.colors.text }}>
      {title}
    </Text>
  );
}