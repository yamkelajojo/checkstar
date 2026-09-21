import React from 'react';
import { View, Text, FlatList, TextInput, Alert, Platform } from 'react-native';
import { LogOut, Package, RefreshCw, Settings, ChevronDown, ChevronUp, Sun, Moon, Monitor } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { textStyle, fontWeight } from '../../theme/typography';
import { semanticSpacing, semanticRadius } from '../../theme/spacing';
import { useSession } from '../../stores/session';
import { useThemePreference, type ThemePreference } from '../../stores/themePreference';
import { useQuery } from '@tanstack/react-query';
import { fetchOrders } from '../../lib/apiClient';
import { queryKeys } from '../../lib/queryKeys';
import { formatZar } from '../../lib/currency';
import { TactilePressable } from '../../components/shared/TactilePressable';
import { useCart } from '../cart/store';
import { haptic } from '../../lib/haptics';
import { EmptyState } from '../../components/shared/EmptyState';
import { AddressesSection } from './AddressesSection';
import { Logo } from '../../components/shared/Logo';
import { useTopSafeArea } from '../../components/shared/ScreenHeader';
import { copy } from '../../lib/strings';
import { useToast } from '../../components/shared/GlassToast';
import type { RootStackParamList } from '../../navigation/types';
import { getApiBaseUrl, setApiBaseUrl, resetApiClient } from '../../lib/apiClient';
import { storage, STORAGE_KEYS } from '../../lib/storage';
import { ORDER_STATUS_LABEL as STATUS_LABEL } from '../../lib/status';
import { FadeSlideIn } from '../../components/shared/FadeSlideIn';
import { CrashCascadeIn } from '../../components/shared/CrashCascadeIn';

function getLocalIp(): string {
  if (Platform.OS === 'android') return '10.0.2.2';
  return '192.168.1.x';
}

