import { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Store, Lock, CheckCircle2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { typeScale, weights, letterSpacing } from '../../theme/typography';
import { useCart } from '../cart/store';
import { cartRules } from '../cart/model';
import { useProducts } from '../catalog/hooks';
import { useDeliveryStore } from '../../stores/deliveryStore';
import { useSession } from '../../stores/session';
import { placeOrder } from '../../lib/apiClient';
import { getDeliveryCoords } from '../../lib/deliveryCoords';
import { formatZar } from '../../lib/currency';
import { TactilePressable } from '../../components/shared/TactilePressable';
import { EmptyState } from '../../components/shared/EmptyState';
import { copy, formatString } from '../../lib/strings';
import { queryClient, queryKeys } from '../../lib/queryKeys';
import { useToast } from '../../components/shared/GlassToast';
import type { RootStackParamList } from '../../navigation/types';
import { canSubmit, MIN_ORDER_CENTS } from './model';

const EST_DELIVERY_FEE_CENTS = 0;

type PaymentMethod = 'cash_on_delivery';

export function CheckoutScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const store = useDeliveryStore((s) => s.store);
  const items = useCart((s) => s.items);
  const clearCart = useCart((s) => s.clear);
  const status = useSession((s) => s.status);
  const toast = useToast();
  const { data: products = [] } = useProducts({ storeId: store?.id ?? null });

  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod] = useState<PaymentMethod>('cash_on_delivery');
  const [usedFallbackLocation, setUsedFallbackLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getDeliveryCoords()
      .then((coords) => {
        if (!cancelled) setUsedFallbackLocation(coords.usedFallback);
      })
      .catch(() => {
        if (!cancelled) setUsedFallbackLocation(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const priceOf = (id: string) => products.find((p) => p.id === Number(id))?.effectivePriceCents ?? 0;
  const subtotal = cartRules.subtotalCents(items, priceOf);
  const total = subtotal + EST_DELIVERY_FEE_CENTS;
  const canSubmitOrder = canSubmit({
    itemCount: items.length,
    subtotalCents: subtotal,
    address,
    authenticated: status === 'authenticated',
    storeSelected: true,
    submitting,
  });

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const coords = await getDeliveryCoords();
      setUsedFallbackLocation(coords.usedFallback);
      const res = await placeOrder({
        items: items.map((i) => ({ product_id: Number(i.productId), quantity: i.quantity })),
        delivery_address: address.trim(),
        delivery_latitude: coords.latitude,
        delivery_longitude: coords.longitude,
        delivery_notes: notes.trim() || undefined,
        payment_method: paymentMethod,
      });
      // Keep cart on retrying/cancelled so customer can re-checkout (OrderCartPolicy #04)
      const shouldClear = res.dispatch?.status !== 'retrying' && res.dispatch?.status !== 'cancelled';
      if (shouldClear) {
        clearCart();
      } else {
        toast.show('No riders available right now — your cart is kept so you can retry.');
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      navigation.replace('OrderPlaced', { orderId: res.data.id, dispatch: res.dispatch });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not place the order.');
    } finally {
      setSubmitting(false);
    }
  };

  const row = (label: string, value: string, strong = false) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ color: theme.colors.textMuted, fontSize: typeScale.body }}>{label}</Text>
      <Text style={{ fontWeight: strong ? weights.bold : weights.semibold, color: theme.colors.text }}>{value}</Text>
    </View>
  );

  if (items.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <ScreenTitle title={copy.checkout.title} />
        <EmptyState icon={Store} title="Nothing to check out" caption="Your cart is empty." />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
        <ScreenTitle title={copy.checkout.title} />

        <View style={{ padding: 16, gap: 14 }}>
          {store == null && (
            <View style={{ backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16, gap: 8 }}>
              <Text style={{ fontWeight: weights.bold, color: theme.colors.text }}>{copy.checkout.noStoreTitle}</Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: typeScale.body }}>{copy.checkout.noStoreBody}</Text>
              <TactilePressable
                onPress={() => navigation.navigate('StorePicker')}
                haptic="commit"
                style={{ backgroundColor: brand.primary, borderRadius: 999, alignSelf: 'flex-start' }}
              >
                <Text style={{ color: '#fff', fontWeight: weights.bold }}>{copy.checkout.pickStore}</Text>
              </TactilePressable>
            </View>
          )}

          {store != null && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Store size={18} color={brand.primary} />
              <Text style={{ color: theme.colors.textMuted, fontSize: typeScale.body }}>
                Fulfilled by <Text style={{ fontWeight: weights.bold, color: theme.colors.text }}>{store.name}</Text>
              </Text>
            </View>
          )}

          <View style={{ gap: 6 }}>
            <Text style={{ fontWeight: weights.semibold, color: theme.colors.text }}>{copy.checkout.deliveryAddress}</Text>
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder={copy.checkout.deliveryAddressPlaceholder}
              placeholderTextColor={theme.colors.textFaint}
              multiline
              numberOfLines={2}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                color: theme.colors.text,
                fontSize: typeScale.body,
                minHeight: 64,
                textAlignVertical: 'top',
              }}
            />
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ fontWeight: weights.semibold, color: theme.colors.text }}>{copy.checkout.deliveryNotes}</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder={copy.checkout.deliveryNotesPlaceholder}
              placeholderTextColor={theme.colors.textFaint}
              multiline
              numberOfLines={2}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                color: theme.colors.text,
                fontSize: typeScale.body,
                minHeight: 64,
                textAlignVertical: 'top',
              }}
            />
            {usedFallbackLocation && (
              <Text style={{ color: theme.colors.textMuted, fontSize: typeScale.caption }}>
                {copy.checkout.locationFallback}
              </Text>
            )}
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ fontWeight: weights.semibold, color: theme.colors.text }}>{copy.checkout.paymentMethod}</Text>
            <View
              accessibilityRole="radio"
              accessibilityState={{ selected: true }}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: 14,
                padding: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                borderWidth: 1,
                borderColor: brand.primary,
              }}
            >
              <CheckCircle2 size={20} color={brand.primary} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontWeight: weights.semibold, color: theme.colors.text }}>{copy.checkout.cashOnDelivery}</Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: typeScale.caption }}>{copy.checkout.cashOnDeliveryNote}</Text>
              </View>
            </View>
          </View>

          <View style={{ backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16, gap: 10 }}>
            <Text style={{ fontWeight: weights.bold, color: theme.colors.text }}>{copy.checkout.summary}</Text>
            {row(`${cartRules.totalQuantity(items)} items`, formatZar(subtotal))}
            {row(copy.checkout.estimatedDelivery, formatZar(EST_DELIVERY_FEE_CENTS))}
            <View style={{ height: 1, backgroundColor: theme.colors.hairline }} />
            {row(copy.checkout.total, formatZar(total), true)}
          </View>

          {status !== 'authenticated' && (
            <View style={{ backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16, gap: 8, alignItems: 'center' }}>
              <Lock size={20} color={theme.colors.textMuted} />
              <Text style={{ color: theme.colors.textMuted, fontSize: typeScale.body, textAlign: 'center' }}>
                {copy.checkout.signInPrompt}
              </Text>
              <TactilePressable
                onPress={() => navigation.navigate('Auth', { intent: 'checkout' })}
                haptic="commit"
                style={{ backgroundColor: brand.primary, borderRadius: 999, alignSelf: 'stretch' }}
              >
                <Text style={{ color: '#fff', textAlign: 'center', fontWeight: weights.bold }}>{copy.checkout.signInToContinue}</Text>
              </TactilePressable>
            </View>
          )}

          {error != null && (
            <Text style={{ color: brand.accent, fontSize: typeScale.body }}>{error}</Text>
          )}
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, borderTopWidth: 1, borderTopColor: theme.colors.hairline, backgroundColor: theme.colors.bg }}>
        <TactilePressable
          onPress={submit}
          haptic="commit"
          disabled={!canSubmitOrder}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSubmitOrder }}
          style={{ backgroundColor: canSubmitOrder ? brand.primary : theme.colors.surface, borderRadius: 999, opacity: canSubmitOrder ? 1 : 0.6 }}
        >
          <Text style={{ color: canSubmitOrder ? '#fff' : theme.colors.textMuted, textAlign: 'center', fontWeight: weights.bold, textTransform: 'uppercase', letterSpacing: letterSpacing.wide }}>
            {submitting ? copy.checkout.placingOrder : `${copy.checkout.placeOrder} · ${formatZar(total)}`}
          </Text>
        </TactilePressable>
        {subtotal < MIN_ORDER_CENTS && (
          <Text style={{ textAlign: 'center', marginTop: 8, color: brand.accent, fontSize: typeScale.caption }}>
            {formatString(copy.cart.minOrder, { minCents: formatZar(MIN_ORDER_CENTS) })}
          </Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

function ScreenTitle({ title }: { title: string }) {
  const theme = useTheme();
  return (
    <Text style={{ paddingTop: 56, paddingHorizontal: 16, fontSize: typeScale.title, fontWeight: weights.extrabold, color: theme.colors.text }}>
      {title}
    </Text>
  );
}
