import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { MapPin, Navigation } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { textStyle, weights } from '../../theme/typography';
import { semanticSpacing, semanticRadius } from '../../theme/spacing';
import { decodePolyline, computeBoundingRegion, type LatLng } from '../../lib/polyline';

interface RouteMapProps {
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

  const hasCoords = storeLat != null && storeLng != null && deliveryLat != null && deliveryLng != null;

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
    if (storeLat != null && storeLng != null) pts.push({ lat: storeLat, lng: storeLng });
    if (deliveryLat != null && deliveryLng != null) pts.push({ lat: deliveryLat, lng: deliveryLng });
    pts.push(...routePoints);
    return pts;
  }, [storeLat, storeLng, deliveryLat, deliveryLng, routePoints]);

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
        {/* Store marker */}
        <Marker
          coordinate={{ latitude: storeLat!, longitude: storeLng! }}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={[styles.markerDot, { backgroundColor: brand.orange }]} />
        </Marker>

        {/* Delivery marker */}
        <Marker
          coordinate={{ latitude: deliveryLat!, longitude: deliveryLng! }}
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
              { latitude: storeLat!, longitude: storeLng! },
              { latitude: deliveryLat!, longitude: deliveryLng! },
            ]}
            strokeColor={brand.primary}
            strokeWidth={2}
            strokeDashlengths={[8, 4]}
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

function MetricsRow({ distanceKm, durationMinutes, source, theme }: { distanceKm?: number; durationMinutes?: number; source?: string; theme: ReturnType<typeof useTheme> }) {
  return (
    <>
      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <MapPin size={16} color={brand.success} />
          <Text style={[textStyle.caption, { color: theme.colors.text.secondary }]}>Distance</Text>
          <Text style={[textStyle.body, { fontWeight: weights.bold, color: theme.colors.text.primary }]}>
            {distanceKm != null ? `${distanceKm.toFixed(1)} km` : '—'}
          </Text>
        </View>
        <View style={styles.metric}>
          <Navigation size={16} color={brand.orange} />
          <Text style={[textStyle.caption, { color: theme.colors.text.secondary }]}>Duration</Text>
          <Text style={[textStyle.body, { fontWeight: weights.bold, color: theme.colors.text.primary }]}>
            {durationMinutes != null ? `${durationMinutes} min` : '—'}
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
