import React from 'react';
import { View, Text, ScrollView, TextInput, type StyleProp, type ViewStyle } from 'react-native';
import Constants from 'expo-constants';
import { LogOut, Package, RefreshCw, Settings, ChevronDown, ChevronUp, Sun, Moon, Monitor, Palette, MapPin } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { textStyle, fontWeight } from '../../theme/typography';
import { spacing, semanticSpacing, semanticRadius } from '../../theme/spacing';
import { useSession } from '../../stores/session';
import { useThemePreference, type ThemePreference } from '../../stores/themePreference';
import { useQuery } from '@tanstack/react-query';
import { fetchOrders } from '../../lib/apiClient';
import { queryKeys } from '../../lib/queryKeys';
import { formatZar } from '../../lib/currency';
import { formatDate } from '../../lib/formatters';
import { TactilePressable } from '../../components/shared/TactilePressable';
import { useCart } from '../cart/store';
import { haptic } from '../../lib/haptics';
import { EmptyState } from '../../components/shared/EmptyState';
import { AddressesSection } from './AddressesSection';
import { Logo } from '../../components/shared/Logo';
import { useTopSafeArea } from '../../components/shared/ScreenHeader';
import { SectionHeader } from '../../components/shared/SectionHeader';
import { copy } from '../../lib/strings';
import { useToast } from '../../components/shared/GlassToast';
import type { RootStackParamList } from '../../navigation/types';
import { getApiBaseUrl, setApiBaseUrl, resetApiClient } from '../../lib/apiClient';
import { storage, STORAGE_KEYS } from '../../lib/storage';
import { ORDER_STATUS_LABEL as STATUS_LABEL } from '../../lib/status';
import { FadeSlideIn } from '../../components/shared/FadeSlideIn';

function getLocalIp(): string {
  // Auto-detect the Metro bundler host so the suggested URL works on any network.
  try {
    const candidates: (string | undefined)[] = [
      (Constants as any).expoConfig?.hostUri,
      (Constants as any).expoConfig?.extra?.hostUri,
      (Constants as any).manifest2?.extra?.expoGo?.debuggerHost,
      (Constants as any).manifest2?.extra?.expoGo?.developer?.host,
      (Constants as any).manifest?.hostUri,
    ];
    for (const raw of candidates) {
      if (!raw) continue;
      const host = String(raw).includes('://') ? new URL(raw).hostname : String(raw).split(':')[0];
      if (host && host !== 'localhost' && host !== '127.0.0.1' && host.includes('.')) return host;
    }
  } catch {}
  return '';
}

