/**
 * RouteMap against the real API wire shape.
 *
 * The backend casts coordinates with Laravel's `decimal:7`, so a delivery
 * arrives as `delivery_latitude: "-29.8350000"` — a string, even though the
 * prop types say `number`. react-native-maps reads coordinates as native
 * doubles, and the bounding-region midpoint used to do `("-29.81" + "-29.83")
 * / 2`, which concatenates and yields NaN: the map silently rendered nothing.
 *
 * Every value here is copied from a live GET /api/rider/active-deliveries
 * response. react-native-maps is swapped for the passthrough mock in
 * __mocks__/react-native-maps.js, which keeps the props we hand the native
 * module inspectable.
 */
import { render, screen } from '@testing-library/react-native';
import { describe, test, expect } from '@jest/globals';
import { RouteMap } from '../RouteMap';

const WIRE = {
  storeLat: '-29.8167000',
  storeLng: '30.8833000',
  deliveryLat: '-29.8350000',
  deliveryLng: '30.9720000',
  distanceKm: '1.47',
  durationMinutes: '9',
};

/**
 * RNTL v14 + React 19 renders asynchronously: `screen` is only populated once
 * the returned promise settles, so every render here is awaited. (Skipping the
 * await is what made earlier map tests fall back to asserting literals instead
 * of the component.)
 */
async function renderRouteMap(overrides: Partial<Parameters<typeof RouteMap>[0]> = {}) {
  await render(
    <RouteMap
      storeName="Checkstar Durban Central"
      deliveryAddress="12 Berea Road"
      storeLat={WIRE.storeLat}
      storeLng={WIRE.storeLng}
      deliveryLat={WIRE.deliveryLat}
      deliveryLng={WIRE.deliveryLng}
      distanceKm={WIRE.distanceKm}
      durationMinutes={WIRE.durationMinutes}
      source="haversine_fallback"
      {...overrides}
    />,
  );
}

describe('RouteMap — decimal-string coordinates from the API', () => {
  test('hands the native map a finite numeric region', async () => {
    await renderRouteMap();

    const region = screen.getByTestId('map-view').props.initialRegion;
    expect(typeof region.latitude).toBe('number');
    expect(typeof region.longitude).toBe('number');
    expect(Number.isFinite(region.latitude)).toBe(true);
    expect(Number.isFinite(region.longitude)).toBe(true);
    expect(region.latitudeDelta).toBeGreaterThan(0);
    expect(region.longitudeDelta).toBeGreaterThan(0);
    // Midpoint of the store and the delivery address, not NaN.
    expect(region.latitude).toBeCloseTo((-29.8167 + -29.835) / 2, 6);
    expect(region.longitude).toBeCloseTo((30.8833 + 30.972) / 2, 6);
  });

  test('places both markers at numeric coordinates', async () => {
    await renderRouteMap();

    const markers = screen.getAllByTestId('map-marker');
    expect(markers).toHaveLength(2);
    for (const marker of markers) {
      expect(typeof marker.props.coordinate.latitude).toBe('number');
      expect(typeof marker.props.coordinate.longitude).toBe('number');
      expect(Number.isFinite(marker.props.coordinate.latitude)).toBe(true);
      expect(Number.isFinite(marker.props.coordinate.longitude)).toBe(true);
    }
    expect(markers[0].props.coordinate).toEqual({
      latitude: -29.8167,
      longitude: 30.8833,
    });
    expect(markers[1].props.coordinate).toEqual({
      latitude: -29.835,
      longitude: 30.972,
    });
  });

  test('draws the straight-line fallback with numeric coordinates', async () => {
    await renderRouteMap();

    const coordinates = screen.getByTestId('map-polyline').props.coordinates;
    expect(coordinates).toHaveLength(2);
    for (const point of coordinates) {
      expect(typeof point.latitude).toBe('number');
      expect(typeof point.longitude).toBe('number');
    }
  });

  test('formats distance and duration from decimal strings', async () => {
    await renderRouteMap();

    expect(screen.getByText('1.5 km')).toBeTruthy();
    expect(screen.getByText('9 min')).toBeTruthy();
  });

  test('still degrades to the info card when coordinates are absent', async () => {
    await renderRouteMap({
      storeLat: null,
      storeLng: null,
      deliveryLat: undefined,
      deliveryLng: undefined,
      deliveryAddress: null,
    });

    expect(screen.queryByTestId('map-view')).toBeNull();
    expect(screen.getByText('Delivery address not set')).toBeTruthy();
  });

  test('treats unusable coordinates as absent rather than rendering a broken map', async () => {
    await renderRouteMap({ storeLat: 'not-a-coordinate', storeLng: WIRE.storeLng });

    expect(screen.queryByTestId('map-view')).toBeNull();
  });
});
