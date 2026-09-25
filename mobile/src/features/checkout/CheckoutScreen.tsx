import { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Store, Lock, CheckCircle2, AlertCircle, MapPin, X } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { typeScale, weights, letterSpacing } from '../../theme/typography';
import { useCart } from '../cart/store';
import { cartRules } from '../cart/model';
import { useAllProducts } from '../catalog/hooks';
import { useSession } from '../../stores/session';
import { placeOrder, validateFulfillment } from '../../lib/apiClient';
import { getDeliveryCoords } from '../../lib/deliveryCoords';
import { formatZar } from '../../lib/currency';
import { TactilePressable } from '../../components/shared/TactilePressable';
import { EmptyState } from '../../components/shared/EmptyState';
import { haptic } from '../../lib/haptics';
import { copy, formatString } from '../../lib/strings';
import { queryClient, queryKeys } from '../../lib/queryKeys';
import { useToast } from '../../components/shared/GlassToast';
import type { RootStackParamList } from '../../navigation/types';
import { canSubmit, MIN_ORDER_CENTS } from './model';

const EST_DELIVERY_FEE_CENTS = 0;
const VALIDATION_DEBOUNCE_MS = 500;

type PaymentMethod = 'cash_on_delivery';

interface FulfillmentStoreInfo {
  id: number;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
  delivery_radius_km: number;
}

