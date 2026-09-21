import { useState } from 'react';
import { View, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import Animated from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { textStyle, fontWeight } from '../../theme/typography';
import { semanticSpacing, semanticRadius } from '../../theme/spacing';
import { TactilePressable } from '../../components/shared/TactilePressable';
import { AnimatedError, useErrorShake } from '../../components/shared/AnimatedError';
import { Logo } from '../../components/shared/Logo';
import { FadeSlideIn } from '../../components/shared/FadeSlideIn';
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

async function syncDraftCartAfterAuth(role: ApiUser['role'], notifyDropped: (count: number) => void): Promise<void> {
  if (role !== 'customer') return;
  const cart = useCart.getState();
  if (cart.items.length === 0) return;
  try {
    const response = await syncCart(cart.items.map((i) => ({ product_id: Number(i.productId), quantity: i.quantity })));
    const { items, droppedCount } = applyServerMerge(cart.items, response);
    cart.mergeLocalOntoServer(items, response);
    if (droppedCount > 0) notifyDropped(droppedCount);
  } catch {}
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
    } else if (password.length === 0) return 'Enter your password.';
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
      if (mode === 'signin') res = await login(email.trim(), password);
      else if (isRider) res = await registerRider({ name: name.trim(), email: email.trim(), password, phone: phone.trim() || undefined, vehicle_type: vehicle });
      else res = await register(name.trim(), email.trim(), password, phone.trim() || undefined);
      const token = res.token ?? '';
      if (!token) {
        setError(copy.auth.badCredentials);
        shake();
        return;
      }
      await signIn(token, res.user);
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      void syncDraftCartAfterAuth(res.user.role, (count) => toast.show(formatString(copy.cart.syncDropped, { n: count })));
      navigation.goBack();
    } catch (e) {
      const message = e instanceof Error ? e.message : copy.auth.badCredentials;
      setError(message);
      shake();
    } finally {
      setSubmitting(false);
    }
  };

  const inputTokens = theme.componentTokens.input;
  const baseInput = {
    backgroundColor: theme.colors.surface.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    color: theme.colors.text.primary,
    fontSize: 13,
    letterSpacing: -0.1,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.colors.background.primary }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: semanticSpacing.screenPadding, paddingTop: 64, gap: 16 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <FadeSlideIn delay={60} distance={12} initialScale={0.96}>
          <Logo variant="lockup" size={24} tone={theme.name} />
        </FadeSlideIn>

        <FadeSlideIn delay={100} distance={10}>
          <View style={{ gap: 6 }}>
            <Text style={{ ...textStyle.h2, color: theme.colors.text.primary, letterSpacing: -0.3, fontWeight: fontWeight.bold }}>{title}</Text>
            {isRider ? <Text style={{ color: theme.colors.text.secondary, fontSize: 13, lineHeight: 18 }}>{copy.auth.asRiderNote}</Text> : null}
          </View>
        </FadeSlideIn>

        <FadeSlideIn delay={140} distance={10}>
          <Animated.View style={[{ gap: 10 }, animatedStyle]}>
            {mode !== 'signin' && (
              <TextInput value={name} onChangeText={setName} placeholder={copy.auth.name} placeholderTextColor={theme.colors.text.tertiary} autoCapitalize="words" style={baseInput} />
            )}
            <TextInput value={email} onChangeText={setEmail} placeholder={copy.auth.email} placeholderTextColor={theme.colors.text.tertiary} keyboardType="email-address" autoCapitalize="none" autoComplete="email" style={baseInput} />
            {mode !== 'signin' && (
              <TextInput value={phone} onChangeText={setPhone} placeholder={copy.auth.phoneOptional} placeholderTextColor={theme.colors.text.tertiary} keyboardType="phone-pad" autoComplete="tel" style={baseInput} />
            )}
            <TextInput value={password} onChangeText={setPassword} placeholder={copy.auth.password} placeholderTextColor={theme.colors.text.tertiary} secureTextEntry autoCapitalize="none" style={baseInput} />
            {mode !== 'signin' && (
              <TextInput value={confirm} onChangeText={setConfirm} placeholder={copy.auth.confirmPassword} placeholderTextColor={theme.colors.text.tertiary} secureTextEntry autoCapitalize="none" style={baseInput} />
            )}
            {isRider && (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                {(['bike', 'car'] as const).map((v) => {
                  const active = vehicle === v;
                  return (
                    <TactilePressable
                      key={v}
                      onPress={() => setVehicle(v)}
                      haptic="selection"
                      style={{
                        flex: 1,
                        borderRadius: 999,
                        paddingVertical: 12,
                        alignItems: 'center',
                        backgroundColor: active ? theme.colors.text.primary : theme.colors.surface.primary,
                        borderWidth: 1,
                        borderColor: active ? theme.colors.text.primary : theme.colors.border.subtle,
                      }}
                    >
                      <Text style={{ color: active ? theme.colors.text.inverse : theme.colors.text.secondary, fontWeight: '700', fontSize: 11, letterSpacing: 0.3, textTransform: 'uppercase' }}>
                        {v === 'bike' ? copy.auth.vehicleBike : copy.auth.vehicleCar}
                      </Text>
                    </TactilePressable>
                  );
                })}
              </View>
            )}
          </Animated.View>
        </FadeSlideIn>

        <FadeSlideIn delay={180} distance={8}>
          <AnimatedError message={error} />
        </FadeSlideIn>

        <FadeSlideIn delay={200} distance={8}>
          <TactilePressable
            onPress={submit}
            haptic="commit"
            disabled={submitting}
            style={{
              backgroundColor: theme.colors.text.primary,
              borderRadius: 999,
              paddingVertical: 14,
              alignItems: 'center',
              opacity: submitting ? 0.6 : 1,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <Text style={{ color: theme.colors.text.inverse, fontWeight: '700', fontSize: 12, letterSpacing: 0.3, textTransform: 'uppercase' }}>{submitting ? '…' : title}</Text>
          </TactilePressable>
        </FadeSlideIn>

        <FadeSlideIn delay={240} distance={8}>
          <View style={{ gap: 12, marginTop: 8 }}>
            <TactilePressable onPress={() => { setError(null); setMode(mode === 'signin' ? 'register' : 'signin'); }} haptic="selection" style={{ alignItems: 'center', paddingVertical: 8 }}>
              <Text style={{ color: theme.colors.text.secondary, fontWeight: '500', fontSize: 13 }}>{mode === 'signin' ? copy.auth.switchToRegister : copy.auth.switchToSignIn}</Text>
            </TactilePressable>

            {mode === 'register' && (
              <TactilePressable onPress={() => { setError(null); setMode('rider'); }} haptic="selection" style={{ alignItems: 'center', paddingVertical: 8, backgroundColor: brand.orange + '10', borderRadius: 12, borderWidth: 1, borderColor: brand.orange + '20' }}>
                <Text style={{ color: brand.orange, fontWeight: '600', fontSize: 12 }}>{copy.auth.registerAsRider}</Text>
              </TactilePressable>
            )}

            {isRider && (
              <TactilePressable onPress={() => { setError(null); setMode('register'); }} haptic="selection" style={{ alignItems: 'center', paddingVertical: 8 }}>
                <Text style={{ color: theme.colors.text.secondary, fontWeight: '500', fontSize: 13 }}>{copy.auth.backToCustomer}</Text>
              </TactilePressable>
            )}
          </View>
        </FadeSlideIn>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
