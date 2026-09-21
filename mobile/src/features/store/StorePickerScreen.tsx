import { View, Text, FlatList } from 'react-native';
import { Store } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { textStyle, fontWeight } from '../../theme/typography';
import { semanticSpacing, semanticRadius } from '../../theme/spacing';
import { useDeliveryStore } from '../../stores/deliveryStore';
import { TactilePressable } from '../../components/shared/TactilePressable';
import { EmptyState } from '../../components/shared/EmptyState';
import { FadeSlideIn } from '../../components/shared/FadeSlideIn';
import { CrashCascadeIn } from '../../components/shared/CrashCascadeIn';
import { haptic } from '../../lib/haptics';
import { useTopSafeArea } from '../../components/shared/ScreenHeader';

export function StorePickerScreen() {
  const theme = useTheme();
  const topInset = useTopSafeArea();
  const navigation = useNavigation();
  const stores = useDeliveryStore((s) => s.stores);
  const fulfillmentStore = useDeliveryStore((s) => s.fulfillmentStore);
  const setFulfillmentStore = useDeliveryStore((s) => s.setFulfillmentStore);
  const loadStores = useDeliveryStore((s) => s.loadStores);

  const handleSelect = (store: (typeof stores)[number]) => {
    haptic.success();
    setFulfillmentStore(store);
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.primary, paddingTop: topInset }}>
      <FadeSlideIn delay={60} distance={12}>
        <View style={{ paddingHorizontal: semanticSpacing.screenPadding, gap: 6 }}>
          <Text style={{ ...textStyle.h1, color: theme.colors.text.primary, letterSpacing: -0.4, fontWeight: fontWeight.bold }}>Checkstar Stores</Text>
          <Text style={{ color: theme.colors.text.secondary, fontSize: 13, lineHeight: 18 }}>Delivery orders are automatically fulfilled from the nearest store that has all your items in stock.</Text>
        </View>
      </FadeSlideIn>

      {stores.length === 0 ? (
        <FadeSlideIn delay={120} distance={12}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: semanticSpacing.screenPadding, marginTop: 40 }}>
            <EmptyState icon={Store} title="No stores yet" caption="Check back soon — stores are being onboarded." />
            <TactilePressable onPress={() => void loadStores()} haptic="selection" style={{ marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: theme.colors.surface.primary, borderRadius: 999, borderWidth: 1, borderColor: theme.colors.border.subtle }}>
              <Text style={{ color: theme.colors.text.primary, fontWeight: '600', fontSize: 12 }}>Retry</Text>
            </TactilePressable>
          </View>
        </FadeSlideIn>
      ) : (
        <FlatList
          data={stores}
          keyExtractor={(s) => String(s.id)}
          contentContainerStyle={{ padding: semanticSpacing.screenPadding, gap: 10, paddingTop: 16, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const isFulfillmentStore = fulfillmentStore?.id === item.id;
            return (
              <CrashCascadeIn index={index}>
                <TactilePressable
                  onPress={() => handleSelect(item)}
                  haptic="selection"
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    backgroundColor: theme.colors.surface.primary,
                    borderRadius: semanticRadius.card,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: isFulfillmentStore ? brand.orange : theme.colors.border.subtle,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isFulfillmentStore ? 0.06 : 0.03,
                    shadowRadius: 8,
                    elevation: 1,
                  }}
                >
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: isFulfillmentStore ? brand.orange + '15' : theme.colors.surface.elevated, borderWidth: 1, borderColor: isFulfillmentStore ? brand.orange + '20' : theme.colors.border.subtle, alignItems: 'center', justifyContent: 'center' }}>
                    <Store size={18} color={isFulfillmentStore ? brand.orange : theme.colors.text.secondary} strokeWidth={2} />
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={{ fontWeight: '700', color: theme.colors.text.primary, fontSize: 13, letterSpacing: -0.2 }}>{item.name}</Text>
                    <Text style={{ fontSize: 11, color: theme.colors.text.secondary, lineHeight: 14 }}>{item.address ?? 'Address coming soon'} · {item.delivery_radius_km} km radius</Text>
                  </View>
                  {isFulfillmentStore ? (
                    <View style={{ backgroundColor: brand.orange, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, shadowColor: brand.orange, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 }}>
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 10, letterSpacing: 0.3, textTransform: 'uppercase' }}>Selected</Text>
                    </View>
                  ) : null}
                </TactilePressable>
              </CrashCascadeIn>
            );
          }}
        />
      )}
    </View>
  );
}
