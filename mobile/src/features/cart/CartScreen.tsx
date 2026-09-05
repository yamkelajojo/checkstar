import { View, Text, FlatList, Pressable } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ShoppingCart, ArrowRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { textStyle, fontWeight } from '../../theme/typography';
import { semanticSpacing, semanticRadius } from '../../theme/spacing';
import { useCart } from './store';
import { cartRules } from './model';
import { useAllProducts } from '../catalog/hooks';
import { Stepper } from '../../components/shared/Stepper';
import { FadeSlideIn } from '../../components/shared/FadeSlideIn';
import { EmptyState } from '../../components/shared/EmptyState';
import { formatZar } from '../../lib/currency';
import { TactilePressable } from '../../components/shared/TactilePressable';
import { copy } from '../../lib/strings';
import { MIN_ORDER_CENTS } from '../../lib/constants';
import { ScreenHeader } from '../../components/shared/ScreenHeader';
import { trackAddToCart, trackRemoveFromCart } from '../../services/trackingService';
import type { RootStackParamList } from '../../navigation/types';

export function CartScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const items = useCart((s) => s.items);
  // Fetch ALL products across ALL stores to match cart items
  const { data: products = [], isLoading } = useAllProducts({ storeId: undefined });

  const priceOf = (id: string) => products.find((p) => p.id === Number(id))?.effectivePriceCents ?? 0;
  const subtotal = cartRules.subtotalCents(items, priceOf);
  const quantity = cartRules.totalQuantity(items);
  const canCheckout = subtotal >= MIN_ORDER_CENTS && items.length > 0;

  if (items.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
        <ScreenHeader title="Cart" />
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
      <ScreenHeader title="Cart" />
      {isLoading ? (
        <View style={{ paddingHorizontal: semanticSpacing.screenPadding, gap: semanticSpacing.inlineGap }}>
          <CartSkeletonRow />
          <CartSkeletonRow />
          <CartSkeletonRow />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.productId}
          contentContainerStyle={{ padding: semanticSpacing.screenPadding, gap: semanticSpacing.inlineGap, paddingBottom: 120 }}
          ListHeaderComponent={
            <Text style={{ ...textStyle.caption, color: theme.colors.text.secondary }}>{copy.cart.trustNote}</Text>
          }
          renderItem={({ item, index }) => {
            const product = products.find((p) => p.id === Number(item.productId));
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
                    opacity: product ? 1 : 0.5,
                  }}
                >
                  <View style={{ width: 56, height: 56, borderRadius: semanticRadius.imageFrame, backgroundColor: theme.colors.surface.elevated, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {product?.images && product.images[0] ? (
                      <Image source={{ uri: product.images[0] }} style={{ width: 48, height: 48 }} resizeMode="contain" cachePolicy="memory-disk" />
                    ) : (
                      <Text style={{ fontSize: 24 }}>🛒</Text>
                    )}
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text numberOfLines={2} style={{ fontWeight: fontWeight.semibold, color: theme.colors.text.primary }}>
                      {product?.name ?? `Product #${item.productId}`}
                    </Text>
                    <Text style={{ ...textStyle.caption, color: product ? theme.colors.text.secondary : brand.error }}>
                      {product ? `${formatZar(product.effectivePriceCents)} each` : 'Unavailable — will be removed at checkout'}
                    </Text>
                  </View>
                  {product ? (
                    <>
                      <Text style={{ fontWeight: fontWeight.bold, color: theme.colors.text.primary }}>
                        {formatZar(priceOf(item.productId) * item.quantity)}
                      </Text>
                      <Stepper
                        quantity={item.quantity}
                        onIncrement={() => { useCart.getState().add(item.productId, 1); trackAddToCart(Number(item.productId), item.quantity + 1); }}
                        onDecrement={() => { useCart.getState().decrement(item.productId); trackRemoveFromCart(Number(item.productId)); }}
                      />
                    </>
                  ) : (
                    <TactilePressable
                      onPress={() => { useCart.getState().remove(item.productId); trackRemoveFromCart(Number(item.productId)); }}
                      haptic="selection"
                      accessibilityRole="button"
                      accessibilityLabel={`Remove unavailable item ${item.productId}`}
                    >
                      <Text style={{ color: brand.error, ...textStyle.caption, fontWeight: fontWeight.semibold }}>Remove</Text>
                    </TactilePressable>
                  )}
                </View>
              </FadeSlideIn>
            );
          }}
        />
      )}
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
            <Text style={{ color: canCheckout ? theme.colors.action.primary.foreground : theme.colors.text.secondary, fontWeight: fontWeight.bold, textTransform: 'uppercase', ...textStyle.caption }}>
              {copy.cart.checkOut}
            </Text>
            <ArrowRight size={18} color={canCheckout ? theme.colors.action.primary.foreground : theme.colors.text.secondary} />
          </View>
        </TactilePressable>
      </View>
    </View>
  );
}

function CartSkeletonRow() {
  const theme = useTheme();
  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: semanticSpacing.inlineGap,
        backgroundColor: theme.colors.surface.primary,
        borderRadius: semanticRadius.card,
        padding: semanticSpacing.md,
      }}
    >
      <View style={{ width: 56, height: 56, borderRadius: semanticRadius.imageFrame, backgroundColor: theme.colors.surface.elevated }} />
      <View style={{ flex: 1, gap: 6 }}>
        <View style={{ height: 12, borderRadius: 6, backgroundColor: theme.colors.border.subtle, width: '80%' }} />
        <View style={{ height: 12, borderRadius: 6, backgroundColor: theme.colors.border.subtle, width: '45%' }} />
      </View>
      <View style={{ height: 24, width: 48, borderRadius: 6, backgroundColor: theme.colors.border.subtle }} />
      <View style={{ height: 28, width: 84, borderRadius: semanticRadius.buttonPill, backgroundColor: theme.colors.border.subtle }} />
    </Animated.View>
  );
}