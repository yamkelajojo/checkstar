import { View, Text, Image, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { useRoute } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { typeScale, weights, letterSpacing } from '../../theme/typography';
import { useProduct } from '../catalog/hooks';
import { PriceLabel } from '../../components/shared/PriceLabel';
import { PriceGauge } from '../../components/shared/PriceGauge';
import { Stepper } from '../../components/shared/Stepper';
import { TactilePressable } from '../../components/shared/TactilePressable';
import { SkeletonCard } from '../../components/shared/SkeletonCard';
import { FadeSlideIn } from '../../components/shared/FadeSlideIn';
import { useCart } from '../cart/store';
import { formatZar } from '../../lib/currency';

export function ProductDetailScreen() {
  const theme = useTheme();
  const route = useRoute();
  const { slug } = route.params as { slug: string };
  const { data: product, isLoading } = useProduct(slug);
  const quantity = useCart((s) => (product ? s.items.find((i) => i.productId === String(product.id))?.quantity ?? 0 : 0));
  const add = useCart((s) => s.add);
  const decrement = useCart((s) => s.decrement);

  const [imageSource, setImageSource] = useState<{ uri: string } | null>(null);
  useEffect(() => {
    setImageSource(product && product.images[0] ? { uri: product.images[0] } : null);
  }, [product]);

  if (isLoading || !product) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg, padding: 16, paddingTop: 72 }}>
        <SkeletonCard height={320} width={undefined} />
      </View>
    );
  }

  const onSale = product.salePriceCents != null && product.salePriceCents < product.basePriceCents;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingTop: 56, paddingHorizontal: 16, gap: 12 }}>
          <FadeSlideIn>
            <View style={{ height: 240, borderRadius: 20, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {imageSource ? (
                <Image source={imageSource} style={{ width: 200, height: 200, transform: [{ rotate: '-12deg' }] }} resizeMode="contain" />
              ) : (
                <Text style={{ fontSize: 80 }}>🛒</Text>
              )}
            </View>
          </FadeSlideIn>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ flex: 1, fontSize: typeScale.title, fontWeight: weights.extrabold, color: theme.colors.text }}>{product.name}</Text>
          </View>
          {product.brand ? (
            <Text style={{ color: theme.colors.textMuted, fontSize: typeScale.caption, textTransform: 'uppercase', letterSpacing: letterSpacing.wide }}>
              {product.brand}
            </Text>
          ) : null}

          <PriceLabel priceCents={product.basePriceCents} salePriceCents={product.salePriceCents} unit={product.unit} size={22} />
          <PriceGauge priceCents={product.basePriceCents} salePriceCents={product.salePriceCents} unit={product.unit} />

          {product.keyPoints.length > 0 && (
            <View style={{ gap: 4, backgroundColor: theme.colors.surface, borderRadius: 16, padding: 14 }}>
              {product.keyPoints.map((point, i) => (
                <Text key={i} style={{ color: theme.colors.textMuted, fontSize: typeScale.body }}>
                  • {point}
                </Text>
              ))}
            </View>
          )}

          {product.description ? (
            <Text style={{ color: theme.colors.textMuted, fontSize: typeScale.body, lineHeight: 21 }}>{product.description}</Text>
          ) : null}

          {product.storageTip ? (
            <Text style={{ fontSize: typeScale.caption, color: theme.colors.textFaint }}>
              Tip: {product.storageTip}
            </Text>
          ) : null}
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: 16,
          borderTopWidth: 1,
          borderTopColor: theme.colors.hairline,
          backgroundColor: theme.colors.bg,
        }}
      >
        {quantity === 0 ? (
          <TactilePressable
            onPress={() => add(String(product.id), 1)}
            hapticOnPress="commit"
            accessibilityRole="button"
            accessibilityLabel={`Add ${product.name} to cart`}
            style={{ backgroundColor: brand.primary, borderRadius: 999, alignSelf: 'stretch' }}
          >
            <Text style={{ color: '#fff', textAlign: 'center', fontWeight: weights.bold, textTransform: 'uppercase', letterSpacing: letterSpacing.wide }}>
              Add to cart · {formatZar(product.effectivePriceCents)} / {product.unit}
            </Text>
          </TactilePressable>
        ) : (
          <View style={{ alignItems: 'center' }}>
            <Stepper quantity={quantity} onIncrement={() => add(String(product.id), 1)} onDecrement={() => decrement(String(product.id))} />
          </View>
        )}
        {onSale && (
          <Text style={{ textAlign: 'center', marginTop: 8, color: brand.primary, fontSize: typeScale.caption, fontWeight: weights.semibold }}>
            Special offer
          </Text>
        )}
      </View>
    </View>
  );
}