export function AccountScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useSession((s) => s.user);
  const status = useSession((s) => s.status);
  const signOut = useSession((s) => s.signOut);
  const toast = useToast();
  const topInset = useTopSafeArea(semanticSpacing.sm);
  const themePreference = useThemePreference((s) => s.preference);
  const setThemePreference = useThemePreference((s) => s.setPreference);

  const { data: orders = [] } = useQuery({
    queryKey: queryKeys.orders,
    queryFn: fetchOrders,
    enabled: status === 'authenticated',
  });

  const handleReorder = (order: NonNullable<typeof orders>[number]) => {
    if (!order.items) return;
    let added = 0;
    for (const item of order.items) {
      try {
        useCart.getState().add(String(item.product_id), item.quantity);
        added++;
      } catch {}
    }
    haptic.success();
    toast.show(`${added} item(s) added to cart`, { tone: 'success' });
  };

  const name = user?.name ?? 'Guest';
  const initial = name?.[0]?.toUpperCase() ?? '?';
  const [devExpanded, setDevExpanded] = React.useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      <View style={{ paddingTop: topInset, paddingHorizontal: semanticSpacing.screenPadding, alignItems: 'center', gap: semanticSpacing.md }}>
        <FadeSlideIn delay={60} distance={12} initialScale={0.9}>
          <View style={{ position: 'relative', alignItems: 'center' }}>
            <Logo variant="stacked" size={28} tone={theme.name} style={{ zIndex: 2 }} />
          </View>
        </FadeSlideIn>

        <FadeSlideIn delay={100} distance={10} initialScale={0.85}>
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: theme.colors.surface.elevated,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: theme.colors.border.subtle,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
              elevation: 2,
            }}
          >
            <Text style={{ fontSize: 40, fontWeight: fontWeight.black, color: brand.orange, letterSpacing: -1 }}>{initial}</Text>
          </View>
        </FadeSlideIn>

        <FadeSlideIn delay={140} distance={8}>
          <Text style={{ ...textStyle.h2, fontWeight: fontWeight.bold, color: theme.colors.text.primary, textAlign: 'center', letterSpacing: -0.3 }}>{name}</Text>
          {user?.email ? (
            <Text style={{ ...textStyle.caption, color: theme.colors.text.secondary, textAlign: 'center', marginTop: 2 }}>{user.email}</Text>
          ) : null}
        </FadeSlideIn>
      </View>

      <FadeSlideIn delay={180} distance={8}>
        <View style={{ paddingHorizontal: semanticSpacing.screenPadding, paddingTop: semanticSpacing.md, paddingBottom: semanticSpacing.sm }}>
          {status === 'authenticated' ? (
            <TactilePressable
              onPress={async () => {
                await signOut();
                toast.show('Signed out');
              }}
              haptic="tap"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                backgroundColor: theme.colors.surface.primary,
                borderRadius: semanticRadius.buttonPill,
                paddingVertical: 12,
                borderWidth: 1,
                borderColor: theme.colors.border.subtle,
              }}
            >
              <LogOut size={16} color={theme.colors.text.secondary} strokeWidth={2} />
              <Text style={{ color: theme.colors.text.secondary, fontWeight: fontWeight.semibold, fontSize: 13, letterSpacing: 0.2 }}>Sign Out</Text>
            </TactilePressable>
          ) : (
            <TactilePressable
              onPress={() => navigation.navigate('Auth')}
              haptic="commit"
              style={{
                backgroundColor: theme.colors.text.primary,
                borderRadius: semanticRadius.buttonPill,
                paddingVertical: 14,
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <Text style={{ color: theme.colors.text.inverse, fontWeight: fontWeight.bold, letterSpacing: 0.3, fontSize: 13, textTransform: 'uppercase' }}>Sign in</Text>
            </TactilePressable>
          )}
        </View>
      </FadeSlideIn>

      <FadeSlideIn delay={200} distance={8}>
        <View style={{ paddingHorizontal: semanticSpacing.screenPadding, paddingTop: 4, paddingBottom: semanticSpacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', color: theme.colors.text.tertiary }}>Appearance</Text>
          <View style={{ flexDirection: 'row', backgroundColor: theme.colors.background.secondary, borderRadius: 10, padding: 2, borderWidth: 1, borderColor: theme.colors.border.subtle }}>
            {([
              { key: 'light' as ThemePreference, icon: Sun, label: 'Light' },
              { key: 'system' as ThemePreference, icon: Monitor, label: 'System' },
              { key: 'dark' as ThemePreference, icon: Moon, label: 'Dark' },
            ]).map(({ key, icon: Icon }) => {
              const active = themePreference === key;
              return (
                <TactilePressable
                  key={key}
                  onPress={() => setThemePreference(key)}
                  haptic="selection"
                  style={{
                    width: 42,
                    height: 30,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    backgroundColor: active ? theme.colors.surface.elevated : 'transparent',
                    borderWidth: 1,
                    borderColor: active ? theme.colors.border.subtle : 'transparent',
                    shadowColor: active ? '#000' : 'transparent',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: active ? 0.06 : 0,
                    shadowRadius: 2,
                  }}
                >
                  <Icon size={14} color={active ? theme.colors.text.primary : theme.colors.text.tertiary} strokeWidth={active ? 2.2 : 1.8} />
                </TactilePressable>
              );
            })}
          </View>
        </View>
      </FadeSlideIn>

      <FadeSlideIn delay={240} distance={10}>
        <View style={{ paddingHorizontal: semanticSpacing.screenPadding, marginTop: semanticSpacing.lg, marginBottom: semanticSpacing.xs, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: theme.colors.surface.elevated, borderWidth: 1, borderColor: theme.colors.border.subtle, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 10 }}>📍</Text>
          </View>
          <Text style={{ ...textStyle.h3, fontWeight: fontWeight.bold, color: theme.colors.text.primary, letterSpacing: -0.2 }}>Addresses</Text>
        </View>
      </FadeSlideIn>
      <AddressesSection />

      <FadeSlideIn delay={280} distance={10}>
        <View style={{ paddingHorizontal: semanticSpacing.screenPadding, marginTop: semanticSpacing.xl, marginBottom: semanticSpacing.xs, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: theme.colors.surface.elevated, borderWidth: 1, borderColor: theme.colors.border.subtle, alignItems: 'center', justifyContent: 'center' }}>
            <Package size={10} color={theme.colors.text.secondary} />
          </View>
          <Text style={{ ...textStyle.h3, fontWeight: fontWeight.bold, color: theme.colors.text.primary, letterSpacing: -0.2 }}>Orders</Text>
          {orders.length > 0 ? (
            <View style={{ backgroundColor: brand.orange + '15', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: brand.orange }}>{orders.length}</Text>
            </View>
          ) : null}
        </View>
      </FadeSlideIn>

      {status !== 'authenticated' ? (
        <FadeSlideIn delay={300} distance={8}>
          <EmptyState icon={Package} title="Sign in to see your orders" caption="Your order history lives in your account." />
        </FadeSlideIn>
      ) : orders.length === 0 ? (
        <FadeSlideIn delay={300} distance={8}>
          <EmptyState icon={Package} title={copy.orders.emptyTitle} caption={copy.orders.emptyBody} />
        </FadeSlideIn>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => String(o.id)}
          contentContainerStyle={{ padding: semanticSpacing.screenPadding, gap: 10, paddingBottom: 20 }}
          renderItem={({ item, index }) => (
            <CrashCascadeIn index={index}>
              <View
                style={{
                  backgroundColor: theme.colors.surface.primary,
                  borderRadius: semanticRadius.card,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: theme.colors.border.subtle,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.03,
                  shadowRadius: 4,
                  elevation: 0.5,
                  overflow: 'hidden',
                }}
              >
                <TactilePressable onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })} haptic="selection" style={{ flex: 1, padding: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontWeight: fontWeight.bold, color: theme.colors.text.primary, fontSize: 13, letterSpacing: -0.2 }}>Order #{item.id}</Text>
                    <Text style={{ fontSize: 11, color: theme.colors.text.secondary }}>{new Date(item.created_at).toLocaleDateString()}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, alignItems: 'center' }}>
                    <View style={{ backgroundColor: brand.orange + '12', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ fontSize: 10, color: brand.orange, fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase' }}>{STATUS_LABEL[item.status] ?? item.status}</Text>
                    </View>
                    <Text style={{ fontWeight: fontWeight.bold, color: theme.colors.text.primary, fontSize: 13, letterSpacing: -0.2 }}>{formatZar(item.total_cents ?? 0)}</Text>
                  </View>
                </TactilePressable>
                {item.status !== 'pending' && item.status !== 'preparing' && (
                  <TactilePressable
                    onPress={() => handleReorder(item)}
                    haptic="commit"
                    style={{ padding: 14, borderLeftWidth: 1, borderLeftColor: theme.colors.border.subtle, backgroundColor: theme.colors.surface.elevated }}
                  >
                    <RefreshCw size={16} color={brand.orange} strokeWidth={2} />
                  </TactilePressable>
                )}
              </View>
            </CrashCascadeIn>
          )}
        />
      )}

      {__DEV__ && (
        <FadeSlideIn delay={340} distance={8}>
          <View style={{ marginTop: semanticSpacing.xl, paddingHorizontal: semanticSpacing.screenPadding, paddingBottom: 40 }}>
            <TactilePressable
              onPress={() => setDevExpanded(!devExpanded)}
              haptic="tap"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 12,
                paddingHorizontal: 14,
                backgroundColor: theme.colors.surface.primary,
                borderRadius: semanticRadius.card,
                borderWidth: 1,
                borderColor: theme.colors.border.subtle,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Settings size={16} color={theme.colors.text.secondary} strokeWidth={2} />
                <Text style={{ fontWeight: fontWeight.bold, color: theme.colors.text.primary, fontSize: 13, letterSpacing: -0.2 }}>Developer Settings</Text>
              </View>
              {devExpanded ? <ChevronUp size={14} color={theme.colors.text.secondary} /> : <ChevronDown size={14} color={theme.colors.text.secondary} />}
            </TactilePressable>
            {devExpanded && (
              <View style={{ marginTop: 8 }}>
                <DebugSection theme={theme} toast={toast} getLocalIp={getLocalIp} />
              </View>
            )}
          </View>
        </FadeSlideIn>
      )}
    </View>
  );
}

