import React from 'react';
import { View, Text, FlatList, TextInput, Alert, Platform, TouchableOpacity } from 'react-native';
import { LogOut, Package, Settings, Wifi, WifiOff, ChevronDown, ChevronUp, Sun, Moon, Monitor } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { textStyle, fontWeight, typeScale } from '../../theme/typography';
import { semanticSpacing, semanticRadius } from '../../theme/spacing';
import { useSession } from '../../stores/session';
import { useThemePreference, type ThemePreference } from '../../stores/themePreference';
import { useQuery } from '@tanstack/react-query';
import { fetchOrders } from '../../lib/apiClient';
import { queryKeys } from '../../lib/queryKeys';
import { formatZar } from '../../lib/currency';
import { TactilePressable } from '../../components/shared/TactilePressable';
import { EmptyState } from '../../components/shared/EmptyState';
import { Logo } from '../../components/shared/Logo';
import { copy } from '../../lib/strings';
import { useToast } from '../../components/shared/GlassToast';
import type { RootStackParamList } from '../../navigation/types';
import { getApiBaseUrl, setApiBaseUrl, resetApiClient } from '../../lib/apiClient';
import { storage, STORAGE_KEYS } from '../../lib/storage';
import { ORDER_STATUS_LABEL as STATUS_LABEL } from '../../lib/status';

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
  const themePreference = useThemePreference((s) => s.preference);
  const setThemePreference = useThemePreference((s) => s.setPreference);

  const { data: orders = [] } = useQuery({
    queryKey: queryKeys.orders,
    queryFn: fetchOrders,
    enabled: status === 'authenticated',
  });

  const name = user?.name ?? 'Guest';
  const role = user?.role ?? 'customer';
  const initial = name?.[0]?.toUpperCase() ?? '?';
  const roleLabel = role === 'rider' ? '🚲 Rider' : role === 'store_owner' ? '🏪 Owner' : role === 'store_manager' ? '📋 Manager' : role === 'logistics_officer' ? '📦 Logistics' : role === 'developer' ? '💻 Developer' : '👤 Customer';

  const [devExpanded, setDevExpanded] = React.useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      {/* Profile header with layered logo */}
      <View style={{ paddingTop: 36, paddingHorizontal: semanticSpacing.screenPadding, alignItems: 'center', gap: semanticSpacing.md }}>
        {/* Logo overlaid above profile image */}
        <View style={{ position: 'relative', alignItems: 'center' }}>
          <Logo variant="stacked" size={30} tone={theme.name} style={{ zIndex: 2 }} />
        </View>

        {/* Profile image container shifted downward for overlap */}
        <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: theme.colors.surface.elevated, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: theme.colors.surface, marginTop: semanticSpacing.xxs, zIndex: 1 }}>
          <Text style={{ fontSize: 42, fontWeight: fontWeight.black, color: brand.orange }}>
            {initial}
          </Text>
        </View>

        <Text style={{ ...textStyle.h2, fontWeight: fontWeight.bold, color: theme.colors.text.primary, textAlign: 'center', marginTop: -semanticSpacing.md }}>
          {name}
        </Text>

        <Text style={{ color: theme.colors.text.secondary, ...textStyle.caption, textAlign: 'center' }}>
          {roleLabel}
        </Text>
      </View>

      {/* Sign out inline */}
      <View style={{ paddingHorizontal: semanticSpacing.screenPadding, paddingTop: semanticSpacing.md, paddingBottom: semanticSpacing.md }}>
        {status === 'authenticated' ? (
          <TactilePressable
            onPress={async () => {
              await signOut();
              toast.show('Signed out');
            }}
            haptic="tap"
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: semanticSpacing.xxs, backgroundColor: theme.colors.surface.primary, borderRadius: semanticRadius.buttonPill, paddingVertical: semanticSpacing.sm, paddingHorizontal: semanticSpacing.md }}
          >
            <LogOut size={18} color={theme.colors.text.secondary} />
            <Text style={{ color: theme.colors.text.secondary, fontWeight: fontWeight.semibold, ...textStyle.body }}>Sign Out</Text>
          </TactilePressable>
        ) : (
          <TactilePressable
            onPress={() => navigation.navigate('Auth')}
            haptic="commit"
            style={{ backgroundColor: brand.orange, borderRadius: semanticRadius.buttonPill, paddingVertical: semanticSpacing.md, alignItems: 'center' }}
          >
            <Text style={{ color: theme.colors.text.inverse, fontWeight: fontWeight.bold, ...textStyle.buttonPrimary }}>Sign in</Text>
          </TactilePressable>
        )}
      </View>

      {/* Appearance toggle */}
      <View style={{ paddingHorizontal: semanticSpacing.screenPadding, paddingBottom: semanticSpacing.md }}>
        <Text style={{ ...textStyle.caption, fontWeight: fontWeight.semibold, color: theme.colors.text.secondary, marginBottom: semanticSpacing.xs, textTransform: 'uppercase', letterSpacing: 1.1 }}>
          Appearance
        </Text>
        <View style={{ flexDirection: 'row', gap: semanticSpacing.xs }}>
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
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: semanticSpacing.xxs,
                  paddingVertical: semanticSpacing.sm,
                  borderRadius: semanticRadius.md,
                  backgroundColor: active ? brand.orange : theme.colors.surface.primary,
                  borderWidth: 1,
                  borderColor: active ? brand.orange : theme.colors.border.subtle,
                }}
              >
                <Icon size={16} color={active ? '#FFFFFF' : theme.colors.text.secondary} />
                <Text style={{
                  ...textStyle.caption,
                  fontWeight: active ? fontWeight.semibold : fontWeight.regular,
                  color: active ? '#FFFFFF' : theme.colors.text.secondary,
                }}>
                  {label}
                </Text>
              </TactilePressable>
            );
          })}
        </View>
      </View>

      <Text style={{ marginTop: semanticSpacing.xl, paddingHorizontal: semanticSpacing.screenPadding, ...textStyle.h3, fontWeight: fontWeight.bold, color: theme.colors.text.primary }}>
        Orders
      </Text>
      {status !== 'authenticated' ? (
        <EmptyState
          icon={Package}
          title="Sign in to see your orders"
          caption="Your order history lives in your account."
        />
      ) : orders.length === 0 ? (
        <EmptyState icon={Package} title={copy.orders.emptyTitle} caption={copy.orders.emptyBody} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => String(o.id)}
          contentContainerStyle={{ padding: semanticSpacing.screenPadding, gap: semanticSpacing.inlineGap }}
          renderItem={({ item }) => (
            <TactilePressable
              onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
              haptic="selection"
              style={{ backgroundColor: theme.colors.surface.primary, borderRadius: semanticRadius.card, padding: semanticSpacing.md }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontWeight: fontWeight.bold, color: theme.colors.text.primary, ...textStyle.body }}>
                  Order #{item.id}
                </Text>
                <Text style={{ ...textStyle.caption, color: theme.colors.text.secondary }}>
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: semanticSpacing.xxs }}>
                <Text style={{ ...textStyle.caption, color: brand.orange, fontWeight: fontWeight.semibold }}>
                  {STATUS_LABEL[item.status] ?? item.status}
                </Text>
                <Text style={{ fontWeight: fontWeight.bold, color: theme.colors.text.primary, ...textStyle.body }}>
                  {formatZar(item.total_cents ?? 0)}
                </Text>
              </View>
            </TactilePressable>
          )}
        />
      )}

      {/* Developer settings — collapsed by default */}
      {__DEV__ && (
        <View style={{ marginTop: semanticSpacing.xl, paddingHorizontal: semanticSpacing.screenPadding }}>
          <TactilePressable
            onPress={() => setDevExpanded(!devExpanded)}
            haptic="tap"
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: semanticSpacing.sm, paddingHorizontal: semanticSpacing.md, backgroundColor: theme.colors.surface.primary, borderRadius: semanticRadius.card, borderWidth: 1, borderColor: theme.colors.border.subtle }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: semanticSpacing.inlineGap }}>
              <Settings size={18} color={theme.colors.text.secondary} />
              <Text style={{ ...textStyle.h4, fontWeight: fontWeight.bold, color: theme.colors.text.primary }}>
                Developer Settings
              </Text>
            </View>
            {devExpanded ? <ChevronUp size={16} color={theme.colors.text.secondary} /> : <ChevronDown size={16} color={theme.colors.text.secondary} />}
          </TactilePressable>
          {devExpanded && (
            <View style={{ marginTop: semanticSpacing.xs }}>
              <DebugSection theme={theme} toast={toast} getLocalIp={getLocalIp} />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function DebugSection({ theme, toast, getLocalIp }: { theme: ReturnType<typeof useTheme>; toast: ReturnType<typeof useToast>; getLocalIp: () => string }) {
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
    } catch (e) {
      toast.show('Reset failed');
    }
  };

  const suggestedUrl = `http://${getLocalIp()}:8000/api`;

  return (
    <View style={{ marginTop: semanticSpacing.xxxl, paddingHorizontal: semanticSpacing.screenPadding, borderTopWidth: 1, borderTopColor: theme.colors.border.subtle, paddingTop: semanticSpacing.xl }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: semanticSpacing.inlineGap, marginBottom: semanticSpacing.lg }}>
        <Settings size={20} color={theme.colors.text.secondary} />
        <Text style={{ ...textStyle.h3, fontWeight: fontWeight.bold, color: theme.colors.text.primary }}>
          Developer Settings
        </Text>
      </View>

      <View style={{ backgroundColor: theme.colors.surface.primary, borderRadius: semanticRadius.card, padding: semanticSpacing.md, gap: semanticSpacing.inlineGap }}>
        <Text style={{ ...textStyle.caption, color: theme.colors.text.secondary }}>
          Configure the Laravel backend API URL. Your machine's LAN IP is needed for physical device testing.
        </Text>

        <View style={{ gap: semanticSpacing.xxs }}>
          <Text style={{ ...textStyle.caption, fontWeight: fontWeight.semibold, color: theme.colors.text.primary }}>
            Current API URL
          </Text>
          <Text style={{ fontFamily: 'monospace', ...textStyle.caption, color: theme.colors.text.primary }}>
            {apiUrl || 'loading...'}
          </Text>
        </View>

        <View style={{ gap: semanticSpacing.xxs }}>
          <Text style={{ ...textStyle.caption, fontWeight: fontWeight.semibold, color: theme.colors.text.primary }}>
            New API URL
          </Text>
          <TextInput
            value={apiUrl}
            onChangeText={setApiUrl}
            placeholder={suggestedUrl}
            placeholderTextColor={theme.colors.text.tertiary}
            style={{
              backgroundColor: theme.colors.background.primary,
              borderRadius: semanticRadius.input,
              paddingHorizontal: semanticSpacing.md,
              paddingVertical: semanticSpacing.xs,
              color: theme.colors.text.primary,
              ...textStyle.body,
              fontFamily: 'monospace',
              borderWidth: 1,
              borderColor: theme.colors.border.subtle,
            }}
          />
          <Text style={{ ...textStyle.caption, color: theme.colors.text.secondary }}>
            Suggested: {suggestedUrl}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: semanticSpacing.inlineGap, marginTop: semanticSpacing.xs }}>
          <TactilePressable
            onPress={handleSave}
            haptic="commit"
            disabled={testing || !apiUrl.trim()}
            style={{ flex: 1, backgroundColor: brand.orange, borderRadius: semanticRadius.buttonPill, paddingVertical: semanticSpacing.md }}
          >
            <Text style={{ color: theme.colors.text.inverse, textAlign: 'center', fontWeight: fontWeight.bold, ...textStyle.buttonPrimary }}>
              {testing ? 'Testing...' : 'Save & Test Connection'}
            </Text>
          </TactilePressable>
          <TactilePressable
            onPress={handleReset}
            haptic="tap"
            style={{ backgroundColor: theme.colors.surface.primary, borderRadius: semanticRadius.buttonPill, paddingVertical: semanticSpacing.md, paddingHorizontal: semanticSpacing.lg, borderWidth: 1, borderColor: theme.colors.border.subtle }}
          >
            <Text style={{ color: theme.colors.text.primary, fontWeight: fontWeight.semibold, ...textStyle.buttonPrimary }}>Reset</Text>
          </TactilePressable>
        </View>

        <View style={{ marginTop: semanticSpacing.xs, padding: semanticSpacing.md, backgroundColor: theme.colors.background.primary, borderRadius: semanticRadius.input, gap: semanticSpacing.xxs }}>
          <Text style={{ ...textStyle.caption, fontWeight: fontWeight.bold, color: theme.colors.text.primary }}>
            Quick Setup for Physical Phone:
          </Text>
          <Text style={{ ...textStyle.caption, color: theme.colors.text.secondary }}>
            1. Find your computer's LAN IP (e.g., <Text style={{ fontFamily: 'monospace' }}>ipconfig</Text> on Windows, <Text style={{ fontFamily: 'monospace' }}>ifconfig</Text> on Mac/Linux)
          </Text>
          <Text style={{ ...textStyle.caption, color: theme.colors.text.secondary }}>
            2. Start Laravel: <Text style={{ fontFamily: 'monospace' }}>php artisan serve --host=0.0.0.0 --port=8000</Text>
          </Text>
          <Text style={{ ...textStyle.caption, color: theme.colors.text.secondary }}>
            3. Enter the URL above (e.g., <Text style={{ fontFamily: 'monospace' }}>http://192.168.1.50:8000/api</Text>)
          </Text>
          <Text style={{ ...textStyle.caption, color: theme.colors.text.secondary }}>
            4. Tap "Save & Test Connection"
          </Text>
        </View>
      </View>
    </View>
  );
}
