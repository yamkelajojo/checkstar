import { useState } from 'react';
import { View, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import Animated from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { textStyle, fontWeight, letterSpacing } from '../../theme/typography';
import { semanticSpacing, semanticRadius } from '../../theme/spacing';
import { TactilePressable } from '../../components/shared/TactilePressable';
import { AnimatedError, useErrorShake } from '../../components/shared/AnimatedError';
import { Logo } from '../../components/shared/Logo';
import { copy, formatString } from '../../lib/strings';
import { login, register, registerRider, syncCart } from '../../lib/apiClient';
import { useSession } from '../../stores/session';
import { useCart } from '../cart/store';
import { applyServerMerge } from '../cart/model';
import { useToast } from '../../components/shared/GlassToast';
import { queryClient, queryKeys } from '../../lib/queryKeys';
import type { ApiUser } from '../../lib/types';
import type { RootStackParamList } from '../../navigation/types';

type Mode = 'signin' | 'register' | 'rider';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Pushes the guest draft cart to the server right after sign-in and replaces
 * the local draft with the authoritative response, surfacing any lines the
 * server dropped. Best-effort: failures keep the local draft untouched.
 */
async function syncDraftCartAfterAuth(role: ApiUser['role'], notifyDropped: (count: number) => void): Promise<void> {
  if (role !== 'customer') return;
  const cart = useCart.getState();
  if (cart.items.length === 0) return;
  try {
    const response = await syncCart(
      cart.items.map((i) => ({ product_id: Number(i.productId), quantity: i.quantity })),
    );
    const { items, droppedCount } = applyServerMerge(cart.items, response);
    cart.mergeLocalOntoServer(items, response);
    if (droppedCount > 0) notifyDropped(droppedCount);
  } catch {
    // Keep the local draft; the server cart can be synced on the next sign-in.
  }
}

export function AuthScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const intent = (route.params as { intent?: 'checkout' | 'rider' } | undefined)?.intent;
  const signIn = useSession((s) => s.signIn);
  const toast = useToast();

  const [mode, setMode] = useState<Mode>(() => {
    if (intent === 'rider') return 'rider';
    if (intent === 'checkout') return 'signin';
    return 'register';
  });
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [vehicle, setVehicle] = useState<'bike' | 'car'>('bike');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { shake, animatedStyle } = useErrorShake();

  const isRider = mode === 'rider';
  const title = mode === 'signin' ? copy.auth.signIn : isRider ? copy.auth.registerAsRider : copy.auth.createAccount;

  const validate = (): string | null => {
    if (!EMAIL_RE.test(email)) return copy.auth.invalidEmail;
    if (mode !== 'signin') {
      if (name.trim().length === 0) return 'Enter your name.';
      if (password.length < 8) return copy.auth.shortPassword;
      if (password !== confirm) return copy.auth.mismatchPassword;
    } else if (password.length === 0) {
      return 'Enter your password.';
    }
    return null;
  };

  const submit = async () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      shake();
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      let res;
      if (mode === 'signin') {
        res = await login(email.trim(), password);
      } else if (isRider) {
        res = await registerRider({
          name: name.trim(),
          email: email.trim(),
          password,
          phone: phone.trim() || undefined,
          vehicle_type: vehicle,
        });
      } else {
        res = await register(name.trim(), email.trim(), password, phone.trim() || undefined);
      }
      const token = res.token ?? '';
      if (!token) {
        setError(copy.auth.badCredentials);
        shake();
        return;
      }
      await signIn(token, res.user);
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      void syncDraftCartAfterAuth(res.user.role, (count) => {
        toast.show(formatString(copy.cart.syncDropped, { n: count }));
      });
      if (intent === 'checkout') {
        navigation.goBack();
      } else {
        navigation.goBack();
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : copy.auth.badCredentials;
      setError(message);
      shake();
    } finally {
      setSubmitting(false);
    }
  };

  const inputTokens = theme.componentTokens.input;
  const inputStyle = {
    backgroundColor: inputTokens.background,
    borderRadius: semanticRadius.input,
    paddingHorizontal: semanticSpacing.md,
    height: 52,
    color: inputTokens.text,
    fontSize: textStyle.body.size,
    borderWidth: 1,
    borderColor: inputTokens.border,
  };

  const inputStyleFocused = {
    ...inputStyle,
    borderColor: inputTokens.focusBorder,
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.colors.background.primary }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: semanticSpacing.screenPadding, paddingTop: 64, gap: semanticSpacing.xs }} keyboardShouldPersistTaps="handled">
        <Logo variant="lockup" size={26} tone={theme.name} />
        <Text style={{ ...textStyle.h2, color: theme.colors.text.primary, marginTop: semanticSpacing.md }}>
          {title}
        </Text>
        {isRider && (
          <Text style={{ color: theme.colors.text.secondary, ...textStyle.body }}>{copy.auth.asRiderNote}</Text>
        )}

        <Animated.View style={animatedStyle}>
          {mode !== 'signin' && (
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={copy.auth.name}
              placeholderTextColor={inputTokens.placeholder}
              autoCapitalize="words"
              style={[inputStyle, { marginBottom: semanticSpacing.xs }]}
            />
          )}
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder={copy.auth.email}
            placeholderTextColor={inputTokens.placeholder}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            style={[inputStyle, { marginBottom: semanticSpacing.xs }]}
          />
          {mode !== 'signin' && (
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder={copy.auth.phoneOptional}
              placeholderTextColor={inputTokens.placeholder}
              keyboardType="phone-pad"
              autoComplete="tel"
              style={[inputStyle, { marginBottom: semanticSpacing.xs }]}
            />
          )}
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder={copy.auth.password}
            placeholderTextColor={inputTokens.placeholder}
            secureTextEntry
            autoCapitalize="none"
            style={[inputStyle, { marginBottom: semanticSpacing.xs }]}
          />
          {mode !== 'signin' && (
            <TextInput
              value={confirm}
              onChangeText={setConfirm}
              placeholder={copy.auth.confirmPassword}
              placeholderTextColor={inputTokens.placeholder}
              secureTextEntry
              autoCapitalize="none"
              style={[inputStyle, { marginBottom: semanticSpacing.xs }]}
            />
          )}
          {isRider && (
            <View style={{ flexDirection: 'row', gap: semanticSpacing.inlineGap, marginBottom: semanticSpacing.xs }}>
              {(['bike', 'car'] as const).map((v) => {
                const active = vehicle === v;
                return (
                  <TactilePressable
                    key={v}
                    onPress={() => setVehicle(v)}
                    haptic="selection"
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={{
                      flex: 1,
                      borderRadius: semanticRadius.buttonPill,
                      backgroundColor: active ? brand.orange : theme.colors.surface.primary,
                    }}
                  >
                    <Text style={{ color: active ? theme.colors.text.inverse : theme.colors.text.secondary, fontWeight: fontWeight.bold, textTransform: 'uppercase', ...textStyle.caption }}>
                      {v === 'bike' ? copy.auth.vehicleBike : copy.auth.vehicleCar}
                    </Text>
                  </TactilePressable>
                );
              })}
            </View>
          )}
        </Animated.View>

        <AnimatedError message={error} />

        <TactilePressable
          onPress={submit}
          haptic="commit"
          disabled={submitting}
          accessibilityRole="button"
          style={{ backgroundColor: theme.colors.action.primary.background, borderRadius: semanticRadius.buttonPill, marginTop: semanticSpacing.xs, opacity: submitting ? 0.6 : 1 }}
        >
          <Text style={{ color: theme.colors.action.primary.foreground, textAlign: 'center', fontWeight: fontWeight.bold, textTransform: 'uppercase', ...textStyle.buttonPrimary }}>
            {submitting ? '…' : title}
          </Text>
        </TactilePressable>

        <TactilePressable
          onPress={() => {
            setError(null);
            setMode(mode === 'signin' ? 'register' : 'signin');
          }}
          haptic="selection"
          accessibilityRole="button"
          style={{ marginTop: semanticSpacing.sm }}
        >
          <Text style={{ textAlign: 'center', color: theme.colors.text.secondary, fontWeight: fontWeight.medium, ...textStyle.bodySmall }}>
            {mode === 'signin' ? copy.auth.switchToRegister : copy.auth.switchToSignIn}
          </Text>
        </TactilePressable>

        {mode === 'register' && (
          <TactilePressable
            onPress={() => {
              setError(null);
              setMode('rider');
            }}
            haptic="selection"
            accessibilityRole="button"
          >
            <Text style={{ textAlign: 'center', color: theme.colors.text.brand, fontWeight: fontWeight.semibold, ...textStyle.bodySmall }}>
              {copy.auth.registerAsRider}
            </Text>
          </TactilePressable>
        )}
        {isRider && (
          <TactilePressable
            onPress={() => {
              setError(null);
              setMode('register');
            }}
            haptic="selection"
            accessibilityRole="button"
          >
            <Text style={{ textAlign: 'center', color: theme.colors.text.secondary, fontWeight: fontWeight.medium, ...textStyle.bodySmall }}>
              {copy.auth.backToCustomer}
            </Text>
          </TactilePressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}