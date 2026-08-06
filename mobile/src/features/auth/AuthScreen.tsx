import { useState } from 'react';
import { View, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import Animated from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { typeScale, weights, letterSpacing } from '../../theme/typography';
import { TactilePressable } from '../../components/shared/TactilePressable';
import { AnimatedError, useErrorShake } from '../../components/shared/AnimatedError';
import { Logo } from '../../components/shared/Logo';
import { copy } from '../../lib/strings';
import { login, register, registerRider } from '../../lib/apiClient';
import { useSession } from '../../stores/session';
import { useToast } from '../../components/shared/GlassToast';
import { queryClient, queryKeys } from '../../lib/queryKeys';
import type { RootStackParamList } from '../../navigation/types';

type Mode = 'signin' | 'register' | 'rider';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const intent = (route.params as { intent?: 'checkout' } | undefined)?.intent;
  const signIn = useSession((s) => s.signIn);
  const toast = useToast();

  const [mode, setMode] = useState<Mode>(intent === 'checkout' ? 'signin' : 'register');
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
      await signIn(token, res.user);
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      if (intent === 'checkout') {
        navigation.goBack();
      } else {
        navigation.navigate('Tabs');
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : copy.auth.badCredentials;
      setError(message);
      shake();
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    color: theme.colors.text,
    fontSize: typeScale.body,
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 64, gap: 8 }} keyboardShouldPersistTaps="handled">
        <Logo variant="lockup" size={26} tone={theme.name === 'dark' ? 'light' : 'dark'} />
        <Text style={{ fontSize: typeScale.title, fontWeight: weights.extrabold, color: theme.colors.text, marginTop: 16 }}>
          {title}
        </Text>
        {isRider && (
          <Text style={{ color: theme.colors.textMuted, fontSize: typeScale.body }}>{copy.auth.asRiderNote}</Text>
        )}

        <Animated.View style={animatedStyle}>
          {mode !== 'signin' && (
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={copy.auth.name}
              placeholderTextColor={theme.colors.textFaint}
              autoCapitalize="words"
              style={[inputStyle, { marginBottom: 10 }]}
            />
          )}
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder={copy.auth.email}
            placeholderTextColor={theme.colors.textFaint}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            style={[inputStyle, { marginBottom: 10 }]}
          />
          {mode !== 'signin' && (
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder={copy.auth.phoneOptional}
              placeholderTextColor={theme.colors.textFaint}
              keyboardType="phone-pad"
              autoComplete="tel"
              style={[inputStyle, { marginBottom: 10 }]}
            />
          )}
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder={copy.auth.password}
            placeholderTextColor={theme.colors.textFaint}
            secureTextEntry
            autoCapitalize="none"
            style={[inputStyle, { marginBottom: 10 }]}
          />
          {mode !== 'signin' && (
            <TextInput
              value={confirm}
              onChangeText={setConfirm}
              placeholder={copy.auth.confirmPassword}
              placeholderTextColor={theme.colors.textFaint}
              secureTextEntry
              autoCapitalize="none"
              style={[inputStyle, { marginBottom: 10 }]}
            />
          )}
          {isRider && (
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              {(['bike', 'car'] as const).map((v) => {
                const active = vehicle === v;
                return (
                  <TactilePressable
                    key={v}
                    onPress={() => setVehicle(v)}
                    hapticOnPress="selection"
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={{
                      flex: 1,
                      borderRadius: 999,
                      backgroundColor: active ? brand.primary : theme.colors.surface,
                    }}
                  >
                    <Text style={{ color: active ? '#fff' : theme.colors.textMuted, fontWeight: weights.bold, textTransform: 'uppercase', letterSpacing: letterSpacing.wide, fontSize: typeScale.caption }}>
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
          hapticOnPress="commit"
          disabled={submitting}
          accessibilityRole="button"
          style={{ backgroundColor: brand.primary, borderRadius: 999, marginTop: 8, opacity: submitting ? 0.6 : 1 }}
        >
          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: weights.bold, textTransform: 'uppercase', letterSpacing: letterSpacing.wide }}>
            {submitting ? '…' : title}
          </Text>
        </TactilePressable>

        <TactilePressable
          onPress={() => {
            setError(null);
            setMode(mode === 'signin' ? 'register' : 'signin');
          }}
          hapticOnPress="selection"
          accessibilityRole="button"
          style={{ marginTop: 12 }}
        >
          <Text style={{ textAlign: 'center', color: theme.colors.textMuted, fontWeight: weights.medium }}>
            {mode === 'signin' ? copy.auth.switchToRegister : copy.auth.switchToSignIn}
          </Text>
        </TactilePressable>

        {mode === 'register' && (
          <TactilePressable
            onPress={() => {
              setError(null);
              setMode('rider');
            }}
            hapticOnPress="selection"
            accessibilityRole="button"
          >
            <Text style={{ textAlign: 'center', color: brand.primary, fontWeight: weights.semibold }}>
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
            hapticOnPress="selection"
            accessibilityRole="button"
          >
            <Text style={{ textAlign: 'center', color: theme.colors.textMuted, fontWeight: weights.medium }}>
              {copy.auth.backToCustomer}
            </Text>
          </TactilePressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
