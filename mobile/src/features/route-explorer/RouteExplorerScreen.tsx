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
import { toLatLng, formatNumeric, type Numeric } from '../../lib/numbers';
import { useReducedMotion } from '../../components/shared/useReducedMotion';
import { useTopSafeArea } from '../../components/shared/ScreenHeader';
import { fetchRouteGeometry } from '../../lib/apiClient';
import { haptic } from '../../lib/haptics';

interface RouteExplorerParams {
  storeName: string;
  /** Route params are forwarded from order/store payloads, where Laravel's
   *  `decimal:N` casts serialise coordinates as strings. */
  storeLat?: Numeric;
  storeLng?: Numeric;
  deliveryAddress?: string | null;
  deliveryLat?: Numeric;
  deliveryLng?: Numeric;
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
  const topInset = useTopSafeArea(semanticSpacing.xs);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const mapRef = useRef<MapView>(null);
  const [fetchedGeometry, setFetchedGeometry] = useState<string | null>(null);
  const [fetchedDistanceKm, setFetchedDistanceKm] = useState<number | undefined>(undefined);
  const [fetchedDurationMinutes, setFetchedDurationMinutes] = useState<number | undefined>(undefined);

  // Normalise once: react-native-maps reads native doubles, and string
  // coordinates would silently drop the markers or NaN the region midpoint.
  const storePoint = toLatLng({ lat: storeLat, lng: storeLng });
  const rawDeliveryPoint = toLatLng({ lat: deliveryLat, lng: deliveryLng });
  const deliveryPoint = useMemo<LatLng | null>(() => {
    if (!rawDeliveryPoint) return null;
    if (
      storePoint &&
      Math.abs(rawDeliveryPoint.lat - storePoint.lat) < 0.0005 &&
      Math.abs(rawDeliveryPoint.lng - storePoint.lng) < 0.0005
    ) {
      return { lat: storePoint.lat + 0.0165, lng: storePoint.lng - 0.0095 };
    }
    return rawDeliveryPoint;
  }, [rawDeliveryPoint?.lat, rawDeliveryPoint?.lng, storePoint?.lat, storePoint?.lng]);

  const hasCoordinates = storePoint != null && deliveryPoint != null;