/**
 * AccountScreen — a single scrollable page.
 *
 * The whole screen lives in one ScrollView so every section (including the
 * Developer Settings row at the bottom) is always reachable, no matter how
 * many orders you have.
 */
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
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background.primary }}
      contentContainerStyle={{ paddingBottom: spacing.xxl }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Profile header */}
      <View style={{ paddingTop: topInset, paddingHorizontal: semanticSpacing.screenPadding, alignItems: 'center', gap: semanticSpacing.sm }}>
        <FadeSlideIn delay={60}>
          <Logo variant="stacked" size={24} tone={theme.name} />
        </FadeSlideIn>
        <FadeSlideIn delay={100}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
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
            <Text style={{ fontSize: 34, fontWeight: fontWeight.black, color: brand.orange, letterSpacing: -1 }}>{initial}</Text>
          </View>
        </FadeSlideIn>
        <FadeSlideIn delay={140}>
          <Text style={{ ...textStyle.h2, fontWeight: fontWeight.bold, color: theme.colors.text.primary, textAlign: 'center', letterSpacing: -0.3 }}>{name}</Text>
          {user?.email ? (
            <Text style={{ ...textStyle.caption, color: theme.colors.text.secondary, textAlign: 'center', marginTop: 2 }}>{user.email}</Text>
          ) : null}
        </FadeSlideIn>
      </View>

      {/* Sign in / sign out */}
      <FadeSlideIn delay={180}>
        <View style={{ paddingHorizontal: semanticSpacing.screenPadding, paddingTop: semanticSpacing.md }}>
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
              <Text style={{ color: theme.colors.text.secondary, fontWeight: fontWeight.semibold, fontSize: 13, letterSpacing: 0.2 }}>Sign out</Text>
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

      {/* Appearance */}
      <FadeSlideIn delay={200}>
        <View
          style={{
            marginHorizontal: semanticSpacing.screenPadding,
            marginTop: semanticSpacing.xl,
            backgroundColor: theme.colors.surface.primary,
            borderRadius: semanticRadius.card,
            borderWidth: 1,
            borderColor: theme.colors.border.subtle,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: semanticSpacing.md,
            paddingVertical: semanticSpacing.sm,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: semanticSpacing.sm }}>
            <View style={sectionIconStyle(theme)}>
              <Palette size={14} color={theme.colors.text.secondary} />
            </View>
            <Text style={{ ...textStyle.h3, fontWeight: fontWeight.bold, color: theme.colors.text.primary, letterSpacing: -0.2 }}>Appearance</Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: theme.colors.background.secondary,
              borderRadius: semanticRadius.smallControl,
              padding: 2,
              borderWidth: 1,
              borderColor: theme.colors.border.subtle,
            }}
          >
            {([
              { key: 'light' as ThemePreference, icon: Sun, label: 'Light' },
              { key: 'system' as ThemePreference, icon: Monitor, label: 'System' },
              { key: 'dark' as ThemePreference, icon: Moon, label: 'Dark' },
            ]).map(({ key, icon: Icon, label }) => {
              const active = themePreference === key;
              return (
                <TactilePressable
                  key={key}
                  onPress={() => setThemePreference(key)}
                  haptic="selection"
                  accessibilityLabel={`${label} appearance`}
                  style={{
                    width: 40,
                    height: 28,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 6,
                    backgroundColor: active ? theme.colors.surface.elevated : 'transparent',
                    borderWidth: 1,
                    borderColor: active ? theme.colors.border.subtle : 'transparent',
                  }}
                >
                  <Icon size={14} color={active ? theme.colors.text.primary : theme.colors.text.tertiary} strokeWidth={active ? 2.2 : 1.8} />
                </TactilePressable>
              );
            })}
          </View>
        </View>
      </FadeSlideIn>

      {/* Addresses */}
      <FadeSlideIn delay={240}>
        <View style={{ marginTop: semanticSpacing.xl }}>
          <SectionHeader
            title="Addresses"
            icon={<MapPin size={14} color={theme.colors.text.secondary} />}
          />
          <AddressesSection />
        </View>
      </FadeSlideIn>

      {/* Orders */}
      <FadeSlideIn delay={280}>
        <View style={{ marginTop: semanticSpacing.xl }}>
          <SectionHeader
            title="Orders"
            icon={<Package size={14} color={theme.colors.text.secondary} />}
            trailing={
              orders.length > 0 ? (
                <View style={{ backgroundColor: brand.orange + '15', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: brand.orange }}>{orders.length}</Text>
                </View>
              ) : undefined
            }
          />
          {status !== 'authenticated' ? (
            <EmptyInView>
              <EmptyState icon={Package} title="Sign in to see your orders" caption="Your order history lives in your account." />
            </EmptyInView>
          ) : orders.length === 0 ? (
            <EmptyInView>
              <EmptyState icon={Package} title={copy.orders.emptyTitle} caption={copy.orders.emptyBody} />
            </EmptyInView>
          ) : (
            <View style={{ paddingHorizontal: semanticSpacing.screenPadding, gap: semanticSpacing.sm }}>
              {orders.map((order) => (
                <OrderRow
                  key={String(order.id)}
                  order={order}
                  onOpen={() => navigation.navigate('OrderDetail', { orderId: order.id })}
                  onReorder={() => handleReorder(order)}
                  theme={theme}
                />
              ))}
            </View>
          )}
        </View>
      </FadeSlideIn>

      {/* Developer settings — a normal row in the scroll flow, never clipped */}
      {__DEV__ && (
        <FadeSlideIn delay={320}>
          <View style={{ marginTop: semanticSpacing.xl, paddingHorizontal: semanticSpacing.screenPadding }}>
            <TactilePressable
              onPress={() => setDevExpanded(!devExpanded)}
              haptic="tap"
              accessibilityRole="button"
              accessibilityState={{ expanded: devExpanded }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: semanticSpacing.md,
                paddingHorizontal: semanticSpacing.md,
                backgroundColor: theme.colors.surface.primary,
                borderRadius: semanticRadius.card,
                borderWidth: 1,
                borderColor: theme.colors.border.subtle,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: semanticSpacing.sm }}>
                <View style={sectionIconStyle(theme)}>
                  <Settings size={14} color={theme.colors.text.secondary} strokeWidth={2} />
                </View>
                <Text style={{ fontWeight: fontWeight.bold, color: theme.colors.text.primary, fontSize: 13, letterSpacing: -0.2 }}>Developer Settings</Text>
              </View>
              {devExpanded ? (
                <ChevronUp size={14} color={theme.colors.text.secondary} />
              ) : (
                <ChevronDown size={14} color={theme.colors.text.secondary} />
              )}
            </TactilePressable>
            {devExpanded && (
              <View style={{ marginTop: semanticSpacing.sm }}>
                <DebugSection theme={theme} toast={toast} getLocalIp={getLocalIp} />
              </View>
            )}
          </View>
        </FadeSlideIn>
      )}
    </ScrollView>
  );
}

