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
import { haptic } from '../../lib/haptics';
import { ModalHeader } from '../../components/shared/ScreenHeader';

export function StorePickerScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const stores = useDeliveryStore((s) => s.stores);
  const fulfillmentStore = useDeliveryStore((s) => s.fulfillmentStore);
  const setFulfillmentStore = useDeliveryStore((s) => s.setFulfillmentStore);
  const loadStores = useDeliveryStore((s) => s.loadStores);

  const handleSelect = (store: typeof stores[number]) => {
    haptic.selection();
    setFulfillmentStore(store);
    navigation.goBack();
  };

  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      <ModalHeader title="Checkstar Stores" onClose={handleClose} />
      <Text style={{ paddingHorizontal: semanticSpacing.screenPadding, marginTop: semanticSpacing.xs, color: theme.colors.text.secondary, ...textStyle.body }}>
        Delivery orders are automatically fulfilled from the nearest store that has all your items in stock.
      </Text>

      {stores.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: semanticSpacing.screenPadding }}>
          <EmptyState icon={Store} title="No stores yet" caption="Check back soon — stores are being onboarded." />
          <TactilePressable
            onPress={() => void loadStores()}
            haptic="selection"
            style={{ marginTop: semanticSpacing.md, paddingHorizontal: semanticSpacing.md, paddingVertical: semanticSpacing.sm, backgroundColor: theme.colors.surface.primary, borderRadius: semanticRadius.buttonPill }}
          >
            <Text style={{ color: theme.colors.text.primary, fontWeight: fontWeight.semibold, ...textStyle.caption }}>Retry</Text>
          </TactilePressable>
        </View>
      ) : (
        <FlatList
          data={stores}
          keyExtractor={(s) => String(s.id)}
          contentContainerStyle={{ padding: semanticSpacing.screenPadding, gap: semanticSpacing.inlineGap }}
          renderItem={({ item }) => {
            const isFulfillmentStore = fulfillmentStore?.id === item.id;
            return (
              <TactilePressable
                onPress={() => handleSelect(item)}
                haptic="selection"
                accessibilityRole="button"
                accessibilityState={{ selected: isFulfillmentStore }}
                accessibilityLabel={`Select ${item.name} as delivery store`}
                variant="card"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: semanticSpacing.inlineGap,
                  backgroundColor: theme.colors.surface.primary,
                  borderRadius: semanticRadius.card,
                  padding: semanticSpacing.md,
                  borderWidth: 1,
                  borderColor: isFulfillmentStore ? brand.orange : theme.colors.border.subtle,
                }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.surface.elevated, alignItems: 'center', justifyContent: 'center' }}>
                  <Store size={20} color={brand.orange} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontWeight: fontWeight.bold, color: theme.colors.text.primary }}>{item.name}</Text>
                  <Text style={{ ...textStyle.caption, color: theme.colors.text.secondary }}>
                    {item.address ?? 'Address coming soon'} · {item.delivery_radius_km} km radius
                  </Text>
                </View>
                {isFulfillmentStore && (
                  <View style={{ backgroundColor: brand.orangeSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text style={{ color: brand.orangeDeep, fontWeight: fontWeight.bold, fontSize: 12 }}>Selected</Text>
                  </View>
                )}
              </TactilePressable>
            );
          }}
        />
      )}
    </View>
  );
}