export function CheckoutScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const items = useCart((s) => s.items);
  const clearCart = useCart((s) => s.clear);
  const status = useSession((s) => s.status);
  const toast = useToast();

  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod] = useState<PaymentMethod>('cash_on_delivery');
  const [usedFallbackLocation, setUsedFallbackLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fulfillmentStore, setFulfillmentStore] = useState<FulfillmentStoreInfo | null>(null);
  const [fulfillmentError, setFulfillmentError] = useState<string | null>(null);
  const [validatingFulfillment, setValidatingFulfillment] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const { data: products = [] } = useAllProducts({ storeId: undefined });
  const priceOf = (id: string) => products.find((p) => p.id === Number(id))?.effectivePriceCents ?? 0;
  const subtotal = cartRules.subtotalCents(items, priceOf);
  const total = subtotal + EST_DELIVERY_FEE_CENTS;
  const canSubmitOrder = canSubmit({
    itemCount: items.length,
    subtotalCents: subtotal,
    address,
    authenticated: status === 'authenticated',
    storeSelected: fulfillmentStore != null,
    submitting,
    validatingFulfillment,
    fulfillmentValid: fulfillmentStore != null && fulfillmentError == null,
  });

  // Validate fulfillment when cart or address/coords change (debounced)
  useEffect(() => {
    if (items.length === 0) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      let cancelled = false;

      const validate = async () => {
        setValidatingFulfillment(true);
        setFulfillmentError(null);

        try {
          const coords = await getDeliveryCoords();

          const result = await validateFulfillment({
            items: items.map((i) => ({ product_id: Number(i.productId), quantity: i.quantity })),
            latitude: coords.latitude,
            longitude: coords.longitude,
          });

          if (!cancelled) {
            if (result.success && result.store) {
              setFulfillmentStore({
                id: result.store.id,
                name: result.store.name,
                slug: result.store.slug,
                latitude: result.store.latitude,
                longitude: result.store.longitude,
                delivery_radius_km: result.store.delivery_radius_km,
              });
            } else {
              setFulfillmentStore(null);
              setFulfillmentError(result.reason || 'Cannot fulfill order from any store');
            }
          }
        } catch {
          if (!cancelled) {
            setFulfillmentStore(null);
            setFulfillmentError('Could not validate fulfillment. Please try again.');
          }
        } finally {
          if (!cancelled) setValidatingFulfillment(false);
        }
      };

      void validate();

      return () => { cancelled = true; };
    }, VALIDATION_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [items, address]); // Re-validate when cart or address changes

  const submit = async () => {
    if (!canSubmitOrder) {
      haptic.warning();
      setError('Please complete all fields and ensure fulfillment is valid before placing your order.');
      return;
    }
    // Safety check - should not be possible due to disabled button, but guard anyway
    if (status !== 'authenticated') {
      setError('Please sign in to place an order.');
      return;
    }
    if (fulfillmentError || !fulfillmentStore) {
      setError('Cannot place order: fulfillment validation failed. Please check your address.');
      return;
    }
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
      haptic.success();
      navigation.replace('OrderPlaced', { orderId: res.data.id, dispatch: res.dispatch });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not place the order.');
    } finally {
      setSubmitting(false);
    }
  };

  const row = (label: string, value: string, strong = false) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ color: theme.colors.text.secondary, fontSize: typeScale.body }}>{label}</Text>
      <Text style={{ fontWeight: strong ? weights.bold : weights.semibold, color: theme.colors.text.primary }}>{value}</Text>
    </View>
  );

  if (items.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
        <ScreenTitle title={copy.checkout.title} onClose={handleClose} />
        <EmptyState icon={Store} title="Nothing to check out" caption="Your cart is empty." />
      </View>
    );
  }

  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.colors.background.primary }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
        <ScreenTitle title={copy.checkout.title} onClose={handleClose} />

        <View style={{ padding: 16, gap: 14 }}>
          {validatingFulfillment && (
            <View style={{ backgroundColor: theme.colors.surface.primary, borderRadius: 16, padding: 16, gap: 8 }}>
              <Text style={{ fontWeight: weights.bold, color: theme.colors.text.primary }}>Finding best fulfillment store...</Text>
              <Text style={{ color: theme.colors.text.secondary, fontSize: typeScale.body }}>We're checking which store can fulfill your complete order</Text>
            </View>
          )}

          {fulfillmentError && (
            <View style={{ backgroundColor: theme.colors.status.error.soft, borderRadius: 16, padding: 16, gap: 8, borderWidth: 1, borderColor: theme.colors.status.error.primary }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={20} color={theme.colors.status.error.strong} />
                <Text style={{ color: theme.colors.status.error.strong, fontWeight: weights.semibold, fontSize: typeScale.body }}>
                  Cannot fulfill order
                </Text>
              </View>
              <Text style={{ color: theme.colors.status.error.strong, fontSize: typeScale.body }}>
                {fulfillmentError}
              </Text>
            </View>
          )}

          {fulfillmentStore && !fulfillmentError && (
            <View style={{ backgroundColor: theme.colors.surface.primary, borderRadius: 16, padding: 16, gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <MapPin size={18} color={brand.primary} />
                <Text style={{ color: theme.colors.text.secondary, fontSize: typeScale.body }}>
                  Your full order will be fulfilled from <Text style={{ fontWeight: weights.bold, color: theme.colors.text.primary }}>{fulfillmentStore.name}</Text>
                </Text>
              </View>
              <Text style={{ color: theme.colors.text.tertiary, fontSize: typeScale.caption }}>
                This store has all selected items available and is within delivery range
              </Text>
            </View>
          )}

          {!validatingFulfillment && !fulfillmentStore && !fulfillmentError && (
            <View style={{ backgroundColor: theme.colors.surface.primary, borderRadius: 16, padding: 16, gap: 8 }}>
              <Text style={{ fontWeight: weights.bold, color: theme.colors.text.primary }}>Unable to determine fulfillment store</Text>
              <Text style={{ color: theme.colors.text.secondary, fontSize: typeScale.body }}>Please enter your delivery address to continue</Text>
            </View>
          )}

          <View style={{ gap: 6 }}>
            <Text style={{ fontWeight: weights.semibold, color: theme.colors.text.primary }}>{copy.checkout.deliveryAddress}</Text>
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder={copy.checkout.deliveryAddressPlaceholder}
              placeholderTextColor={theme.colors.text.tertiary}
              multiline
              numberOfLines={2}
              style={{
                backgroundColor: theme.colors.surface.sunken,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                color: theme.colors.text.primary,
                fontSize: typeScale.body,
                minHeight: 64,
                textAlignVertical: 'top',
              }}
            />
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ fontWeight: weights.semibold, color: theme.colors.text.primary }}>{copy.checkout.deliveryNotes}</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder={copy.checkout.deliveryNotesPlaceholder}
              placeholderTextColor={theme.colors.text.tertiary}
              multiline
              numberOfLines={2}
              style={{
                backgroundColor: theme.colors.surface.sunken,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                color: theme.colors.text.primary,
                fontSize: typeScale.body,
                minHeight: 64,
                textAlignVertical: 'top',
              }}
            />
            {usedFallbackLocation && (
              <Text style={{ color: theme.colors.text.secondary, fontSize: typeScale.caption }}>
                {copy.checkout.locationFallback}
              </Text>
            )}
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ fontWeight: weights.semibold, color: theme.colors.text.primary }}>{copy.checkout.paymentMethod}</Text>
            <View
              accessibilityRole="radio"
              accessibilityState={{ selected: true }}
              style={{
                backgroundColor: theme.colors.surface.primary,
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
                <Text style={{ fontWeight: weights.semibold, color: theme.colors.text.primary }}>{copy.checkout.cashOnDelivery}</Text>
                <Text style={{ color: theme.colors.text.secondary, fontSize: typeScale.caption }}>{copy.checkout.cashOnDeliveryNote}</Text>
              </View>
            </View>
          </View>

          <View style={{ backgroundColor: theme.colors.surface.primary, borderRadius: 16, padding: 16, gap: 10 }}>
            <Text style={{ fontWeight: weights.bold, color: theme.colors.text.primary }}>{copy.checkout.summary}</Text>
            {row(`${cartRules.totalQuantity(items)} items`, formatZar(subtotal))}
            {row(copy.checkout.estimatedDelivery, formatZar(EST_DELIVERY_FEE_CENTS))}
            <View style={{ height: 1, backgroundColor: theme.colors.border.subtle }} />
            {row(copy.checkout.total, formatZar(total), true)}
          </View>

          {status !== 'authenticated' && (
            <View style={{ backgroundColor: theme.colors.surface.primary, borderRadius: 16, padding: 16, gap: 8, alignItems: 'center' }}>
              <Lock size={20} color={theme.colors.text.secondary} />
              <Text style={{ color: theme.colors.text.secondary, fontSize: typeScale.body, textAlign: 'center' }}>
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
            <Text style={{ color: theme.colors.status.error.strong, fontSize: typeScale.body }}>{error}</Text>
          )}
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, borderTopWidth: 1, borderTopColor: theme.colors.border.subtle, backgroundColor: theme.colors.background.primary }}>
        <TactilePressable
          onPress={submit}
          haptic="commit"
          disabled={!canSubmitOrder}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSubmitOrder }}
          style={{ backgroundColor: canSubmitOrder ? brand.primary : theme.colors.surface.primary, borderRadius: 999, opacity: canSubmitOrder ? 1 : 0.6 }}
        >
          <Text style={{ color: canSubmitOrder ? '#fff' : theme.colors.text.secondary, textAlign: 'center', fontWeight: weights.bold, textTransform: 'uppercase', letterSpacing: letterSpacing.wide }}>
            {submitting ? copy.checkout.placingOrder : `${copy.checkout.placeOrder} · ${formatZar(total)}`}
          </Text>
        </TactilePressable>
        {subtotal < MIN_ORDER_CENTS && (
          <Text style={{ textAlign: 'center', marginTop: 8, color: theme.colors.status.error.strong, fontSize: typeScale.caption }}>
            {formatString(copy.cart.minOrder, { minCents: formatZar(MIN_ORDER_CENTS) })}
          </Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

function ScreenTitle({ title, onClose }: { title: string; onClose?: () => void }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: 16 }}>
      <Text style={{ fontSize: typeScale.title, fontWeight: weights.extrabold, color: theme.colors.text.primary }}>
        {title}
      </Text>
      {onClose && (
        <TactilePressable
          onPress={onClose}
          haptic="selection"
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: theme.colors.surface.elevated,
            borderWidth: 1,
            borderColor: theme.colors.border.subtle,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <X size={18} color={theme.colors.text.primary} strokeWidth={2.2} />
        </TactilePressable>
      )}
    </View>
  );
}
