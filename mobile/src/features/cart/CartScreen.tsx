import { View, Text, FlatList, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { ShoppingCart, ArrowRight, Trash2 } from 'lucide-react-native';
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
import { CrashCascadeIn } from '../../components/shared/CrashCascadeIn';
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
  const { data: products = [], isLoading } = useAllProducts({ storeId: undefined });

  const priceOf = (id: string) => products.find((p) => p.id === Number(id))?.effectivePriceCents ?? 0;
  const subtotal = cartRules.subtotalCents(items, priceOf);
  const quantity = cartRules.totalQuantity(items);
  const canCheckout = subtotal >= MIN_ORDER_CENTS && items.length > 0;

  if (items.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
        <ScreenHeader title="Cart" />
        <FadeSlideIn delay={100} distance={12}>
          <EmptyState
            icon={ShoppingCart}
            title={copy.cart.emptyTitle}
            caption={copy.cart.emptyCaption}
            action={
              <TactilePressable
                onPress={() => navigation.navigate('Tabs', { screen: 'Browse' } as any)}
                haptic="tap"
                style={{
                  backgroundColor: theme.colors.text.primary,
                  borderRadius: semanticRadius.buttonPill,
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  marginTop: semanticSpacing.sm,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                <Text style={{ color: theme.colors.text.inverse, fontWeight: fontWeight.bold, letterSpacing: 0.3, ...textStyle.buttonPrimary }}>
                  {copy.cart.browseSpecials}
                </Text>
              </TactilePressable>
            }
          />
        </FadeSlideIn>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      <ScreenHeader title="Cart" subtitle={`${quantity} ${quantity === 1 ? 'item' : 'items'} • ${formatZar(subtotal)}`} />

      {isLoading ? (
        <View style={{ paddingHorizontal: semanticSpacing.screenPadding, gap: semanticSpacing.sm, marginTop: semanticSpacing.md }}>
          <CartSkeletonRow index={0} />
          <CartSkeletonRow index={1} />
          <CartSkeletonRow index={2} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.productId}
          contentContainerStyle={{ padding: semanticSpacing.screenPadding, gap: semanticSpacing.sm, paddingBottom: 140 }}
          ListHeaderComponent={
            <FadeSlideIn delay={80} distance={8}>
              <View style={{ backgroundColor: theme.colors.surface.primary, borderRadius: semanticRadius.card, padding: 12, borderWidth: 1, borderColor: theme.colors.border.subtle, marginBottom: 4 }}>
                <Text style={{ ...textStyle.caption, color: theme.colors.text.secondary, lineHeight: 16, letterSpacing: 0.1 }}>{copy.cart.trustNote}</Text>
              </View>
            </FadeSlideIn>
          }
          renderItem={({ item, index }) => {
            const product = products.find((p) => p.id === Number(item.productId));
            return (
              <CrashCascadeIn index={index}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: semanticSpacing.sm,
                    backgroundColor: theme.colors.surface.primary,
                    borderRadius: semanticRadius.card,
                    padding: semanticSpacing.md,
                    borderWidth: 1,
                    borderColor: theme.colors.border.subtle,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.04,
                    shadowRadius: 8,
                    elevation: 1,
                    opacity: product ? 1 : 0.6,
                  }}
                >
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: semanticRadius.imageFrame,
                      backgroundColor: theme.colors.surface.elevated,
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      borderWidth: 1,
                      borderColor: theme.colors.border.subtle,
                    }}
                  >
                    {product?.images && product.images[0] ? (
                      <Image source={{ uri: product.images[0] }} style={{ width: 56, height: 56 }} contentFit="contain" cachePolicy="memory-disk" />
                    ) : (
                      <Text style={{ fontSize: 24 }}>🛒</Text>
                    )}
                  </View>

                  <View style={{ flex: 1, gap: 3 }}>
                    <Text numberOfLines={2} style={{ fontWeight: fontWeight.semibold, color: theme.colors.text.primary, fontSize: 13, letterSpacing: -0.2, lineHeight: 16 }}>
                      {product?.name ?? `Product #${item.productId}`}
                    </Text>
                    <Text style={{ ...textStyle.caption, color: product ? theme.colors.text.secondary : brand.error, fontSize: 11 }}>
                      {product ? `${formatZar(product.effectivePriceCents)} each` : 'Unavailable — will be removed at checkout'}
                    </Text>
                    <Text style={{ fontWeight: fontWeight.bold, color: theme.colors.text.primary, fontSize: 13, letterSpacing: -0.2, marginTop: 2 }}>
                      {formatZar(priceOf(item.productId) * item.quantity)}
                    </Text>
                  </View>

                  {product ? (
                    <View style={{ alignItems: 'center', gap: 8 }}>
                      <Stepper
                        quantity={item.quantity}
                        onIncrement={() => {
                          useCart.getState().add(item.productId, 1);
                          trackAddToCart(Number(item.productId), item.quantity + 1);
                        }}
                        onDecrement={() => {
                          useCart.getState().decrement(item.productId);
                          trackRemoveFromCart(Number(item.productId));
                        }}
                      />
                      <TactilePressable
                        onPress={() => {
                          useCart.getState().remove(item.productId);
                          trackRemoveFromCart(Number(item.productId));
                        }}
                        haptic="selection"
                        style={{ padding: 4 }}
                      >
                        <Trash2 size={14} color={theme.colors.text.tertiary} strokeWidth={1.75} />
                      </TactilePressable>
                    </View>
                  ) : (
                    <TactilePressable
                      onPress={() => {
                        useCart.getState().remove(item.productId);
                        trackRemoveFromCart(Number(item.productId));
                      }}
                      haptic="selection"
                      style={{
                        backgroundColor: brand.error + '15',
                        borderRadius: semanticRadius.buttonPill,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                      }}
                    >
                      <Text style={{ color: brand.error, fontSize: 11, fontWeight: fontWeight.semibold }}>Remove</Text>
                    </TactilePressable>
                  )}
                </View>
              </CrashCascadeIn>
            );
          }}
        />
      )}

      <FadeSlideIn delay={200} distance={12} initialScale={0.98}>
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border.subtle,
            padding: semanticSpacing.screenPadding,
            paddingBottom: semanticSpacing.screenPadding + 4,
            gap: semanticSpacing.sm,
            backgroundColor: theme.colors.background.primary,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: theme.colors.text.secondary, fontSize: 13 }}>Subtotal ({quantity} items)</Text>
            <Text style={{ fontWeight: fontWeight.bold, color: theme.colors.text.primary, fontSize: 15, letterSpacing: -0.2 }}>{formatZar(subtotal)}</Text>
          </View>

          {subtotal < MIN_ORDER_CENTS && (
            <View style={{ backgroundColor: brand.error + '10', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: brand.error + '20' }}>
              <Text style={{ color: brand.error, fontSize: 11, fontWeight: '500', lineHeight: 14 }}>
                {copy.cart.minOrder.replace('{minCents}', formatZar(MIN_ORDER_CENTS))}
              </Text>
            </View>
          )}

          <TactilePressable
            onPress={() => navigation.navigate('Checkout')}
            haptic="commit"
            disabled={!canCheckout}
            accessibilityRole="button"
            accessibilityLabel={copy.cart.checkOut}
            accessibilityState={{ disabled: !canCheckout }}
            style={{
              backgroundColor: canCheckout ? theme.colors.text.primary : theme.colors.surface.elevated,
              borderRadius: semanticRadius.buttonPill,
              paddingVertical: 14,
              opacity: canCheckout ? 1 : 0.6,
              shadowColor: canCheckout ? '#000' : 'transparent',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: canCheckout ? 3 : 0,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Text
              style={{
                color: canCheckout ? theme.colors.text.inverse : theme.colors.text.secondary,
                fontWeight: fontWeight.bold,
                letterSpacing: 0.3,
                fontSize: 13,
                textTransform: 'uppercase',
              }}
            >
              {copy.cart.checkOut}
            </Text>
            <ArrowRight size={16} color={canCheckout ? theme.colors.text.inverse : theme.colors.text.secondary} strokeWidth={2.2} />
          </TactilePressable>
        </View>
      </FadeSlideIn>
    </View>
  );
}

function CartSkeletonRow({ index = 0 }: { index?: number }) {
  const theme = useTheme();
  return (
    <FadeSlideIn delay={index * 40} distance={8} initialScale={0.97}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: semanticSpacing.sm,
          backgroundColor: theme.colors.surface.primary,
          borderRadius: semanticRadius.card,
          padding: semanticSpacing.md,
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
        }}
      >
        <View style={{ width: 64, height: 64, borderRadius: semanticRadius.imageFrame, backgroundColor: theme.colors.surface.elevated }} />
        <View style={{ flex: 1, gap: 6 }}>
          <View style={{ height: 12, borderRadius: 6, backgroundColor: theme.colors.border.subtle, width: '80%' }} />
          <View style={{ height: 10, borderRadius: 6, backgroundColor: theme.colors.border.subtle, width: '45%' }} />
          <View style={{ height: 12, borderRadius: 6, backgroundColor: theme.colors.border.subtle, width: '30%', marginTop: 4 }} />
        </View>
        <View style={{ height: 28, width: 90, borderRadius: semanticRadius.buttonPill, backgroundColor: theme.colors.border.subtle }} />
      </View>
    </FadeSlideIn>
  );
}