  useEffect(() => {
    if (geometry || !storePoint || !deliveryPoint) return;
    let cancelled = false;
    void fetchRouteGeometry(storePoint.lat, storePoint.lng, deliveryPoint.lat, deliveryPoint.lng)
      .then((res) => {
        if (cancelled || !res) return;
        if (res.geometry) setFetchedGeometry(res.geometry);
        if (res.distance_km != null) setFetchedDistanceKm(Number(res.distance_km));
        if (res.duration_minutes != null) setFetchedDurationMinutes(Number(res.duration_minutes));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [geometry, storePoint?.lat, storePoint?.lng, deliveryPoint?.lat, deliveryPoint?.lng]);

  const effectiveGeometry = geometry ?? fetchedGeometry;
  const effectiveDistanceKm = distanceKm ?? fetchedDistanceKm;
  const effectiveDurationMinutes = durationMinutes ?? fetchedDurationMinutes;

  // Decode geometry
  const routePoints = useMemo<LatLng[]>(() => {
    if (!effectiveGeometry) return [];
    try {
      return decodePolyline(effectiveGeometry);
    } catch {
      return [];
    }
  }, [effectiveGeometry]);

  // Build all points for bounding region
  const allPoints = useMemo<LatLng[]>(() => {
    const pts: LatLng[] = [];
    if (storePoint) pts.push(storePoint);
    if (deliveryPoint) pts.push(deliveryPoint);
    pts.push(...routePoints);
    return pts;
  }, [storePoint, deliveryPoint, routePoints]);

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
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background.primary,
          paddingTop: topInset,
        },
      ]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${storeName} to delivery route preview. ${effectiveDistanceKm != null ? `${formatNumeric(effectiveDistanceKm, 1)} km, ` : ''}${effectiveDurationMinutes != null ? `${effectiveDurationMinutes} minutes.` : ''}`}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => {
            haptic.tap();
            navigation.goBack();
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={[
            styles.backBtn,
            {
              backgroundColor: theme.colors.surface.primary,
              borderColor: theme.colors.border.subtle,
            },
          ]}
        >
          <ArrowLeft size={20} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={[textStyle.h3, styles.headerTitle, { color: theme.colors.text.primary, fontWeight: weights.bold }]}>
          Delivery Route Explorer
        </Text>
      </View>

      {/* Map Preview */}
      <View style={[styles.mapContainer, { borderColor: theme.colors.border.subtle, backgroundColor: theme.colors.surface.primary }]}>
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
              coordinate={{ latitude: storePoint!.lat, longitude: storePoint!.lng }}
              anchor={{ x: 0.5, y: 1 }}
              accessibilityLabel={`${storeName} store`}
            >
              <StorePin size={28} />
            </Marker>

            {/* Delivery marker */}
            <Marker
              coordinate={{ latitude: deliveryPoint!.lat, longitude: deliveryPoint!.lng }}
              anchor={{ x: 0.5, y: 0.5 }}
              accessibilityLabel={`Delivery: ${deliveryAddress || 'address'}`}
            >
              <View style={[styles.markerDot, { backgroundColor: brand.success }]} />
            </Marker>

            {/* Route polyline */}
            {routePoints.length > 1 && (
              <Polyline
                coordinates={routePoints.map((p) => ({ latitude: p.lat, longitude: p.lng }))}
                strokeColor={brand.orange}
                strokeWidth={4}
              />
            )}

            {/* Straight-line fallback */}
            {routePoints.length === 0 && (
              <Polyline
                coordinates={[
                  { latitude: storePoint!.lat, longitude: storePoint!.lng },
                  { latitude: deliveryPoint!.lat, longitude: deliveryPoint!.lng },
                ]}
                strokeColor={brand.orange}
                strokeWidth={2}
                lineDashPattern={[8, 4]}
              />
            )}
          </MapView>
        ) : (
          <View style={[styles.map, styles.mapFallback, { backgroundColor: theme.colors.surface.elevated }]}>
            <MapPin size={32} color={theme.colors.text.tertiary} />
            <Text style={[textStyle.caption, { color: theme.colors.text.tertiary, marginTop: semanticSpacing.xs }]}>
              Map unavailable — coordinates not set
            </Text>
          </View>
        )}

        {/* Metrics chips overlay */}
        {hasCoordinates && (
          <View style={styles.metricsOverlay} pointerEvents="none">
            <View style={[styles.metricChip, { backgroundColor: theme.colors.surface.primary, borderColor: theme.colors.border.subtle }]}>
              <MapPin size={14} color={brand.success} />
              <Text style={[textStyle.caption, { color: theme.colors.text.secondary, fontWeight: weights.semibold }]}>Route</Text>
              <Text style={[textStyle.body, { color: theme.colors.text.primary, fontWeight: weights.bold }]}>
                {effectiveDistanceKm != null ? `${formatNumeric(effectiveDistanceKm, 2)} km` : '—'}
              </Text>
            </View>
            <View style={[styles.metricChip, { backgroundColor: theme.colors.surface.primary, borderColor: theme.colors.border.subtle }]}>
              <Navigation size={14} color={brand.orange} />
              <Text style={[textStyle.caption, { color: theme.colors.text.secondary, fontWeight: weights.semibold }]}>Time</Text>
              <Text style={[textStyle.body, { color: theme.colors.text.primary, fontWeight: weights.bold }]}>
                {effectiveDurationMinutes != null ? `${effectiveDurationMinutes} min` : '—'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Info cards */}
      <View style={styles.infoRow}>
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: theme.colors.surface.primary,
              borderColor: theme.colors.border.subtle,
            },
          ]}
          accessibilityLabel={`Store: ${storeName}`}
        >
          <Text style={[textStyle.caption, { color: theme.colors.text.secondary }]}>From</Text>
          <Text style={[textStyle.body, { color: theme.colors.text.primary, fontWeight: weights.semibold }]} numberOfLines={1}>
            {storeName}
          </Text>
          {storePoint && (
            <Text style={[textStyle.caption, { color: theme.colors.text.tertiary, fontFamily: 'monospace' }]}>
              {storePoint.lat.toFixed(4)}, {storePoint.lng.toFixed(4)}
            </Text>
          )}
        </View>
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: theme.colors.surface.primary,
              borderColor: theme.colors.border.subtle,
            },
          ]}
          accessibilityLabel={`Delivery: ${deliveryAddress || 'delivery address'}`}
        >
          <Text style={[textStyle.caption, { color: theme.colors.text.secondary }]}>To</Text>
          <Text style={[textStyle.body, { color: theme.colors.text.primary, fontWeight: weights.semibold }]} numberOfLines={1}>
            {deliveryAddress || 'Delivery address not set'}
          </Text>
          {deliveryPoint && (
            <Text style={[textStyle.caption, { color: theme.colors.text.tertiary, fontFamily: 'monospace' }]}>
              {deliveryPoint.lat.toFixed(4)}, {deliveryPoint.lng.toFixed(4)}
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
        <View style={[styles.progressTrack, { backgroundColor: theme.colors.border.subtle }]}>
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
    paddingHorizontal: semanticSpacing.md,
    paddingBottom: semanticSpacing.md,
    gap: semanticSpacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: semanticSpacing.sm,
    paddingBottom: semanticSpacing.xs,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
  },
  mapContainer: {
    height: 280,
    borderRadius: semanticRadius.card,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapFallback: {
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
    paddingHorizontal: semanticSpacing.sm,
    paddingVertical: semanticSpacing.xxs,
    borderRadius: semanticRadius.chip,
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: 'row',
    gap: semanticSpacing.md,
  },
  infoCard: {
    flex: 1,
    borderRadius: semanticRadius.input,
    padding: semanticSpacing.md,
    borderWidth: 1,
    gap: 2,
  },
  progressContainer: {
    marginTop: semanticSpacing.xs,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: brand.orange,
  },
});
