import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { StorePin } from './StorePin';
import { MapPin, Navigation } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { textStyle, weights } from '../../theme/typography';
import { semanticSpacing, semanticRadius } from '../../theme/spacing';
import { decodePolyline, computeBoundingRegion, type LatLng } from '../../lib/polyline';
import { toLatLng, formatNumeric, type Numeric } from '../../lib/numbers';

interface RouteMapProps {
  storeName: string;
  /**
   * Coordinates and distance arrive from the API as Laravel `decimal:N` casts,
   * which serialise as strings ("-29.8350000"). They are normalised to numbers
   * before anything is handed to react-native-maps.
   */
  storeLat?: Numeric;
  storeLng?: Numeric;
  deliveryAddress?: string | null;
  deliveryLat?: Numeric;
  deliveryLng?: Numeric;
  distanceKm?: Numeric;
  durationMinutes?: Numeric;
  source?: string;
  geometry?: string | null;
  /** Height of the map container in pixels. */
  mapHeight?: number;
}

const DURBAN_CBD: LatLng = { lat: -29.8587, lng: 31.0218 };

export function RouteMap({
  storeName,
  storeLat,
  storeLng,
  deliveryAddress,
  deliveryLat,
  deliveryLng,
  distanceKm,
  durationMinutes,
  source,
  geometry,
  mapHeight = 220,
}: RouteMapProps) {
  const theme = useTheme();

  // react-native-maps reads coordinates as native doubles: a decimal string
  // ("-29.8350000") makes the marker/polyline fail, and string arithmetic in
  // the bounding-region midpoint produced NaN. Coerce once, use everywhere.
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
  const hasCoords = storePoint != null && deliveryPoint != null;

  // Decode geometry from the backend if available
  const routePoints = useMemo<LatLng[]>(() => {
    if (!geometry) return [];
    try {
      return decodePolyline(geometry);
    } catch {
      return [];
    }
  }, [geometry]);

  // Build coordinate list for map fitting
  const allPoints = useMemo<LatLng[]>(() => {
    const pts: LatLng[] = [];
    if (storePoint) pts.push(storePoint);
    if (deliveryPoint) pts.push(deliveryPoint);
    pts.push(...routePoints);
    return pts;
  }, [storePoint, deliveryPoint, routePoints]);

  // Compute region that fits all points
  const region = useMemo(() => {
    if (allPoints.length >= 2) return computeBoundingRegion(allPoints);
    if (allPoints.length === 1) {
      return { latitude: allPoints[0].lat, longitude: allPoints[0].lng, latitudeDelta: 0.02, longitudeDelta: 0.02 };
    }
    return { latitude: DURBAN_CBD.lat, longitude: DURBAN_CBD.lng, latitudeDelta: 0.1, longitudeDelta: 0.1 };
  }, [allPoints]);

  // If no coordinates available, show a fallback info card
  if (!hasCoords) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.surface.sunken }]}>
        <View style={styles.header}>
          <Navigation size={18} color={brand.orange} />
          <Text style={[textStyle.h3, { fontWeight: weights.bold, color: theme.colors.text.primary }]}>
            Delivery Route
          </Text>
        </View>

        <View style={styles.infoRow}>
          <InfoBox label="From" value={storeName} theme={theme} />
          <InfoBox label="To" value={deliveryAddress || 'Delivery address not set'} theme={theme} />
        </View>

        <MetricsRow distanceKm={distanceKm} durationMinutes={durationMinutes} source={source} theme={theme} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface.sunken }]}>
      <View style={styles.header}>
        <Navigation size={18} color={brand.orange} />
        <Text style={[textStyle.h3, { fontWeight: weights.bold, color: theme.colors.text.primary }]}>
          Delivery Route
        </Text>
      </View>

      <View style={styles.infoRow}>
        <InfoBox label="From" value={storeName} theme={theme} />
        <InfoBox label="To" value={deliveryAddress || 'Delivery address not set'} theme={theme} />
      </View>

      <MapView
        provider={PROVIDER_DEFAULT}
        style={[styles.map, { height: mapHeight }]}
        initialRegion={region}
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
        toolbarEnabled={false}
        cacheEnabled
      >
        {/* Store marker — branded checkstar pin */}
        <Marker
          coordinate={{ latitude: storePoint!.lat, longitude: storePoint!.lng }}
          anchor={{ x: 0.5, y: 1 }}
        >
          <StorePin size={28} />
        </Marker>

        {/* Delivery marker */}
        <Marker
          coordinate={{ latitude: deliveryPoint!.lat, longitude: deliveryPoint!.lng }}
          anchor={{ x: 0.5, y: 0.5 }}
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

        {/* Straight-line fallback when no geometry is available */}
        {routePoints.length === 0 && (
          <Polyline
            coordinates={[
              { latitude: storePoint!.lat, longitude: storePoint!.lng },
              { latitude: deliveryPoint!.lat, longitude: deliveryPoint!.lng },
            ]}
            strokeColor={brand.primary}
            strokeWidth={2}
            lineDashPattern={[8, 4]}
          />
        )}
      </MapView>

      <MetricsRow distanceKm={distanceKm} durationMinutes={durationMinutes} source={source} theme={theme} />
    </View>
  );
}

function InfoBox({ label, value, theme }: { label: string; value: string; theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={styles.infoBox}>
      <Text style={[textStyle.caption, { color: theme.colors.text.secondary }]}>{label}</Text>
      <Text style={[textStyle.body, { fontWeight: weights.semibold, color: theme.colors.text.primary }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function MetricsRow({ distanceKm, durationMinutes, source, theme }: { distanceKm?: Numeric; durationMinutes?: Numeric; source?: string; theme: ReturnType<typeof useTheme> }) {
  return (
    <>
      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <MapPin size={16} color={brand.success} />
          <Text style={[textStyle.caption, { color: theme.colors.text.secondary }]}>Distance</Text>
          <Text style={[textStyle.body, { fontWeight: weights.bold, color: theme.colors.text.primary }]}>
            {distanceKm != null ? `${formatNumeric(distanceKm, 1)} km` : '—'}
          </Text>
        </View>
        <View style={styles.metric}>
          <Navigation size={16} color={brand.orange} />
          <Text style={[textStyle.caption, { color: theme.colors.text.secondary }]}>Duration</Text>
          <Text style={[textStyle.body, { fontWeight: weights.bold, color: theme.colors.text.primary }]}>
            {durationMinutes != null ? `${formatNumeric(durationMinutes, 0)} min` : '—'}
          </Text>
        </View>
      </View>
      {source && (
        <Text style={[textStyle.caption, { color: theme.colors.text.tertiary, fontStyle: 'italic', textAlign: 'center' }]}>
          {source === 'osrm' ? 'Live OSRM routing' : source === 'mock_fallback' ? 'Mock routing (dev)' : 'Haversine estimate'}
        </Text>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    borderRadius: semanticRadius.card,
    padding: semanticSpacing.md,
    gap: semanticSpacing.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: semanticSpacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    gap: semanticSpacing.md,
  },
  infoBox: {
    flex: 1,
    gap: semanticSpacing.xxs,
  },
  map: {
    borderRadius: semanticRadius.card,
    overflow: 'hidden',
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
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: semanticSpacing.xxs,
  },
});
