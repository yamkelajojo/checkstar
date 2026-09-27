import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { StorePin } from './StorePin';
import { useQuery } from '@tanstack/react-query';
import { Navigation, Clock, MapPin, WifiOff, Hourglass } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  cancelAnimation,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { textStyle, fontWeight, weights } from '../../theme/typography';
import { semanticSpacing, semanticRadius } from '../../theme/spacing';
import { springs } from '../../theme/motion';
import { fetchOrderRiderLocation, fetchRouteGeometry } from '../../lib/apiClient';
import { queryKeys } from '../../lib/queryKeys';
import { decodePolyline, computeBoundingRegion, type LatLng } from '../../lib/polyline';
import { toLatLng, formatNumeric, type Numeric } from '../../lib/numbers';
import { formatTime } from '../../lib/formatters';
import { useReducedMotion } from './useReducedMotion';

const DURBAN_CBD: LatLng = { lat: -29.8587, lng: 31.0218 };

const LOCATION_POLL_MS = 5_000;
const STALE_THRESHOLD_MS = 90_000;

interface LiveDeliveryMapProps {
  orderId: number;
  orderStatus?: string;
  storeName: string;
  /**
   * Coordinates, distance and duration come from the API as Laravel
   * `decimal:N` casts — i.e. strings like "-29.8350000". They are coerced to
   * numbers before reaching react-native-maps, whose native side reads doubles.
   */
  storeLat?: Numeric;
  storeLng?: Numeric;
  deliveryAddress?: string | null;
  deliveryLat?: Numeric;
  deliveryLng?: Numeric;
  distanceKm?: Numeric;
  durationMinutes?: Numeric;
  geometry?: string | null;
  riderName?: string | null;
  mapHeight?: number;
}

