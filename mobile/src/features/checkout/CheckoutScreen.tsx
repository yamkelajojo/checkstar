import { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Store, Lock, CheckCircle2, AlertCircle, MapPin, ShoppingBag } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { typeScale, weights, letterSpacing } from '../../theme/typography';
import { useCart } from '../cart/store';
import { cartRules } from '../cart/model';
import { useAllProducts } from '../catalog/hooks';
import { useSession } from '../../stores/session';
import { placeOrder, validateFulfillment, fetchStores, fetchAddresses } from '../../lib/apiClient';
import type { ApiStore, ApiUserAddress } from '../../lib/types';
import { getDeliveryCoords } from '../../lib/deliveryCoords';
import { formatZar } from '../../lib/currency';
import { TactilePressable } from '../../components/shared/TactilePressable';
import { EmptyState } from '../../components/shared/EmptyState';
import { haptic } from '../../lib/haptics';
import { copy, formatString } from '../../lib/strings';
import { queryClient, queryKeys } from '../../lib/queryKeys';
import { useToast } from '../../components/shared/GlassToast';
import { MIN_ORDER_CENTS, EST_DELIVERY_FEE_CENTS, VALIDATION_DEBOUNCE_MS } from '../../lib/constants';
import type { RootStackParamList } from '../../navigation/types';
import { canSubmit } from './model';
import { trackCheckout } from '../../services/trackingService';
import { useTopSafeArea } from '../../components/shared/ScreenHeader';

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

  // Fulfilment: have it delivered, or collect from a store yourself.
  const [fulfilment, setFulfilment] = useState<'delivery' | 'pickup'>('delivery');
  const [stores, setStores] = useState<ApiStore[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<ApiUserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | 'new'>('new');

  useEffect(() => {
    let cancelled = false;
    void fetchStores()
      .then((all) => {
        if (cancelled) return;
        const active = all.filter((x) => x.is_active);
        setStores(active);
        setSelectedStoreId((current) => current ?? active[0]?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) setStores([]);
      });
    void fetchAddresses()
      .then((list) => {
        if (cancelled) return;
        setSavedAddresses(list);
        const preferred = list.find((a) => a.is_default) ?? list[0];
        if (preferred) setSelectedAddressId((current) => (current === 'new' ? preferred.id : current));
      })
      .catch(() => {
        if (!cancelled) setSavedAddresses([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
  const selectedStore = stores.find((x) => x.id === selectedStoreId) ?? null;
  const isPickup = fulfilment === 'pickup';
  const usingSavedAddress = !isPickup && selectedAddressId !== 'new' && savedAddresses.some((a) => a.id === selectedAddressId);
  const activeSavedAddress = usingSavedAddress ? savedAddresses.find((a) => a.id === selectedAddressId) ?? null : null;
  const effectiveAddressForValidation = activeSavedAddress?.address ?? address;
  const deliveryTotal = subtotal + EST_DELIVERY_FEE_CENTS;
  const canSubmitOrder = isPickup
    ? canSubmit({
        itemCount: items.length,
        subtotalCents: subtotal,
        address: selectedStoreId != null ? 'ok' : '',
        authenticated: status === 'authenticated',
        storeSelected: true,
        submitting,
        validatingFulfillment: false,
        fulfillmentValid: selectedStoreId != null,
      })
    : canSubmit({
        itemCount: items.length,
        subtotalCents: subtotal,
        address: effectiveAddressForValidation,
        authenticated: status === 'authenticated',
        storeSelected: fulfillmentStore != null,
        submitting,
        validatingFulfillment,
        fulfillmentValid: fulfillmentStore != null && fulfillmentError == null,
      });

  // Validate fulfillment when cart or address/coords change (debounced).
  // Pickup skips this entirely — the customer chose the store themselves.
  useEffect(() => {
    if (items.length === 0 || fulfilment === 'pickup') {
      setFulfillmentError(null);
      setValidatingFulfillment(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    let cancelled = false;

    debounceRef.current = setTimeout(() => {
      const validate = async () => {
        setValidatingFulfillment(true);
        setFulfillmentError(null);

        try {
          let coords;
          if (usingSavedAddress) {
            const saved = savedAddresses.find((a) => a.id === selectedAddressId);
            if (saved) {
              coords = { latitude: Number(saved.latitude), longitude: Number(saved.longitude) };
            }
          }
          if (!coords) {
            coords = await getDeliveryCoords();
          }
          if (cancelled) return;

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
    }, VALIDATION_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [items, address, fulfilment, usingSavedAddress, savedAddresses, selectedAddressId]); // Re-validate when cart, address or fulfilment mode changes

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
    if (!isPickup && (fulfillmentError || !fulfillmentStore)) {
      setError('Cannot place order: fulfillment validation failed. Please check your address.');
      return;
    }
    if (isPickup && selectedStoreId == null) {
      setError('Please choose a store to collect from.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      let res;
      if (isPickup) {
        res = await placeOrder({
          items: items.map((i) => ({ product_id: Number(i.productId), quantity: i.quantity })),
          fulfilment_method: 'pickup',
          store_id: selectedStoreId!,
          delivery_notes: notes.trim() || undefined,
          payment_method: paymentMethod,
        });
      } else {
        const saved = savedAddresses.find((a) => a.id === selectedAddressId);
        if (saved) {
          res = await placeOrder({
            items: items.map((i) => ({ product_id: Number(i.productId), quantity: i.quantity })),
            fulfilment_method: 'delivery',
            delivery_address: saved.address,
            delivery_latitude: Number(saved.latitude),
            delivery_longitude: Number(saved.longitude),
            delivery_notes: notes.trim() || undefined,
            payment_method: paymentMethod,
          });
        } else {
          const coords = await getDeliveryCoords();
          setUsedFallbackLocation(coords.usedFallback);
          res = await placeOrder({
            items: items.map((i) => ({ product_id: Number(i.productId), quantity: i.quantity })),
            fulfilment_method: 'delivery',
            delivery_address: address.trim(),
            delivery_latitude: coords.latitude,
            delivery_longitude: coords.longitude,
            delivery_notes: notes.trim() || undefined,
            payment_method: paymentMethod,
          });
        }
      }
      // Keep cart on retrying/cancelled so customer can re-checkout (OrderCartPolicy #04)
      const shouldClear = res.dispatch?.status !== 'retrying' && res.dispatch?.status !== 'cancelled';
      if (shouldClear) {
        clearCart();
      } else {
        toast.show('No riders available right now — your cart is kept so you can retry.');
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      haptic.success();
      trackCheckout(subtotal);
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
        <ScreenTitle title={copy.checkout.title} />
        <EmptyState icon={Store} title="Nothing to check out" caption="Your cart is empty." />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.colors.background.primary }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
        <ScreenTitle title={copy.checkout.title} />

        <View style={{ padding: 16, gap: 14 }}>
          {/* How would you like to get your order? */}
          <View style={{ flexDirection: 'row', backgroundColor: theme.colors.surface.sunken, borderRadius: 14, padding: 4, gap: 4 }} accessibilityRole="tablist">
            {([
              { key: 'delivery', label: 'Deliver', icon: <MapPin size={16} color={fulfilment === 'delivery' ? brand.primary : theme.colors.text.secondary} /> },
              { key: 'pickup', label: 'Pickup', icon: <ShoppingBag size={16} color={isPickup ? brand.primary : theme.colors.text.secondary} /> },
            ] as const).map((opt) => {
              const active = fulfilment === opt.key;
              return (
                <TactilePressable
                  key={opt.key}
                  onPress={() => {
                    haptic.tap();
                    setFulfilment(opt.key);
                  }}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: active ? theme.colors.surface.primary : 'transparent',
                  }}
                >
                  {opt.icon}
                  <Text style={{ fontWeight: active ? weights.bold : weights.semibold, color: active ? brand.primary : theme.colors.text.secondary }}>
                    {opt.label}
                  </Text>
                </TactilePressable>
              );
            })}
          </View>

          {isPickup && (
            <View style={{ backgroundColor: theme.colors.surface.primary, borderRadius: 16, padding: 16, gap: 10 }}>
              <Text style={{ fontWeight: weights.bold, color: theme.colors.text.primary }}>Collect from</Text>
              {stores.length === 0 ? (
                <Text style={{ color: theme.colors.text.secondary, fontSize: typeScale.body }}>
                  No stores are open for collection right now — please try delivery.
                </Text>
              ) : (
                stores.map((storeOpt) => {
                  const active = storeOpt.id === selectedStoreId;
                  return (
                    <TactilePressable
                      key={storeOpt.id}
                      onPress={() => {
                        haptic.tap();
                        setSelectedStoreId(storeOpt.id);
                      }}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={`Collect from ${storeOpt.name}`}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                        padding: 12,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: active ? brand.primary : theme.colors.border.subtle,
                      }}
                    >
                      {active ? <CheckCircle2 size={18} color={brand.primary} /> : <Store size={18} color={theme.colors.text.secondary} />}
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: weights.semibold, color: theme.colors.text.primary }}>{storeOpt.name}</Text>
                        <Text style={{ color: theme.colors.text.secondary, fontSize: typeScale.caption }}>{storeOpt.address}</Text>
                      </View>
                    </TactilePressable>
                  );
                })
              )}
              <Text style={{ color: theme.colors.text.tertiary, fontSize: typeScale.caption }}>
                We'll pack your order ready for collection — no delivery fee.
              </Text>
            </View>
          )}

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

          {!isPickup && !validatingFulfillment && !fulfillmentStore && !fulfillmentError && (
            <View style={{ backgroundColor: theme.colors.surface.primary, borderRadius: 16, padding: 16, gap: 8 }}>
              <Text style={{ fontWeight: weights.bold, color: theme.colors.text.primary }}>Unable to determine fulfillment store</Text>
              <Text style={{ color: theme.colors.text.secondary, fontSize: typeScale.body }}>Please enter your delivery address to continue</Text>
            </View>
          )}

          {!isPickup && savedAddresses.length > 0 && (
            <View style={{ backgroundColor: theme.colors.surface.primary, borderRadius: 16, padding: 16, gap: 10 }}>
              <Text style={{ fontWeight: weights.bold, color: theme.colors.text.primary }}>Deliver to</Text>
              {savedAddresses.map((savedOpt) => {
                const active = selectedAddressId === savedOpt.id;
                return (
                  <TactilePressable
                    key={savedOpt.id}
                    onPress={() => {
                      haptic.tap();
                      setSelectedAddressId(savedOpt.id);
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`Deliver to ${savedOpt.label}`}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      padding: 12,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: active ? brand.primary : theme.colors.border.subtle,
                    }}
                  >
                    {active ? <CheckCircle2 size={18} color={brand.primary} /> : <MapPin size={18} color={theme.colors.text.secondary} />}
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: weights.semibold, color: theme.colors.text.primary }}>
                        {savedOpt.label}{savedOpt.is_default ? ' · Default' : ''}
                      </Text>
                      <Text numberOfLines={1} style={{ color: theme.colors.text.secondary, fontSize: typeScale.caption }}>{savedOpt.address}</Text>
                    </View>
                  </TactilePressable>
                );
              })}
              <TactilePressable
                onPress={() => {
                  haptic.tap();
                  setSelectedAddressId('new');
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: selectedAddressId === 'new' }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: selectedAddressId === 'new' ? brand.primary : theme.colors.border.subtle,
                }}
              >
                <MapPin size={18} color={selectedAddressId === 'new' ? brand.primary : theme.colors.text.secondary} />
                <Text style={{ fontWeight: weights.semibold, color: theme.colors.text.primary }}>Enter a new address</Text>
              </TactilePressable>
            </View>
          )}

          <View style={{ gap: 6, display: isPickup || usingSavedAddress ? 'none' : 'flex' }}>
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
            {isPickup
              ? row('Pickup', 'Free')
              : row(copy.checkout.estimatedDelivery, formatZar(EST_DELIVERY_FEE_CENTS))}
            <View style={{ height: 1, backgroundColor: theme.colors.border.subtle }} />
            {row(copy.checkout.total, formatZar(isPickup ? subtotal : total), true)}
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
            {submitting ? copy.checkout.placingOrder : `${copy.checkout.placeOrder} · ${formatZar(isPickup ? subtotal : total)}`}
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

function ScreenTitle({ title }: { title: string }) {
  const theme = useTheme();
  const topInset = useTopSafeArea();
  return (
    <Text style={{ paddingTop: topInset, paddingHorizontal: 16, fontSize: typeScale.title, fontWeight: weights.extrabold, color: theme.colors.text.primary }}>
      {title}
    </Text>
  );
}
