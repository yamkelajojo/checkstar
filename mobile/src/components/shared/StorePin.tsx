import { View, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import { brand } from '../../theme/colors';

/**
 * Brand store pin — an orange teardrop with the checkstar star, matching the
 * orange checkstar pin used on the web store locator. Pure views, no SVG, so
 * it renders identically in jsdom snapshot and on device.
 */
export function StorePin({ size = 30 }: { size?: number }) {
  const star = Math.round(size * 0.55);
  const tail = Math.round(size * 0.4);
  return (
    <View
      style={{
        width: size,
        height: size + tail / 2,
        alignItems: 'center',
        justifyContent: 'flex-start',
      }}
      pointerEvents="none"
    >
      {/* Tail — plain orange, half hidden behind the circle */}
      <View
        style={{
          position: 'absolute',
          top: size - tail / 2 - 2,
          width: tail,
          height: tail,
          borderRadius: 2,
          backgroundColor: brand.primary,
          transform: [{ rotate: '45deg' }],
        }}
      />
      {/* Head — orange circle with white star + white ring */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: brand.primary,
          borderWidth: 2,
          borderColor: '#fff',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.25,
          shadowRadius: 2,
          elevation: 3,
        }}
      >
        <Star size={star} color="#fff" fill="#fff" />
      </View>
    </View>
  );
}
