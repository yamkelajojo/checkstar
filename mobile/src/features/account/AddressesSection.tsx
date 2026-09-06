import { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList } from 'react-native';
import { MapPin, Plus, Star, Trash2, LocateFixed } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { textStyle, fontWeight } from '../../theme/typography';
import { semanticSpacing, semanticRadius } from '../../theme/spacing';
import { TactilePressable } from '../../components/shared/TactilePressable';
import { SkeletonCard } from '../../components/shared/SkeletonCard';
import { haptic } from '../../lib/haptics';
import { getDeliveryCoords } from '../../lib/deliveryCoords';
import {
  fetchAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from '../../lib/apiClient';
import type { ApiUserAddress } from '../../lib/types';

/**
 * Address book — saved delivery addresses for checkout to prompt with.
 * One default is kept server-side; deleting it promotes the oldest
 * remaining address.
 */
export function AddressesSection() {
  const theme = useTheme();
  const [addresses, setAddresses] = useState<ApiUserAddress[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState('');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(() => {
    void fetchAddresses()
      .then(setAddresses)
      .catch(() => setAddresses([]));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const useMyLocation = async () => {
    setLocating(true);
    setError(null);
    try {
      const fix = await getDeliveryCoords();
      setCoords({ latitude: fix.latitude, longitude: fix.longitude });
      haptic.selection();
    } catch {
      setError('Could not get your location — enter coordinates manually below.');
    } finally {
      setLocating(false);
    }
  };

  const save = async () => {
    if (!address.trim()) {
      setError('Please enter the street address.');
      haptic.warning();
      return;
    }
    let latitude = coords?.latitude;
    let longitude = coords?.longitude;
    if (latitude == null || longitude == null) {
      try {
        const fix = await getDeliveryCoords();
        latitude = fix.latitude;
        longitude = fix.longitude;
      } catch {
        setError('Pin the location first (use my current location).');
        haptic.warning();
        return;
      }
    }
    setSaving(true);
    setError(null);
    try {
      await createAddress({
        label: label.trim() || 'Home',
        address: address.trim(),
        latitude,
        longitude,
        is_default: (addresses?.length ?? 0) === 0,
      });
      haptic.success();
      setAdding(false);
      setLabel('');
      setAddress('');
      setCoords(null);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the address.');
      haptic.warning();
    } finally {
      setSaving(false);
    }
  };

  const makeDefault = async (id: number) => {
    try {
      await updateAddress(id, { is_default: true });
      haptic.selection();
      refresh();
    } catch {
      haptic.warning();
    }
  };

  const remove = async (id: number) => {
    try {
      await deleteAddress(id);
      haptic.tap();
      refresh();
    } catch {
      haptic.warning();
    }
  };

  if (addresses === null) {
    return (
      <View style={{ paddingHorizontal: semanticSpacing.screenPadding, paddingBottom: semanticSpacing.md }}>
        <SkeletonCard width="100%" height={72} />
      </View>
    );
  }

  return (
    <View style={{ paddingHorizontal: semanticSpacing.screenPadding, paddingBottom: semanticSpacing.md, gap: semanticSpacing.xs }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ ...textStyle.h3, fontWeight: fontWeight.bold, color: theme.colors.text.primary }}>
          Saved Addresses
        </Text>
        <TactilePressable
          onPress={() => {
            haptic.tap();
            setAdding((v) => !v);
          }}
          haptic="tap"
          accessibilityRole="button"
          accessibilityLabel={adding ? 'Close add address form' : 'Add address'}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingVertical: semanticSpacing.xs,
            paddingHorizontal: semanticSpacing.sm,
            borderRadius: semanticRadius.buttonPill,
            backgroundColor: theme.colors.surface.primary,
            borderWidth: 1,
            borderColor: theme.colors.border.subtle,
          }}
        >
          <Plus size={14} color={brand.primary} />
          <Text style={{ color: brand.primary, fontWeight: fontWeight.semibold, fontSize: textStyle.caption.size }}>
            {adding ? 'Close' : 'Add'}
          </Text>
        </TactilePressable>
      </View>

      {addresses.length === 0 && !adding && (
        <Text style={{ ...textStyle.body, color: theme.colors.text.secondary }}>
          No saved addresses yet. Add one so checkout can offer it when you choose delivery.
        </Text>
      )}

      {addresses.map((item) => (
        <View
          key={item.id}
          style={{
            backgroundColor: theme.colors.surface.primary,
            borderRadius: semanticRadius.card,
            padding: semanticSpacing.md,
            flexDirection: 'row',
            alignItems: 'center',
            gap: semanticSpacing.inlineGap,
            borderWidth: 1,
            borderColor: item.is_default ? brand.primary : theme.colors.border.subtle,
          }}
        >
          <MapPin size={18} color={item.is_default ? brand.primary : theme.colors.text.secondary} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: fontWeight.semibold, color: theme.colors.text.primary, ...textStyle.body }}>
              {item.label}
              {item.is_default ? ' · Default' : ''}
            </Text>
            <Text numberOfLines={1} style={{ ...textStyle.caption, color: theme.colors.text.secondary }}>
              {item.address}
            </Text>
          </View>
          {!item.is_default && (
            <TactilePressable
              onPress={() => void makeDefault(item.id)}
              haptic="selection"
              accessibilityRole="button"
              accessibilityLabel={`Make ${item.label} the default address`}
              style={{ padding: semanticSpacing.xs }}
            >
              <Star size={16} color={theme.colors.text.tertiary} />
            </TactilePressable>
          )}
          <TactilePressable
            onPress={() => void remove(item.id)}
            haptic="tap"
            accessibilityRole="button"
            accessibilityLabel={`Delete ${item.label}`}
            style={{ padding: semanticSpacing.xs }}
          >
            <Trash2 size={16} color={theme.colors.status.error.strong} />
          </TactilePressable>
        </View>
      ))}

      {adding && (
        <View
          style={{
            backgroundColor: theme.colors.surface.primary,
            borderRadius: semanticRadius.card,
            padding: semanticSpacing.md,
            gap: semanticSpacing.xs,
            borderWidth: 1,
            borderColor: theme.colors.border.subtle,
          }}
        >
          <TextInput
            value={label}
            onChangeText={setLabel}
            placeholder="Label (e.g. Home, Work)"
            placeholderTextColor={theme.colors.text.tertiary}
            maxLength={50}
            style={{
              backgroundColor: theme.colors.surface.sunken,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 10,
              color: theme.colors.text.primary,
              fontSize: textStyle.body.size,
            }}
          />
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="Street address"
            placeholderTextColor={theme.colors.text.tertiary}
            multiline
            style={{
              backgroundColor: theme.colors.surface.sunken,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 10,
              color: theme.colors.text.primary,
              fontSize: textStyle.body.size,
              minHeight: 60,
              textAlignVertical: 'top',
            }}
          />
          <TactilePressable
            onPress={() => void useMyLocation()}
            haptic="tap"
            accessibilityRole="button"
            accessibilityLabel="Use my current location"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              alignSelf: 'flex-start',
              paddingVertical: 6,
              paddingHorizontal: 10,
              borderRadius: semanticRadius.smallControl,
              borderWidth: 1,
              borderColor: theme.colors.border.subtle,
            }}
          >
            <LocateFixed size={14} color={locating ? theme.colors.text.tertiary : brand.primary} />
            <Text style={{ color: brand.primary, fontWeight: fontWeight.semibold, fontSize: textStyle.caption.size }}>
              {locating ? 'Locating…' : coords ? `Pinned ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}` : 'Use my current location'}
            </Text>
          </TactilePressable>
          {error != null && (
            <Text style={{ ...textStyle.caption, color: theme.colors.status.error.strong }}>{error}</Text>
          )}
          <TactilePressable
            onPress={() => void save()}
            haptic="commit"
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Save address"
            style={{ backgroundColor: brand.primary, borderRadius: semanticRadius.buttonPill, opacity: saving ? 0.6 : 1 }}
          >
            <Text style={{ color: '#fff', textAlign: 'center', fontWeight: fontWeight.bold, paddingVertical: 10 }}>
              {saving ? 'Saving…' : 'Save Address'}
            </Text>
          </TactilePressable>
        </View>
      )}
    </View>
  );
}
