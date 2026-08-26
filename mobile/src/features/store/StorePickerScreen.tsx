import { View, Text, FlatList } from 'react-native';
import { Store, Check } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { typeScale, weights } from '../../theme/typography';
import { useDeliveryStore } from '../../stores/deliveryStore';
import { TactilePressable } from '../../components/shared/TactilePressable';
import { EmptyState } from '../../components/shared/EmptyState';

export function StorePickerScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const stores = useDeliveryStore((s) => s.stores);
  const selected = useDeliveryStore((s) => s.store);
  const chooseStore = useDeliveryStore((s) => s.chooseStore);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg, paddingTop: 56 }}>
      <Text style={{ paddingHorizontal: 16, fontSize: typeScale.title, fontWeight: weights.extrabold, color: theme.colors.text }}>
        Choose your store
      </Text>
      <Text style={{ paddingHorizontal: 16, marginTop: 4, color: theme.colors.textMuted, fontSize: typeScale.body }}>
        Delivery orders are fulfilled by the closest Checkstar store.
      </Text>

      {stores.length === 0 ? (
        <EmptyState icon={Store} title="No stores yet" caption="Check back soon — stores are being onboarded." />
      ) : (
        <FlatList
          data={stores}
          keyExtractor={(s) => String(s.id)}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => {
            const active = selected?.id === item.id;
            return (
              <TactilePressable
                onPress={() => {
                  void chooseStore(item, 'pick');
                  navigation.goBack();
                }}
                haptic="selection"
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  backgroundColor: theme.colors.surface,
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: active ? brand.primary : 'transparent',
                }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: theme.name === 'dark' ? theme.colors.surfaceElevated : '#ffffff', alignItems: 'center', justifyContent: 'center' }}>
                  <Store size={20} color={brand.primary} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontWeight: weights.bold, color: theme.colors.text }}>{item.name}</Text>
                  <Text style={{ fontSize: typeScale.caption, color: theme.colors.textMuted }}>
                    {item.address ?? 'Address coming soon'} · {item.delivery_radius_km} km radius
                  </Text>
                </View>
                {active && <Check size={20} color={brand.primary} />}
              </TactilePressable>
            );
          }}
        />
      )}
    </View>
  );
}
