import { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Store, Lock, CheckCircle2, AlertCircle, MapPin, ShoppingBag } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { textStyle, fontWeight } from '../../theme/typography';
import { semanticSpacing, semanticRadius } from '../../theme/spacing';
import { useCart } from '../cart/store';
import { cartRules } from '../cart/model';
import { useAllProducts } from '../catalog/hooks';
import { useSession } from '../../stores/session';
import { placeOrder, validateFulfillment, fetchStores, fetchAddresses } from '../../lib/apiClient';
import type { ApiStore, ApiUserAddress } from '../../lib/types';
import { getDeliveryCoords } from '../../lib/deliveryCoords';
import {
  searchAddressSuggestions,
  resolveAddressCoordinates,
  type AddressSuggestion,
} from '../../lib/addressSuggestions';
import { formatZar } from '../../lib/currency';
import { TactilePressable } from '../../components/shared/TactilePressable';
import { EmptyState } from '../../components/shared/EmptyState';
import { FadeSlideIn } from '../../components/shared/FadeSlideIn';
import { CrashCascadeIn } from '../../components/shared/CrashCascadeIn';
import { haptic } from '../../lib/haptics';
import { copy, formatString } from '../../lib/strings';
import { queryClient, queryKeys } from '../../lib/queryKeys';
import { useToast } from '../../components/shared/GlassToast';
import {
  MIN_ORDER_CENTS,
  EST_DELIVERY_FEE_CENTS,
  FREE_DELIVERY_THRESHOLD_CENTS,
  VALIDATION_DEBOUNCE_MS,
} from '../../lib/constants';
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
  const topInset = useTopSafeArea(semanticSpacing.sm);

  const [address, setAddress] = useState('');
  const [selectedSuggestionCoords, setSelectedSuggestionCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [notes, setNotes] = useState('');
  const [paymentMethod] = useState<PaymentMethod>('cash_on_delivery');
  const [usedFallbackLocation, setUsedFallbackLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fulfillmentStore, setFulfillmentStore] = useState<FulfillmentStoreInfo | null>(null);
  const [fulfillmentError, setFulfillmentError] = useState<string | null>(null);
  const [validatingFulfillment, setValidatingFulfillment] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const deliveryFeeCents = subtotal >= FREE_DELIVERY_THRESHOLD_CENTS ? 0 : EST_DELIVERY_FEE_CENTS;
  const deliveryProgress = subtotal > 0 ? Math.min(subtotal / FREE_DELIVERY_THRESHOLD_CENTS, 1) : 0;
  const total = subtotal + deliveryFeeCents;
  const addressSuggestions: AddressSuggestion[] = showSuggestions ? searchAddressSuggestions(address, 5) : [];
  const selectedStore = stores.find((x) => x.id === selectedStoreId) ?? null;
  const isPickup = fulfilment === 'pickup';
  const usingSavedAddress = !isPickup && selectedAddressId !== 'new' && savedAddresses.some((a) => a.id === selectedAddressId);
  const activeSavedAddress = usingSavedAddress ? savedAddresses.find((a) => a.id === selectedAddressId) ?? null : null;
  const effectiveAddressForValidation = activeSavedAddress?.address ?? address;
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
          let coords: { latitude: number; longitude: number } | undefined;
          if (usingSavedAddress) {
            const saved = savedAddresses.find((a) => a.id === selectedAddressId);
            if (saved) coords = { latitude: Number(saved.latitude), longitude: Number(saved.longitude) };
          } else if (selectedSuggestionCoords) {
            coords = selectedSuggestionCoords;
          }
          if (!coords) {
            const gps = await getDeliveryCoords();
            if (gps.usedFallback && address.trim().length > 0) {
              coords = resolveAddressCoordinates(address);
            } else {
              coords = { latitude: gps.latitude, longitude: gps.longitude };
            }
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
  }, [items, address, selectedSuggestionCoords, fulfilment, usingSavedAddress, savedAddresses, selectedAddressId]);

  const submit = async () => {
    if (!canSubmitOrder) {
      haptic.warning();
      setError('Please complete all fields and ensure fulfillment is valid before placing your order.');
      return;
    }
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
          let finalLat: number;
          let finalLng: number;
          if (selectedSuggestionCoords) {
            finalLat = selectedSuggestionCoords.latitude;
            finalLng = selectedSuggestionCoords.longitude;
            setUsedFallbackLocation(false);
          } else {
            const coords = await getDeliveryCoords();
            setUsedFallbackLocation(coords.usedFallback);
            if (coords.usedFallback && address.trim().length > 0) {
              const resolved = resolveAddressCoordinates(address);
              finalLat = resolved.latitude;
              finalLng = resolved.longitude;
            } else {
              finalLat = coords.latitude;
              finalLng = coords.longitude;
            }
          }
          res = await placeOrder({
            items: items.map((i) => ({ product_id: Number(i.productId), quantity: i.quantity })),
            fulfilment_method: 'delivery',
            delivery_address: address.trim(),
            delivery_latitude: finalLat,
            delivery_longitude: finalLng,
            delivery_notes: notes.trim() || undefined,
            payment_method: paymentMethod,
          });
        }
      }
      const shouldClear = res.dispatch?.status !== 'retrying' && res.dispatch?.status !== 'cancelled';
      if (shouldClear) clearCart();
      else toast.show('No riders available right now — your cart is kept so you can retry.');
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
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text style={{ color: theme.colors.text.secondary, fontSize: 13 }}>{label}</Text>
      <Text style={{ fontWeight: strong ? fontWeight.bold : fontWeight.semibold, color: theme.colors.text.primary, fontSize: strong ? 15 : 13, letterSpacing: strong ? -0.2 : 0 }}>{value}</Text>
    </View>
  );

  if (items.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background.primary, paddingTop: topInset }}>
        <FadeSlideIn delay={60} distance={12}>
          <Text style={{ paddingHorizontal: semanticSpacing.screenPadding, fontSize: 28, fontWeight: '800', letterSpacing: -0.5, color: theme.colors.text.primary }}>{copy.checkout.title}</Text>
        </FadeSlideIn>
        <EmptyState icon={Store} title="Nothing to check out" caption="Your cart is empty." />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.colors.background.primary }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ paddingBottom: 160 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <FadeSlideIn delay={60} distance={12}>
          <View style={{ paddingTop: topInset, paddingHorizontal: semanticSpacing.screenPadding, paddingBottom: 12 }}>
            <Text style={{ fontSize: 28, fontWeight: '800', letterSpacing: -0.5, color: theme.colors.text.primary }}>{copy.checkout.title}</Text>
          </View>
        </FadeSlideIn>

        <View style={{ paddingHorizontal: semanticSpacing.screenPadding, gap: 14 }}>
          <FadeSlideIn delay={100} distance={10}>
            <View style={{ flexDirection: 'row', backgroundColor: theme.colors.surface.elevated, borderRadius: 999, padding: 3, gap: 3, borderWidth: 1, borderColor: theme.colors.border.subtle }}>
              {([
                { key: 'delivery', label: 'Deliver', icon: MapPin },
                { key: 'pickup', label: 'Pickup', icon: ShoppingBag },
              ] as const).map((opt) => {
                const active = fulfilment === opt.key;
                const Icon = opt.icon;
                return (
                  <TactilePressable
                    key={opt.key}
                    onPress={() => {
                      haptic.selection();
                      setFulfilment(opt.key);
                    }}
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      paddingVertical: 10,
                      borderRadius: 999,
                      backgroundColor: active ? theme.colors.surface.primary : 'transparent',
                      borderWidth: 1,
                      borderColor: active ? theme.colors.border.subtle : 'transparent',
                      shadowColor: active ? '#000' : 'transparent',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: active ? 0.06 : 0,
                      shadowRadius: 3,
                    }}
                  >
                    <Icon size={14} color={active ? brand.orange : theme.colors.text.secondary} strokeWidth={active ? 2.2 : 1.8} />
                    <Text style={{ fontWeight: active ? fontWeight.bold : fontWeight.semibold, fontSize: 12, letterSpacing: 0.2, color: active ? theme.colors.text.primary : theme.colors.text.secondary }}>{opt.label}</Text>
                  </TactilePressable>
                );
              })}
            </View>
          </FadeSlideIn>

          {isPickup && (
            <FadeSlideIn delay={140} distance={10}>
              <View style={{ backgroundColor: theme.colors.surface.primary, borderRadius: semanticRadius.card, padding: 14, gap: 10, borderWidth: 1, borderColor: theme.colors.border.subtle, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 }}>
                <Text style={{ fontWeight: fontWeight.bold, color: theme.colors.text.primary, letterSpacing: -0.2, fontSize: 13 }}>Collect from</Text>
                {stores.length === 0 ? (
                  <Text style={{ color: theme.colors.text.secondary, fontSize: 12, lineHeight: 16 }}>No stores are open for collection right now — please try delivery.</Text>
                ) : (
                  stores.map((storeOpt, idx) => {
                    const active = storeOpt.id === selectedStoreId;
                    return (
                      <CrashCascadeIn key={storeOpt.id} index={idx}>
                        <TactilePressable
                          onPress={() => {
                            haptic.selection();
                            setSelectedStoreId(storeOpt.id);
                          }}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 10,
                            padding: 12,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: active ? brand.orange : theme.colors.border.subtle,
                            backgroundColor: active ? brand.orange + '08' : theme.colors.surface.primary,
                          }}
                        >
                          {active ? <CheckCircle2 size={16} color={brand.orange} strokeWidth={2.2} /> : <Store size={16} color={theme.colors.text.secondary} />}
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontWeight: fontWeight.semibold, color: theme.colors.text.primary, fontSize: 13, letterSpacing: -0.1 }}>{storeOpt.name}</Text>
                            <Text style={{ color: theme.colors.text.secondary, fontSize: 11, marginTop: 2 }}>{storeOpt.address}</Text>
                          </View>
                        </TactilePressable>
                      </CrashCascadeIn>
                    );
                  })
                )}
                <Text style={{ color: theme.colors.text.tertiary, fontSize: 10, lineHeight: 13 }}>We&apos;ll pack your order ready for collection — no delivery fee.</Text>
              </View>
            </FadeSlideIn>
          )}

          {validatingFulfillment && (
            <FadeSlideIn delay={160} distance={8}>
              <View style={{ backgroundColor: theme.colors.surface.primary, borderRadius: semanticRadius.card, padding: 14, gap: 6, borderWidth: 1, borderColor: theme.colors.border.subtle }}>
                <Text style={{ fontWeight: fontWeight.bold, color: theme.colors.text.primary, fontSize: 13 }}>Finding best store...</Text>
                <Text style={{ color: theme.colors.text.secondary, fontSize: 12 }}>Checking which store can fulfill your order</Text>
              </View>
            </FadeSlideIn>
          )}

          {fulfillmentError && (
            <FadeSlideIn delay={160} distance={8}>
              <View style={{ backgroundColor: '#FEF2F2', borderRadius: semanticRadius.card, padding: 14, gap: 8, borderWidth: 1, borderColor: '#FECACA' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={16} color="#DC2626" />
                  <Text style={{ color: '#DC2626', fontWeight: '600', fontSize: 12 }}>Cannot fulfill order</Text>
                </View>
                <Text style={{ color: '#991B1B', fontSize: 12, lineHeight: 16 }}>{fulfillmentError}</Text>
              </View>
            </FadeSlideIn>
          )}

          {fulfillmentStore && !fulfillmentError && (
            <FadeSlideIn delay={160} distance={8}>
              <View style={{ backgroundColor: theme.colors.surface.primary, borderRadius: semanticRadius.card, padding: 14, gap: 8, borderWidth: 1, borderColor: theme.colors.border.subtle, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: brand.orange + '15', alignItems: 'center', justifyContent: 'center' }}>
                    <MapPin size={12} color={brand.orange} strokeWidth={2.2} />
                  </View>
                  <Text style={{ color: theme.colors.text.secondary, fontSize: 12, flex: 1, lineHeight: 16 }}>
                    Fulfilled from <Text style={{ fontWeight: '700', color: theme.colors.text.primary }}>{fulfillmentStore.name}</Text>
                  </Text>
                </View>
              </View>
            </FadeSlideIn>
          )}

          {!isPickup && savedAddresses.length > 0 && (
            <FadeSlideIn delay={180} distance={10}>
              <View style={{ backgroundColor: theme.colors.surface.primary, borderRadius: semanticRadius.card, padding: 14, gap: 10, borderWidth: 1, borderColor: theme.colors.border.subtle }}>
                <Text style={{ fontWeight: fontWeight.bold, color: theme.colors.text.primary, fontSize: 13, letterSpacing: -0.2 }}>Deliver to</Text>
                {savedAddresses.map((savedOpt, idx) => {
                  const active = selectedAddressId === savedOpt.id;
                  return (
                    <CrashCascadeIn key={savedOpt.id} index={idx}>
                      <TactilePressable
                        onPress={() => {
                          haptic.selection();
                          setSelectedAddressId(savedOpt.id);
                        }}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 10,
                          padding: 12,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: active ? brand.orange : theme.colors.border.subtle,
                          backgroundColor: active ? brand.orange + '08' : 'transparent',
                        }}
                      >
                        {active ? <CheckCircle2 size={16} color={brand.orange} /> : <MapPin size={16} color={theme.colors.text.secondary} />}
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: '600', color: theme.colors.text.primary, fontSize: 12 }}>{savedOpt.label}{savedOpt.is_default ? ' · Default' : ''}</Text>
                          <Text numberOfLines={1} style={{ color: theme.colors.text.secondary, fontSize: 11, marginTop: 2 }}>{savedOpt.address}</Text>
                        </View>
                      </TactilePressable>
                    </CrashCascadeIn>
                  );
                })}
                <TactilePressable
                  onPress={() => {
                    haptic.selection();
                    setSelectedAddressId('new');
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    padding: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: selectedAddressId === 'new' ? brand.orange : theme.colors.border.subtle,
                  }}
                >
                  <MapPin size={16} color={selectedAddressId === 'new' ? brand.orange : theme.colors.text.secondary} />
                  <Text style={{ fontWeight: '600', color: theme.colors.text.primary, fontSize: 12 }}>Enter a new address</Text>
                </TactilePressable>
              </View>
            </FadeSlideIn>
          )}

          <FadeSlideIn delay={200} distance={8} style={{ display: isPickup || usingSavedAddress ? 'none' : 'flex' } as any}>
            <View style={{ gap: 8 }}>
              <Text style={{ fontWeight: '600', color: theme.colors.text.primary, fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' }}>{copy.checkout.deliveryAddress}</Text>
              <TextInput
                value={address}
                onChangeText={(val) => {
                  setAddress(val);
                  setSelectedSuggestionCoords(null);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder={copy.checkout.deliveryAddressPlaceholder}
                placeholderTextColor={theme.colors.text.tertiary}
                multiline
                style={{
                  backgroundColor: theme.colors.surface.primary,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  color: theme.colors.text.primary,
                  fontSize: 13,
                  minHeight: 56,
                  borderWidth: 1,
                  borderColor: theme.colors.border.subtle,
                  textAlignVertical: 'top',
                }}
              />
              {showSuggestions && addressSuggestions.length > 0 && (
                <View
                  style={{
                    backgroundColor: theme.colors.surface.primary,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: theme.colors.border.subtle,
                    overflow: 'hidden',
                  }}
                >
                  <Text
                    style={{
                      paddingHorizontal: 12,
                      paddingTop: 8,
                      paddingBottom: 4,
                      fontSize: 10,
                      fontWeight: '700',
                      color: theme.colors.text.tertiary,
                      letterSpacing: 0.4,
                      textTransform: 'uppercase',
                    }}
                  >
                    Suggested Durban Delivery Addresses
                  </Text>
                  {addressSuggestions.map((suggestion) => (
                    <TactilePressable
                      key={suggestion.id}
                      onPress={() => {
                        haptic.selection();
                        setAddress(suggestion.address);
                        setSelectedSuggestionCoords({
                          latitude: suggestion.latitude,
                          longitude: suggestion.longitude,
                        });
                        setUsedFallbackLocation(false);
                        setShowSuggestions(false);
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderTopWidth: 1,
                        borderTopColor: theme.colors.border.subtle,
                      }}
                    >
                      <MapPin size={14} color={brand.orange} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.text.primary }}>
                          {suggestion.label}
                        </Text>
                        <Text style={{ fontSize: 11, color: theme.colors.text.secondary }} numberOfLines={1}>
                          {suggestion.address}
                        </Text>
                      </View>
                    </TactilePressable>
                  ))}
                </View>
              )}
            </View>
          </FadeSlideIn>

          <FadeSlideIn delay={220} distance={8}>
            <View style={{ gap: 8 }}>
              <Text style={{ fontWeight: '600', color: theme.colors.text.primary, fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' }}>{copy.checkout.deliveryNotes}</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder={copy.checkout.deliveryNotesPlaceholder}
                placeholderTextColor={theme.colors.text.tertiary}
                multiline
                style={{
                  backgroundColor: theme.colors.surface.primary,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  color: theme.colors.text.primary,
                  fontSize: 13,
                  minHeight: 56,
                  borderWidth: 1,
                  borderColor: theme.colors.border.subtle,
                  textAlignVertical: 'top',
                }}
              />
              {usedFallbackLocation ? <Text style={{ color: theme.colors.text.tertiary, fontSize: 10, lineHeight: 13 }}>{copy.checkout.locationFallback}</Text> : null}
            </View>
          </FadeSlideIn>

          <FadeSlideIn delay={240} distance={8}>
            <View style={{ gap: 8 }}>
              <Text style={{ fontWeight: '600', color: theme.colors.text.primary, fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' }}>{copy.checkout.paymentMethod}</Text>
              <View style={{ backgroundColor: theme.colors.surface.primary, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: brand.orange, shadowColor: brand.orange, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 }}>
                <CheckCircle2 size={18} color={brand.orange} strokeWidth={2.2} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontWeight: '600', color: theme.colors.text.primary, fontSize: 13 }}>{copy.checkout.cashOnDelivery}</Text>
                  <Text style={{ color: theme.colors.text.secondary, fontSize: 11 }}>{copy.checkout.cashOnDeliveryNote}</Text>
                </View>
              </View>
            </View>
          </FadeSlideIn>

          <FadeSlideIn delay={260} distance={10}>
            <View style={{ backgroundColor: theme.colors.surface.primary, borderRadius: semanticRadius.card, padding: 14, gap: 10, borderWidth: 1, borderColor: theme.colors.border.subtle }}>
              <Text style={{ fontWeight: '700', color: theme.colors.text.primary, fontSize: 13, letterSpacing: -0.2 }}>{copy.checkout.summary}</Text>
              {row(`${cartRules.totalQuantity(items)} items`, formatZar(subtotal))}
              {isPickup
                ? row('Pickup', 'Free')
                : row(
                    copy.checkout.estimatedDelivery,
                    deliveryFeeCents === 0 ? 'Free' : formatZar(deliveryFeeCents),
                  )}
              {!isPickup && subtotal > 0 && (
                <View style={{ gap: 4, paddingTop: 2 }}>
                  <View style={{ height: 4, borderRadius: 2, backgroundColor: theme.colors.border.subtle, overflow: 'hidden' }}>
                    <View
                      style={{
                        width: `${deliveryProgress * 100}%`,
                        height: '100%',
                        backgroundColor: deliveryProgress >= 1 ? brand.success : brand.orange,
                        borderRadius: 2,
                      }}
                    />
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: theme.colors.text.tertiary, fontSize: 11 }}>
                      {deliveryProgress >= 1
                        ? '🎉 Free delivery unlocked!'
                        : `Add ${formatZar(Math.max(0, FREE_DELIVERY_THRESHOLD_CENTS - subtotal))} for free delivery`}
                    </Text>
                    <Text style={{ color: theme.colors.text.tertiary, fontSize: 11 }}>
                      {formatZar(subtotal)} / {formatZar(FREE_DELIVERY_THRESHOLD_CENTS)}
                    </Text>
                  </View>
                </View>
              )}
              <View style={{ height: 1, backgroundColor: theme.colors.border.subtle, marginVertical: 2 }} />
              {row(copy.checkout.total, formatZar(isPickup ? subtotal : total), true)}
            </View>
          </FadeSlideIn>

          {status !== 'authenticated' && (
            <FadeSlideIn delay={280} distance={8}>
              <View style={{ backgroundColor: theme.colors.surface.primary, borderRadius: semanticRadius.card, padding: 14, gap: 10, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border.subtle }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.surface.elevated, alignItems: 'center', justifyContent: 'center' }}>
                  <Lock size={16} color={theme.colors.text.secondary} />
                </View>
                <Text style={{ color: theme.colors.text.secondary, fontSize: 12, textAlign: 'center', lineHeight: 16 }}>{copy.checkout.signInPrompt}</Text>
                <TactilePressable onPress={() => navigation.navigate('Auth', { intent: 'checkout' } as any)} haptic="commit" style={{ backgroundColor: theme.colors.text.primary, borderRadius: 999, alignSelf: 'stretch', paddingVertical: 12, alignItems: 'center' }}>
                  <Text style={{ color: theme.colors.text.inverse, fontWeight: '700', fontSize: 12, letterSpacing: 0.3, textTransform: 'uppercase' }}>{copy.checkout.signInToContinue}</Text>
                </TactilePressable>
              </View>
            </FadeSlideIn>
          )}

          {error != null && (
            <FadeSlideIn delay={0} distance={6}>
              <View style={{ backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#FECACA' }}>
                <Text style={{ color: '#DC2626', fontSize: 12, lineHeight: 16 }}>{error}</Text>
              </View>
            </FadeSlideIn>
          )}
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: semanticSpacing.screenPadding, borderTopWidth: 1, borderTopColor: theme.colors.border.subtle, backgroundColor: theme.colors.background.primary, gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 8 }}>
        <TactilePressable
          onPress={submit}
          haptic="commit"
          disabled={!canSubmitOrder}
          style={{
            backgroundColor: canSubmitOrder ? theme.colors.text.primary : theme.colors.surface.elevated,
            borderRadius: 999,
            paddingVertical: 14,
            opacity: canSubmitOrder ? 1 : 0.6,
            shadowColor: canSubmitOrder ? '#000' : 'transparent',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: canSubmitOrder ? 3 : 0,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: canSubmitOrder ? theme.colors.text.inverse : theme.colors.text.secondary, fontWeight: '700', fontSize: 12, letterSpacing: 0.3, textTransform: 'uppercase' }}>
            {submitting ? copy.checkout.placingOrder : `${copy.checkout.placeOrder} · ${formatZar(isPickup ? subtotal : total)}`}
          </Text>
        </TactilePressable>
        {subtotal < MIN_ORDER_CENTS && (
          <Text style={{ textAlign: 'center', color: '#DC2626', fontSize: 10, lineHeight: 12 }}>{formatString(copy.cart.minOrder, { minCents: formatZar(MIN_ORDER_CENTS) })}</Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
