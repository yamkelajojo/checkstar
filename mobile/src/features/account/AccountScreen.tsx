import { View, Text, FlatList, TextInput, Alert, Platform } from 'react-native';
import { LogOut, Package, Settings, Wifi, WifiOff } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { textStyle, fontWeight } from '../../theme/typography';
import { semanticSpacing, semanticRadius } from '../../theme/spacing';
import { useSession } from '../../stores/session';
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

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

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

  const { data: orders = [] } = useQuery({
    queryKey: queryKeys.orders,
    queryFn: fetchOrders,
    enabled: status === 'authenticated',
  });

  const name = user?.name ?? 'Guest';

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      <View style={{ paddingTop: 56, paddingHorizontal: semanticSpacing.screenPadding, gap: semanticSpacing.inlineGap }}>
        <Logo variant="lockup" size={26} tone={theme.name} />
        <Text style={{ ...textStyle.h3, fontWeight: fontWeight.bold, color: theme.colors.text.primary }}>
          {name}
        </Text>
        {status === 'authenticated' ? (
          <TactilePressable
            onPress={async () => {
              await signOut();
              toast.show('Signed out');
            }}
            haptic="tap"
            accessibilityRole="button"
            style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: semanticSpacing.xxs }}
          >
            <LogOut size={16} color={theme.colors.text.secondary} />
            <Text style={{ color: theme.colors.text.secondary, ...textStyle.bodySmall }}>Sign out</Text>
          </TactilePressable>
        ) : (
          <TactilePressable
            onPress={() => navigation.navigate('Auth')}
            haptic="commit"
            style={{ backgroundColor: brand.orange, borderRadius: semanticRadius.buttonPill, paddingHorizontal: semanticSpacing.lg, alignSelf: 'flex-start' }}
          >
            <Text style={{ color: theme.colors.text.inverse, fontWeight: fontWeight.bold, ...textStyle.buttonPrimary }}>Sign in</Text>
          </TactilePressable>
        )}
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

      {__DEV__ && (
        <DebugSection
          theme={theme}
          toast={toast}
          getLocalIp={getLocalIp}
        />
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

import React from 'react';