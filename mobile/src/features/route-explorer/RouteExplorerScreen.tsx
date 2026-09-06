import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  AccessibilityInfo,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { StorePin } from '../../components/shared/StorePin';
import { ArrowLeft, MapPin, Navigation } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { textStyle, weights } from '../../theme/typography';
import { semanticSpacing, semanticRadius } from '../../theme/spacing';
import { useNavigation, useRoute } from '@react-navigation/native';
import { decodePolyline, computeBoundingRegion, type LatLng } from '../../lib/polyline';
import { useReducedMotion } from '../../components/shared/useReducedMotion';
import { haptic } from '../../lib/haptics';

interface RouteExplorerParams {
  storeName: string;
  storeLat?: number;
  storeLng?: number;
  deliveryAddress?: string | null;
  deliveryLat?: number;
  deliveryLng?: number;
  distanceKm?: number;
  durationMinutes?: number;
  source?: string;
  geometry?: string | null;
}

export function RouteExplorerScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const params = (route.params ?? {}) as RouteExplorerParams;
  const {
    storeName = 'Checkstar',
    storeLat,
    storeLng,
    deliveryAddress,
    deliveryLat,
    deliveryLng,
    distanceKm,
    durationMinutes,
    source,
    geometry,
  } = params;
  const reducedMotion = useReducedMotion();
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const mapRef = useRef<MapView>(null);

  const hasCoordinates =
    storeLat != null && storeLng != null && deliveryLat != null && deliveryLng != null;

  // Decode geometry
  const routePoints = useMemo<LatLng[]>(() => {
    if (!geometry) return [];
    try {
      return decodePolyline(geometry);
    } catch {
      return [];
    }
  }, [geometry]);

  // Build all points for bounding region
  const allPoints = useMemo<LatLng[]>(() => {
    const pts: LatLng[] = [];
    if (storeLat != null && storeLng != null) pts.push({ lat: storeLat, lng: storeLng });
    if (deliveryLat != null && deliveryLng != null) pts.push({ lat: deliveryLat, lng: deliveryLng });
    pts.push(...routePoints);
    return pts;
  }, [storeLat, storeLng, deliveryLat, deliveryLng, routePoints]);

  const region = useMemo(() => {
    if (allPoints.length >= 2) return computeBoundingRegion(allPoints);
    if (allPoints.length === 1) {
      return { latitude: allPoints[0].lat, longitude: allPoints[0].lng, latitudeDelta: 0.02, longitudeDelta: 0.02 };
    }
    return { latitude: -29.8587, longitude: 31.0218, latitudeDelta: 0.1, longitudeDelta: 0.1 };
  }, [allPoints]);

  // Progress animation — 2.5s from 0 to 1
  useEffect(() => {
    if (reducedMotion) {
      setProgress(1);
      progressRef.current = 1;
      return;
    }

    let frameId: number;
    let startTime: number | null = null;
    const DURATION = 2500;

    const tick = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const t = Math.min(elapsed / DURATION, 1);
      // easeOutQuart
      const eased = 1 - Math.pow(1 - t, 4);
      progressRef.current = eased;
      setProgress(eased);

      if (t < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [reducedMotion]);

  // Fit map to show both markers
  useEffect(() => {
    if (allPoints.length >= 2 && mapRef.current) {
      const timeout = setTimeout(() => {
        mapRef.current?.fitToCoordinates(
          allPoints.map((p) => ({ latitude: p.lat, longitude: p.lng })),
          { edgePadding: { top: 50, right: 50, bottom: 50, left: 50 }, animated: true },
        );
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [allPoints]);

  // Announce to screen reader
  useEffect(() => {
    if (hasCoordinates && source === 'osrm') {
      AccessibilityInfo.announceForAccessibility('Live OSRM route path active');
    }
  }, [hasCoordinates, source]);

  return (
    <View style={styles.container} accessible accessibilityRole="image" accessibilityLabel={`${storeName} to delivery route preview. ${distanceKm != null ? `${distanceKm.toFixed(1)} km, ` : ''}${durationMinutes != null ? `${durationMinutes} minutes.` : ''}`}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
              onPress={() => {
                haptic.tap();
                navigation.goBack();
              }}
              accessibilityRole="button"
              accessibilityLabel="Go back">
          <ArrowLeft size={22} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={[textStyle.h3, styles.headerTitle, { color: theme.colors.text.primary, fontWeight: weights.bold }]}>
          Delivery Route Explorer
        </Text>
      </View>

      {/* Map Preview */}
      <View style={styles.mapContainer}>
        {hasCoordinates ? (
          <MapView
            ref={mapRef}
            provider={PROVIDER_DEFAULT}
            style={styles.map}
            initialRegion={region}
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
            toolbarEnabled={false}
            cacheEnabled
          >
            {/* Store marker */}
            <Marker
              coordinate={{ latitude: storeLat!, longitude: storeLng! }}
              anchor={{ x: 0.5, y: 1 }}
              accessibilityLabel={`${storeName} store`}
            >
              <StorePin size={28} />
            </Marker>

            {/* Delivery marker */}
            <Marker
              coordinate={{ latitude: deliveryLat!, longitude: deliveryLng! }}
              anchor={{ x: 0.5, y: 0.5 }}
              accessibilityLabel={`Delivery: ${deliveryAddress || 'address'}`}
            >
              <View style={[styles.markerDot, { backgroundColor: brand.success }]} />
            </Marker>

            {/* Route polyline */}
            {routePoints.length > 1 && (
              <Polyline
                coordinates={routePoints.map((p) => ({ latitude: p.lat, longitude: p.lng }))}
                strokeColor={brand.primary}
                strokeWidth={4}
              />
            )}

            {/* Straight-line fallback */}
            {routePoints.length === 0 && (
              <Polyline
                coordinates={[
                  { latitude: storeLat!, longitude: storeLng! },
                  { latitude: deliveryLat!, longitude: deliveryLng! },
                ]}
                strokeColor={brand.primary}
                strokeWidth={2}
                lineDashPattern={[8, 4]}
              />
            )}
          </MapView>
        ) : (
          <View style={[styles.map, styles.mapFallback]}>
            <MapPin size={32} color={theme.colors.text.tertiary} />
            <Text style={[textStyle.caption, { color: theme.colors.text.tertiary, marginTop: semanticSpacing.xs }]}>
              Map unavailable — coordinates not set
            </Text>
          </View>
        )}

        {/* Metrics chips overlay */}
        {hasCoordinates && (
          <View style={styles.metricsOverlay} pointerEvents="none">
            <View style={styles.metricChip}>
              <MapPin size={14} color={brand.success} />
              <Text style={[textStyle.caption, { color: theme.colors.text.secondary, fontWeight: weights.semibold }]}>Route</Text>
              <Text style={[textStyle.body, { color: theme.colors.text.primary, fontWeight: weights.bold }]}>
                {distanceKm != null ? `${distanceKm.toFixed(2)} km` : '—'}
              </Text>
            </View>
            <View style={styles.metricChip}>
              <Navigation size={14} color={brand.orange} />
              <Text style={[textStyle.caption, { color: theme.colors.text.secondary, fontWeight: weights.semibold }]}>Time</Text>
              <Text style={[textStyle.body, { color: theme.colors.text.primary, fontWeight: weights.bold }]}>
                {durationMinutes != null ? `${durationMinutes} min` : '—'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Info cards */}
      <View style={styles.infoRow}>
        <View style={styles.infoCard} accessibilityLabel={`Store: ${storeName}`}>
          <Text style={[textStyle.caption, { color: theme.colors.text.secondary }]}>From</Text>
          <Text style={[textStyle.body, { color: theme.colors.text.primary, fontWeight: weights.semibold }]} numberOfLines={1}>
            {storeName}
          </Text>
          {storeLat != null && storeLng != null && (
            <Text style={[textStyle.caption, { color: theme.colors.text.tertiary, fontFamily: 'monospace' }]}>
              {storeLat.toFixed(4)}, {storeLng.toFixed(4)}
            </Text>
          )}
        </View>
        <View style={styles.infoCard} accessibilityLabel={`Delivery: ${deliveryAddress || 'delivery address'}`}>
          <Text style={[textStyle.caption, { color: theme.colors.text.secondary }]}>To</Text>
          <Text style={[textStyle.body, { color: theme.colors.text.primary, fontWeight: weights.semibold }]} numberOfLines={1}>
            {deliveryAddress || 'Delivery address not set'}
          </Text>
          {deliveryLat != null && deliveryLng != null && (
            <Text style={[textStyle.caption, { color: theme.colors.text.tertiary, fontFamily: 'monospace' }]}>
              {deliveryLat.toFixed(4)}, {deliveryLng.toFixed(4)}
            </Text>
          )}
        </View>
      </View>

      {/* Source indicator */}
      <Text style={[textStyle.caption, { color: theme.colors.text.tertiary, fontStyle: 'italic', textAlign: 'center' }]}>
        {source === 'osrm' ? 'Live OSRM routing' : source === 'haversine_fallback' ? 'Haversine estimate' : 'Route preview'}
      </Text>

      {/* Route progress indicator */}
      <View
        style={styles.progressContainer}
        accessibilityLabel={`Route progress: ${Math.round(progress * 100)} percent`}
        accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
      >
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
        <Text style={[textStyle.caption, { marginTop: semanticSpacing.xs, textAlign: 'center', color: theme.colors.text.secondary }]}>
          {Math.round(progress * 100)}% route explored
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e14',
    padding: semanticSpacing.md,
    gap: semanticSpacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: semanticSpacing.sm,
    paddingBottom: semanticSpacing.xs,
  },
  headerTitle: {
    flex: 1,
  },
  mapContainer: {
    height: 260,
    borderRadius: semanticRadius.card,
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapFallback: {
    backgroundColor: '#1a1f2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  metricsOverlay: {
    position: 'absolute',
    top: semanticSpacing.sm,
    right: semanticSpacing.sm,
    flexDirection: 'row',
    gap: semanticSpacing.xs,
  },
  metricChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: semanticSpacing.xxs,
    backgroundColor: 'rgba(10, 14, 20, 0.85)',
    paddingHorizontal: semanticSpacing.sm,
    paddingVertical: semanticSpacing.xxs,
    borderRadius: semanticRadius.chip,
  },
  infoRow: {
    flexDirection: 'row',
    gap: semanticSpacing.md,
  },
  infoCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: semanticRadius.input,
    padding: semanticSpacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  progressContainer: {
    marginTop: semanticSpacing.xs,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: brand.success,
  },
});
