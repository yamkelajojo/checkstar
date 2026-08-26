import { createContext, useCallback, useContext, useRef, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { brand } from '../../theme/colors';
import { useReducedMotion } from './useReducedMotion';
import { haptic } from '../../lib/haptics';
import { textStyle } from '../../theme/typography';
import { semanticRadius } from '../../theme/spacing';

type ToastTone = 'default' | 'success' | 'warning';

interface ToastOptions {
  tone?: ToastTone;
}

interface ToastContextValue {
  show: (message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue>({ show: () => {} });

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}

interface ToastState {
  id: number;
  message: string;
  tone: ToastTone;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const idRef = useRef(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((message: string, options?: ToastOptions) => {
    const id = ++idRef.current;
    const tone = options?.tone ?? 'default';
    if (tone === 'success') void haptic.success();
    if (tone === 'warning') void haptic.warning();
    setToast({ id, message, tone });
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setToast((current) => (current?.id === id ? null : current)), 2600);
  }, []);

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  const toneColor =
    toast?.tone === 'success'
      ? brand.success
      : toast?.tone === 'warning'
        ? brand.warning
        : brand.orange;

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast ? <ToastCard key={toast.id} toast={toast} color={toneColor} /> : null}
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, color }: { toast: ToastState; color: string }) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(reduceMotion ? 1 : 0);
  const translateY = useSharedValue(reduceMotion ? 0 : 16);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 250 });
    translateY.value = withTiming(0, { duration: 250 });
    if (!reduceMotion) {
      opacity.value = withDelay(2250, withTiming(0, { duration: 250 }));
    }
  }, [opacity, translateY, reduceMotion, toast.id]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] }));

  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 16, right: 16, top: 60, alignItems: 'center' }}>
      <Animated.View style={style}>
        <BlurView intensity={70} tint="systemMaterialDark" style={{ borderRadius: semanticRadius.card, overflow: 'hidden' }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              paddingHorizontal: 18,
              paddingVertical: 14,
              borderWidth: 1,
              borderColor: 'rgba(120,120,128,0.24)',
              borderRadius: semanticRadius.card,
            }}
          >
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
            <Text style={{ color: '#fff', ...textStyle.bodySmall, fontWeight: '600', flexShrink: 1 }}>{toast.message}</Text>
          </View>
        </BlurView>
      </Animated.View>
    </View>
  );
}