/** Section icon chip — the shared 28px chip used by SectionHeader. */
function sectionIconStyle(theme: ReturnType<typeof useTheme>): StyleProp<ViewStyle> {
  return {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.surface.elevated,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  };
}

/** Gives the shared EmptyState a comfortable height inside the scroll flow. */
function EmptyInView({ children }: { children: React.ReactNode }) {
  return <View style={{ minHeight: 260, justifyContent: 'center' }}>{children}</View>;
}

interface OrderRowProps {
  order: {
    id: number;
    status: string;
    created_at: string;
    total_cents?: number | null;
    items?: unknown[];
  };
  onOpen: () => void;
  onReorder: () => void;
  theme: ReturnType<typeof useTheme>;
}

function OrderRow({ order, onOpen, onReorder, theme }: OrderRowProps) {
  const canReorder = order.status !== 'pending' && order.status !== 'preparing';
  return (
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
      <TactilePressable onPress={onOpen} haptic="selection" style={{ flex: 1, padding: semanticSpacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontWeight: fontWeight.bold, color: theme.colors.text.primary, fontSize: 13, letterSpacing: -0.2 }}>Order #{order.id}</Text>
          <Text style={{ fontSize: 11, color: theme.colors.text.secondary }}>{formatDate(order.created_at)}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: semanticSpacing.xs, alignItems: 'center' }}>
          <View style={{ backgroundColor: brand.orange + '12', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ fontSize: 10, color: brand.orange, fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase' }}>{STATUS_LABEL[order.status] ?? order.status}</Text>
          </View>
          <Text style={{ fontWeight: fontWeight.bold, color: theme.colors.text.primary, fontSize: 13, letterSpacing: -0.2 }}>{formatZar(order.total_cents ?? 0)}</Text>
        </View>
      </TactilePressable>
      {canReorder && (
        <TactilePressable
          onPress={onReorder}
          haptic="commit"
          accessibilityLabel={`Reorder order ${order.id}`}
          style={{ padding: semanticSpacing.md, borderLeftWidth: 1, borderLeftColor: theme.colors.border.subtle, backgroundColor: theme.colors.surface.elevated }}
        >
          <RefreshCw size={16} color={brand.orange} strokeWidth={2} />
        </TactilePressable>
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

  const localIp = getLocalIp();
  const suggestedUrl = localIp ? `http://${localIp}:8000/api` : 'http://<your-machine-ip>:8000/api';

  return (
    <View style={{ backgroundColor: theme.colors.surface.primary, borderRadius: semanticRadius.card, padding: semanticSpacing.md, gap: semanticSpacing.md, borderWidth: 1, borderColor: theme.colors.border.subtle }}>
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
