import { View, Text, FlatList, Pressable } from 'react-native';
import { ShoppingCart, ArrowRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { textStyle, fontWeight } from '../../theme/typography';
import { semanticSpacing, semanticRadius } from '../../theme/spacing';
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
      <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
        <Header title="Cart" />
        <EmptyState
          icon={ShoppingCart}
          title={copy.cart.emptyTitle}
          caption={copy.cart.emptyCaption}
          action={
            <TactilePressable
              onPress={() => navigation.navigate('Tabs', { screen: 'Browse' })}
              haptic="tap"
              style={{ backgroundColor: brand.orange, borderRadius: semanticRadius.buttonPill, paddingHorizontal: 24, marginTop: semanticSpacing.sm }}
            >
              <Text style={{ color: theme.colors.text.inverse, fontWeight: fontWeight.bold, textTransform: 'uppercase', ...textStyle.caption }}>
                {copy.cart.browseSpecials}
              </Text>
            </TactilePressable>
          }
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      <Header title="Cart" />
      <FlatList
        data={items}
        keyExtractor={(i) => i.productId}
        contentContainerStyle={{ padding: semanticSpacing.screenPadding, gap: semanticSpacing.inlineGap }}
        ListHeaderComponent={
          <Text style={{ ...textStyle.caption, color: theme.colors.text.secondary }}>{copy.cart.trustNote}</Text>
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
                  gap: semanticSpacing.inlineGap,
                  backgroundColor: theme.colors.surface.primary,
                  borderRadius: semanticRadius.card,
                  padding: semanticSpacing.md,
                }}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text numberOfLines={2} style={{ fontWeight: fontWeight.semibold, color: theme.colors.text.primary }}>
                    {product.name}
                  </Text>
                  <Text style={{ ...textStyle.caption, color: theme.colors.text.secondary }}>
                    {formatZar(product.effectivePriceCents)} each
                  </Text>
                </View>
                <Text style={{ fontWeight: fontWeight.bold, color: theme.colors.text.primary }}>
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
      <View style={{ borderTopWidth: 1, borderTopColor: theme.colors.border.subtle, padding: semanticSpacing.screenPadding, gap: semanticSpacing.xs, backgroundColor: theme.colors.background.primary }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: theme.colors.text.secondary }}>Subtotal ({quantity} items)</Text>
          <Text style={{ fontWeight: fontWeight.bold, color: theme.colors.text.primary }}>{formatZar(subtotal)}</Text>
        </View>
        {subtotal < MIN_ORDER_CENTS && (
          <Text style={{ color: brand.error, ...textStyle.caption }}>
            {copy.cart.minOrder.replace('{minCents}', formatZar(MIN_ORDER_CENTS))}
          </Text>
        )}
        <TactilePressable
          onPress={() => navigation.navigate('Checkout')}
          haptic="commit"
          disabled={!canCheckout}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canCheckout }}
          style={{
            backgroundColor: canCheckout ? theme.colors.action.primary.background : theme.colors.surface.primary,
            borderRadius: semanticRadius.buttonPill,
            opacity: canCheckout ? 1 : 0.6,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Text style={{ color: canCheckout ? theme.colors.action.primary.foreground : theme.colors.text.secondary, fontWeight: fontWeight.bold, textTransform: 'uppercase', letterSpacing: 1, ...textStyle.caption }}>
              {copy.cart.checkOut}
            </Text>
            <ArrowRight size={18} color={canCheckout ? theme.colors.action.primary.foreground : theme.colors.text.secondary} />
          </View>
        </TactilePressable>
      </View>
    </View>
  );
}

function Header({ title }: { title: string }) {
  const theme = useTheme();
  return (
    <Text style={{ paddingTop: 56, paddingHorizontal: semanticSpacing.screenPadding, ...textStyle.h1, color: theme.colors.text.primary }}>
      {title}
    </Text>
  );
}