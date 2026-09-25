import { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { MapPin, Plus, Star, Trash2, LocateFixed } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { textStyle, fontWeight } from '../../theme/typography';
import { semanticSpacing, semanticRadius } from '../../theme/spacing';
import { TactilePressable } from '../../components/shared/TactilePressable';
import { SkeletonCard } from '../../components/shared/SkeletonCard';
import { FadeSlideIn } from '../../components/shared/FadeSlideIn';
import { CrashCascadeIn } from '../../components/shared/CrashCascadeIn';
import { haptic } from '../../lib/haptics';
import { getDeliveryCoords } from '../../lib/deliveryCoords';
import { fetchAddresses, createAddress, updateAddress, deleteAddress } from '../../lib/apiClient';
import type { ApiUserAddress } from '../../lib/types';

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
    void fetchAddresses().then(setAddresses).catch(() => setAddresses([]));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

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
    if (!address.trim()) { setError('Please enter the street address.'); haptic.warning(); return; }
    let latitude = coords?.latitude, longitude = coords?.longitude;
    if (latitude == null || longitude == null) {
      try { const fix = await getDeliveryCoords(); latitude = fix.latitude; longitude = fix.longitude; } catch { setError('Pin the location first (use my current location).'); haptic.warning(); return; }
    }
    setSaving(true); setError(null);
    try {
      await createAddress({ label: label.trim() || 'Home', address: address.trim(), latitude: latitude!, longitude: longitude!, is_default: (addresses?.length ?? 0) === 0 });
      haptic.success(); setAdding(false); setLabel(''); setAddress(''); setCoords(null); refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save the address.'); haptic.warning(); } finally { setSaving(false); }
  };

  const makeDefault = async (id: number) => { try { await updateAddress(id, { is_default: true }); haptic.selection(); refresh(); } catch { haptic.warning(); } };
  const remove = async (id: number) => { try { await deleteAddress(id); haptic.selection(); refresh(); } catch { haptic.warning(); } };

  if (addresses === null) {
    return (
      <View style={{ paddingHorizontal: semanticSpacing.screenPadding, paddingBottom: semanticSpacing.md }}>
        <FadeSlideIn delay={40} distance={8}><SkeletonCard width="100%" height={72} index={0} /></FadeSlideIn>
      </View>
    );
  }

  return (
    <View style={{ paddingHorizontal: semanticSpacing.screenPadding, paddingBottom: semanticSpacing.md, gap: 10 }}>
      <FadeSlideIn delay={40} distance={8}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontWeight: '700', color: theme.colors.text.primary, fontSize: 12, letterSpacing: 0.3, textTransform: 'uppercase' }}>Saved Addresses</Text>
          <TactilePressable
            onPress={() => { haptic.selection(); setAdding((v) => !v); }}
            haptic="selection"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              flexShrink: 0,
              maxWidth: 140,
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 999,
              backgroundColor: adding ? theme.colors.text.primary : theme.colors.surface.primary,
              borderWidth: 1,
              borderColor: adding ? theme.colors.text.primary : theme.colors.border.subtle,
            }}
          >
            <Plus size={12} color={adding ? theme.colors.text.inverse : brand.orange} strokeWidth={2.2} />
            <Text style={{ color: adding ? theme.colors.text.inverse : brand.orange, fontWeight: '600', fontSize: 11, letterSpacing: 0.2 }}>{adding ? 'Close' : 'Add'}</Text>
          </TactilePressable>
        </View>
      </FadeSlideIn>

      {addresses.length === 0 && !adding ? (
        <FadeSlideIn delay={80} distance={8}>
          <View style={{ backgroundColor: theme.colors.surface.primary, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: theme.colors.border.subtle }}>
            <Text style={{ fontSize: 12, color: theme.colors.text.secondary, lineHeight: 16 }}>No saved addresses yet. Add one so checkout can offer it when you choose delivery.</Text>
          </View>
        </FadeSlideIn>
      ) : null}

      {addresses.map((item, idx) => (
        <CrashCascadeIn key={item.id} index={idx}>
          <View
            style={{
              backgroundColor: theme.colors.surface.primary,
              borderRadius: 12,
              padding: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              borderWidth: 1,
              borderColor: item.is_default ? brand.orange : theme.colors.border.subtle,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: item.is_default ? 0.05 : 0.02,
              shadowRadius: 4,
              elevation: 0.5,
            }}
          >
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: item.is_default ? brand.orange + '15' : theme.colors.surface.elevated, borderWidth: 1, borderColor: item.is_default ? brand.orange + '20' : theme.colors.border.subtle, alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={14} color={item.is_default ? brand.orange : theme.colors.text.secondary} strokeWidth={2} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontWeight: '600', color: theme.colors.text.primary, fontSize: 12, letterSpacing: -0.1 }}>{item.label}{item.is_default ? ' · Default' : ''}</Text>
              <Text numberOfLines={1} style={{ fontSize: 11, color: theme.colors.text.secondary }}>{item.address}</Text>
            </View>
            {!item.is_default ? (
              <TactilePressable onPress={() => void makeDefault(item.id)} haptic="selection" style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: theme.colors.surface.elevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border.subtle }}>
                <Star size={12} color={theme.colors.text.tertiary} strokeWidth={2} />
              </TactilePressable>
            ) : null}
            <TactilePressable onPress={() => void remove(item.id)} haptic="selection" style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FECACA' }}>
              <Trash2 size={12} color="#DC2626" strokeWidth={2} />
            </TactilePressable>
          </View>
        </CrashCascadeIn>
      ))}

      {adding ? (
        <FadeSlideIn delay={120} distance={10}>
          <View style={{ backgroundColor: theme.colors.surface.primary, borderRadius: 16, padding: 14, gap: 10, borderWidth: 1, borderColor: theme.colors.border.subtle, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 }}>
            <TextInput value={label} onChangeText={setLabel} placeholder="Label (e.g. Home, Work)" placeholderTextColor={theme.colors.text.tertiary} maxLength={50} style={{ backgroundColor: theme.colors.background.secondary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: theme.colors.text.primary, fontSize: 12, borderWidth: 1, borderColor: theme.colors.border.subtle }} />
            <TextInput value={address} onChangeText={setAddress} placeholder="Street address" placeholderTextColor={theme.colors.text.tertiary} multiline style={{ backgroundColor: theme.colors.background.secondary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: theme.colors.text.primary, fontSize: 12, minHeight: 60, textAlignVertical: 'top', borderWidth: 1, borderColor: theme.colors.border.subtle }} />
            <TactilePressable onPress={() => void useMyLocation()} haptic="selection" style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border.subtle, backgroundColor: theme.colors.surface.elevated }}>
              <LocateFixed size={12} color={locating ? theme.colors.text.tertiary : brand.orange} />
              <Text style={{ color: brand.orange, fontWeight: '600', fontSize: 11 }}>{locating ? 'Locating…' : coords ? `Pinned ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}` : 'Use my current location'}</Text>
            </TactilePressable>
            {error ? <Text style={{ fontSize: 11, color: '#DC2626' }}>{error}</Text> : null}
            <TactilePressable onPress={() => void save()} haptic="commit" disabled={saving} style={{ backgroundColor: theme.colors.text.primary, borderRadius: 999, paddingVertical: 12, alignItems: 'center', opacity: saving ? 0.6 : 1 }}>
              <Text style={{ color: theme.colors.text.inverse, fontWeight: '700', fontSize: 11, letterSpacing: 0.3, textTransform: 'uppercase' }}>{saving ? 'Saving…' : 'Save Address'}</Text>
            </TactilePressable>
          </View>
        </FadeSlideIn>
      ) : null}
    </View>
  );
}
