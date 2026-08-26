import { View, Text, Image, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { useRoute } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { textStyle, fontWeight, letterSpacing } from '../../theme/typography';
import { semanticSpacing, semanticRadius } from '../../theme/spacing';
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
  const [imageError, setImageError] = useState(false);
  useEffect(() => {
    setImageError(false);
    setImageSource(product && product.images[0] ? { uri: product.images[0] } : null);
  }, [product]);

  if (isLoading || !product) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background.primary, padding: semanticSpacing.screenPadding, paddingTop: 72 }}>
        <SkeletonCard height={320} width={undefined} />
      </View>
    );
  }

  const onSale = product.salePriceCents != null && product.salePriceCents < product.basePriceCents;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingTop: 56, paddingHorizontal: semanticSpacing.screenPadding, gap: semanticSpacing.inlineGap }}>
          <FadeSlideIn>
            <View style={{ height: 240, borderRadius: semanticRadius.cardLarge, backgroundColor: theme.colors.surface.primary, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {imageSource && !imageError ? (
                <Image
                  source={imageSource}
                  style={{ width: 200, height: 200, transform: [{ rotate: '-12deg' }] }}
                  resizeMode="contain"
                  onError={() => setImageError(true)}
                />
              ) : (
                <Text style={{ fontSize: 80 }}>🛒</Text>
              )}
            </View>
          </FadeSlideIn>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ flex: 1, ...textStyle.h2, color: theme.colors.text.primary }}>{product.name}</Text>
          </View>
          {product.brand ? (
            <Text style={{ color: theme.colors.text.secondary, ...textStyle.caption, textTransform: 'uppercase', letterSpacing: letterSpacing.wide }}>
              {product.brand}
            </Text>
          ) : null}

          <PriceLabel priceCents={product.basePriceCents} salePriceCents={product.salePriceCents} unit={product.unit} size={22} />
          <PriceGauge priceCents={product.basePriceCents} salePriceCents={product.salePriceCents} unit={product.unit} />

          {product.keyPoints.length > 0 && (
            <View style={{ gap: 4, backgroundColor: theme.colors.surface.primary, borderRadius: semanticRadius.card, padding: semanticSpacing.md }}>
              {product.keyPoints.map((point, i) => (
                <Text key={i} style={{ color: theme.colors.text.secondary, ...textStyle.body }}>
                  {'\u2022 ' + point}
                </Text>
              ))}
            </View>
          )}

          {product.description ? (
            <Text style={{ color: theme.colors.text.secondary, ...textStyle.body, lineHeight: textStyle.body.lineHeight }}>{product.description}</Text>
          ) : null}

          {product.storageTip ? (
            <Text style={{ ...textStyle.caption, color: theme.colors.text.tertiary }}>
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
          padding: semanticSpacing.screenPadding,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border.subtle,
          backgroundColor: theme.colors.background.primary,
        }}
      >
        {quantity === 0 ? (
          <TactilePressable
            onPress={() => add(String(product.id), 1)}
            haptic="commit"
            accessibilityRole="button"
            accessibilityLabel={`Add ${product.name} to cart`}
            style={{ backgroundColor: brand.orange, borderRadius: semanticRadius.buttonPill, alignSelf: 'stretch' }}
          >
            <Text style={{ color: theme.colors.text.inverse, textAlign: 'center', fontWeight: fontWeight.bold, textTransform: 'uppercase', letterSpacing: letterSpacing.wide, ...textStyle.buttonPrimary }}>
              Add to cart \u00B7 {formatZar(product.effectivePriceCents)} / {product.unit}
            </Text>
          </TactilePressable>
        ) : (
          <View style={{ alignItems: 'center' }}>
            <Stepper quantity={quantity} onIncrement={() => add(String(product.id), 1)} onDecrement={() => decrement(String(product.id))} />
          </View>
        )}
        {onSale && (
          <Text style={{ textAlign: 'center', marginTop: semanticSpacing.xs, color: brand.orange, ...textStyle.caption, fontWeight: fontWeight.semibold }}>
            Special offer
          </Text>
        )}
      </View>
    </View>
  );
}