export function LiveDeliveryMap({
  orderId,
  orderStatus,
  storeName,
  storeLat,
  storeLng,
  deliveryAddress,
  deliveryLat,
  deliveryLng,
  distanceKm,
  durationMinutes,
  geometry,
  riderName,
  mapHeight = 320,
}: LiveDeliveryMapProps) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const mapRef = useRef<MapView>(null);
  const [hasFitted, setHasFitted] = useState(false);

  // Normalise the two fixed endpoints once. Everything downstream (geometry
  // fetch, bounding region, markers, polylines) uses these numeric pairs, so a
  // decimal string can never reach the native map or a region midpoint.
  const storePoint = toLatLng({ lat: storeLat, lng: storeLng });
  const deliveryPoint = toLatLng({ lat: deliveryLat, lng: deliveryLng });

  // Poll rider location — stop when screen loses focus
  const { data: riderLocation } = useQuery({
    queryKey: [...queryKeys.order(orderId), 'rider-location'],
    queryFn: () => fetchOrderRiderLocation(orderId),
    refetchInterval: LOCATION_POLL_MS,
    refetchIntervalInBackground: false,
  });

  // Fetch route geometry if not provided — store -> delivery
  const { data: fetchedGeometry } = useQuery({
    queryKey: [...queryKeys.order(orderId), 'route-geometry', storePoint?.lat, storePoint?.lng, deliveryPoint?.lat, deliveryPoint?.lng],
    queryFn: async () => {
      if (!storePoint || !deliveryPoint) return null
      try {
        const res = await fetchRouteGeometry(storePoint.lat, storePoint.lng, deliveryPoint.lat, deliveryPoint.lng)
        return res.geometry || null
      } catch {
        return null
      }
    },
    enabled: !geometry && storePoint != null && deliveryPoint != null,
    staleTime: 5 * 60 * 1000,
  });

  const effectiveGeometry = geometry || fetchedGeometry || null

  // Compute staleness from recorded_at
  const isStale = useMemo(() => {
    if (!riderLocation?.recorded_at) return false;
    return Date.now() - new Date(riderLocation.recorded_at).getTime() > STALE_THRESHOLD_MS;
  }, [riderLocation]);

  const hasRider = riderLocation != null;

  // Animated rider marker
  const riderOpacity = useSharedValue(riderLocation ? 1 : 0);
  const riderScale = useSharedValue(riderLocation ? 1 : 0.5);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (riderLocation) {
      if (reducedMotion) {
        riderOpacity.value = 1;
        riderScale.value = 1;
      } else {
        riderOpacity.value = withSpring(1, springs.gentle);
        riderScale.value = withSpring(1, springs.gentle);
      }
    }
  }, [riderLocation, reducedMotion]);

  // Pulse animation when rider is live and not stale
  useEffect(() => {
    if (reducedMotion || !hasRider || isStale) {
      cancelAnimation(pulseScale);
      pulseScale.value = 1;
      return;
    }
    pulseScale.value = withRepeat(
      withTiming(1.6, { duration: 1200, easing: Easing.out(Easing.cubic) }),
      -1,
      true,
    );
    return () => cancelAnimation(pulseScale);
  }, [hasRider, isStale, reducedMotion]);

  const animatedRiderStyle = useAnimatedStyle(() => ({
    opacity: riderOpacity.value,
    transform: [{ scale: riderScale.value }],
  }));

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: interpolate(pulseScale.value, [1, 1.6], [0.35, 0]),
  }));

  // Decode route geometry
  const routePoints = useMemo<LatLng[]>(() => {
    if (!effectiveGeometry) return [];
    try {
      return decodePolyline(effectiveGeometry);
    } catch {
      return [];
    }
  }, [effectiveGeometry]);

  // The rider's live position is polled from the API, so it carries the same
  // decimal-string coordinates; normalise it the same way.
  const riderPoint = toLatLng({ lat: riderLocation?.latitude, lng: riderLocation?.longitude });

  // All points for bounding region
  const allPoints = useMemo<LatLng[]>(() => {
    const pts: LatLng[] = [];
    if (storePoint) pts.push(storePoint);
    if (deliveryPoint) pts.push(deliveryPoint);
    if (riderPoint) pts.push(riderPoint);
    pts.push(...routePoints);
    return pts;
  }, [storePoint, deliveryPoint, riderPoint, routePoints]);

  const region = useMemo(() => {
    if (allPoints.length >= 2) return computeBoundingRegion(allPoints);
    if (allPoints.length === 1) {
      return { latitude: allPoints[0].lat, longitude: allPoints[0].lng, latitudeDelta: 0.02, longitudeDelta: 0.02 };
    }
    return { latitude: DURBAN_CBD.lat, longitude: DURBAN_CBD.lng, latitudeDelta: 0.1, longitudeDelta: 0.1 };
  }, [allPoints]);

  // Fit map to show all markers after first rider location arrives
  useEffect(() => {
    if (!hasFitted && allPoints.length >= 2 && mapRef.current) {
      const timeout = setTimeout(() => {
        mapRef.current?.fitToCoordinates(
          allPoints.map((p) => ({ latitude: p.lat, longitude: p.lng })),
          { edgePadding: { top: 60, right: 60, bottom: 60, left: 60 }, animated: true },
        );
        setHasFitted(true);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [allPoints, hasFitted]);

  const hasCoords = storePoint != null && deliveryPoint != null;
  const isPreparing = orderStatus === 'confirmed' || orderStatus === 'preparing';
  const isWaitingForRider = isPreparing && !hasRider;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface.primary }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Navigation size={18} color={brand.orange} />
          <Text style={[textStyle.body, { fontWeight: weights.bold, color: theme.colors.text.primary }]}>
            {isWaitingForRider ? 'Preparing Order' : 'Live Tracking'}
          </Text>
        </View>
        {isWaitingForRider ? (
          <View style={[styles.liveIndicator, { backgroundColor: theme.colors.status.warning.soft }]}>
            <Hourglass size={12} color={theme.colors.status.warning.primary} />
            <Text style={[textStyle.micro, { fontWeight: weights.semibold, color: theme.colors.status.warning.primary }]}>
              Waiting for rider
            </Text>
          </View>
        ) : hasRider ? (
          <View style={[styles.liveIndicator, { backgroundColor: isStale ? brand.warning : brand.success }]}>
            {isStale ? (
              <WifiOff size={10} color="#fff" />
            ) : (
              <View style={styles.liveDot} />
            )}
            <Text style={[textStyle.micro, { color: '#fff', fontWeight: weights.semibold }]}>
              {isStale ? 'STALE' : 'LIVE'}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Map */}
      <View style={[styles.mapContainer, { height: mapHeight }]}>
        {hasCoords ? (
          <MapView
            ref={mapRef}
            provider={PROVIDER_DEFAULT}
            style={styles.map}
            initialRegion={region}
            showsUserLocation={false}
            showsMyLocationButton={false}
            toolbarEnabled={false}
            cacheEnabled
          >
            {/* Store marker */}
            <Marker
              coordinate={{ latitude: storePoint!.lat, longitude: storePoint!.lng }}
              anchor={{ x: 0.5, y: 1 }}
              accessibilityLabel={`${storeName} store`}
            >
              <StorePin size={30} />
            </Marker>

            {/* Delivery marker */}
            <Marker
              coordinate={{ latitude: deliveryPoint!.lat, longitude: deliveryPoint!.lng }}
              anchor={{ x: 0.5, y: 0.5 }}
              accessibilityLabel={`Delivery: ${deliveryAddress || 'address'}`}
            >
              <View style={[styles.markerDot, { backgroundColor: brand.success }]}>
                <View style={[styles.markerInner, { backgroundColor: '#fff' }]} />
              </View>
            </Marker>

            {/* Rider marker — animated */}
            {hasRider && riderPoint && (
              <Marker
                coordinate={{
                  latitude: riderPoint.lat,
                  longitude: riderPoint.lng,
                }}
                anchor={{ x: 0.5, y: 0.5 }}
                accessibilityLabel={`Rider location: ${riderName || 'rider'}`}
              >
                <Animated.View style={[styles.riderMarker, animatedRiderStyle as any]}>
                  <Animated.View style={[styles.riderPulse, animatedPulseStyle as any]} />
                  <View style={[styles.riderDot, isStale && { backgroundColor: brand.warning }]}>
                    <Navigation size={14} color="#fff" style={{ transform: [{ rotate: '45deg' }] }} />
                  </View>
                </Animated.View>
              </Marker>
            )}

            {/* Route polyline */}
            {routePoints.length > 1 && (
              <Polyline
                coordinates={routePoints.map((p) => ({ latitude: p.lat, longitude: p.lng }))}
                strokeColor={brand.primary}
                strokeWidth={4}
              />
            )}

            {/* Straight-line fallback */}
            {routePoints.length === 0 && hasCoords && (
              <Polyline
                coordinates={[
                  { latitude: storePoint!.lat, longitude: storePoint!.lng },
                  ...(hasRider && riderPoint
                    ? [{ latitude: riderPoint.lat, longitude: riderPoint.lng }]
                    : []),
                  { latitude: deliveryPoint!.lat, longitude: deliveryPoint!.lng },
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

        {/* Metrics overlay */}
        <View style={styles.metricsOverlay} pointerEvents="none">
          {distanceKm != null && (
            <View style={[styles.metricChip, { backgroundColor: 'rgba(0,0,0,0.75)' }]}>
              <MapPin size={12} color={brand.success} />
              <Text style={[textStyle.micro, { color: '#fff', fontWeight: weights.semibold }]}>
                {formatNumeric(distanceKm, 1)} km
              </Text>
            </View>
          )}
          {durationMinutes != null && (
            <View style={[styles.metricChip, { backgroundColor: 'rgba(0,0,0,0.75)' }]}>
              <Clock size={12} color={brand.orange} />
              <Text style={[textStyle.micro, { color: '#fff', fontWeight: weights.semibold }]}>
                {durationMinutes} min
              </Text>
            </View>
          )}
      </View>

        {/* Waiting for rider overlay */}
        {isWaitingForRider && hasCoords && (
          <View style={[styles.waitingOverlay, { backgroundColor: theme.colors.surface.elevated }]}>
            <Hourglass size={16} color={brand.orange} />
            <Text style={[textStyle.bodySmall, { color: theme.colors.text.secondary, flex: 1 }]}>
              Preparing your order — a rider will be assigned shortly
            </Text>
          </View>
        )}
      </View>

      {/* Info row */}
      <View style={[styles.infoRow, { borderTopColor: theme.colors.border.subtle }]}>
        <View style={styles.infoBox}>
          <Text style={[textStyle.caption, { color: theme.colors.text.tertiary }]}>From</Text>
          <Text style={[textStyle.bodySmall, { fontWeight: weights.semibold, color: theme.colors.text.primary }]} numberOfLines={1}>
            {storeName}
          </Text>
        </View>
        {riderName && (
          <View style={styles.infoBoxCenter}>
            <Text style={[textStyle.caption, { color: theme.colors.text.tertiary }]}>Rider</Text>
            <Text style={[textStyle.bodySmall, { fontWeight: weights.semibold, color: brand.orange }]} numberOfLines={1}>
              {riderName}
            </Text>
          </View>
        )}
        <View style={[styles.infoBox, { alignItems: 'flex-end' }]}>
          <Text style={[textStyle.caption, { color: theme.colors.text.tertiary }]}>To</Text>
          <Text style={[textStyle.bodySmall, { fontWeight: weights.semibold, color: theme.colors.text.primary }]} numberOfLines={1}>
            {deliveryAddress || 'Delivery'}
          </Text>
        </View>
      </View>

      {/* Last updated */}
      {hasRider && riderLocation!.recorded_at && (
        <Text style={[textStyle.micro, { color: theme.colors.text.tertiary, textAlign: 'center', paddingBottom: semanticSpacing.xs }]}>
          Updated {formatTime(riderLocation!.recorded_at)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: semanticRadius.card,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: semanticSpacing.md,
    paddingBottom: semanticSpacing.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: semanticSpacing.xs,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: semanticSpacing.sm,
    paddingVertical: 3,
    borderRadius: semanticRadius.badge,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  mapContainer: {
    height: 320,
    overflow: 'hidden',
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
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  riderMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  riderDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: brand.orange,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  riderPulse: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(235, 101, 34, 0.2)',
  },
  metricsOverlay: {
    position: 'absolute',
    top: semanticSpacing.sm,
    right: semanticSpacing.sm,
    flexDirection: 'row',
    gap: semanticSpacing.xxs,
  },
  metricChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: semanticSpacing.sm,
    paddingVertical: 3,
    borderRadius: semanticRadius.chip,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: semanticSpacing.md,
    borderTopWidth: 1,
    gap: semanticSpacing.md,
  },
  infoBox: {
    flex: 1,
    gap: 2,
  },
  infoBoxCenter: {
    alignItems: 'center',
    gap: 2,
  },
  waitingOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: semanticSpacing.xs,
    paddingHorizontal: semanticSpacing.md,
    paddingVertical: semanticSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
});