function DebugSection({ theme, toast, getLocalIp }: { theme: ReturnType<typeof useTheme>; toast: ReturnType<typeof import('../../components/shared/GlassToast').useToast>; getLocalIp: () => string }) {
  const [apiUrl, setApiUrl] = React.useState('');
  const [testing, setTesting] = React.useState(false);

  React.useEffect(() => {
    getApiBaseUrl().then(setApiUrl);
  }, []);

  const handleSave = async () => {
    if (!apiUrl.trim()) return;
    try {
      setTesting(true);
      await setApiBaseUrl(apiUrl.trim());
      await resetApiClient();
      const api = await (await import('../../lib/apiClient')).getApi();
      await api.get('/stores', {}, false);
      toast.show('API URL saved and connection verified!');
    } catch (e) {
      toast.show('Failed to connect: ' + (e instanceof Error ? e.message : 'Unknown error'));
    } finally {
      setTesting(false);
    }
  };

  const handleReset = async () => {
    try {
      await storage.remove(STORAGE_KEYS.apiBaseUrl);
      await resetApiClient();
      const freshUrl = await getApiBaseUrl();
      setApiUrl(freshUrl);
      toast.show('Reset to default API URL');
    } catch {
      toast.show('Reset failed');
    }
  };

  const suggestedUrl = `http://${getLocalIp()}:8000/api`;

  return (
    <View style={{ marginTop: 12, backgroundColor: theme.colors.surface.primary, borderRadius: semanticRadius.card, padding: 14, gap: 12, borderWidth: 1, borderColor: theme.colors.border.subtle }}>
      <Text style={{ fontSize: 11, color: theme.colors.text.secondary, lineHeight: 14 }}>Configure the Laravel backend API URL for physical device testing.</Text>
      <View style={{ gap: 4 }}>
        <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 0.3, textTransform: 'uppercase', color: theme.colors.text.tertiary }}>Current</Text>
        <Text style={{ fontSize: 11, fontFamily: 'monospace', color: theme.colors.text.primary }}>{apiUrl || 'loading...'}</Text>
      </View>
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 0.3, textTransform: 'uppercase', color: theme.colors.text.tertiary }}>New URL</Text>
        <TextInput
          value={apiUrl}
          onChangeText={setApiUrl}
          placeholder={suggestedUrl}
          placeholderTextColor={theme.colors.text.tertiary}
          style={{
            backgroundColor: theme.colors.background.primary,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: theme.colors.text.primary,
            fontSize: 12,
            fontFamily: 'monospace',
            borderWidth: 1,
            borderColor: theme.colors.border.subtle,
          }}
        />
        <Text style={{ fontSize: 10, color: theme.colors.text.tertiary }}>Suggested: {suggestedUrl}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
        <TactilePressable onPress={handleSave} haptic="commit" disabled={testing || !apiUrl.trim()} style={{ flex: 1, backgroundColor: brand.orange, borderRadius: 999, paddingVertical: 12, opacity: testing ? 0.6 : 1 }}>
          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700', fontSize: 12, letterSpacing: 0.3, textTransform: 'uppercase' }}>{testing ? 'Testing...' : 'Save & Test'}</Text>
        </TactilePressable>
        <TactilePressable onPress={handleReset} haptic="tap" style={{ backgroundColor: theme.colors.surface.primary, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 20, borderWidth: 1, borderColor: theme.colors.border.subtle }}>
          <Text style={{ color: theme.colors.text.primary, fontWeight: '600', fontSize: 12 }}>Reset</Text>
        </TactilePressable>
      </View>
    </View>
  );
}
