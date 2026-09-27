/**
 * RouteMap component test — renders the real component.
 *
 * The previous version only asserted that the module exports a function and
 * that a props object literal has the right typeofs; it never touched the
 * component. react-native-maps is swapped for the passthrough mock in
 * __mocks__/react-native-maps.js, which keeps every prop we hand the native
 * module inspectable via testID.
 *
 * NOTE: RNTL v14 + React 19 renders asynchronously — `screen` is only usable
 * after the promise returned by render() settles, hence the awaits.
 */
import { render, screen } from '@testing-library/react-native';
import { describe, test, expect } from '@jest/globals';
import { RouteMap } from '../RouteMap';

// Canonical Google encoded-polyline example: three points.
const GEOMETRY = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';

describe('RouteMap', () => {
  test('renders store and delivery markers for numeric coordinates', async () => {
    await render(
      <RouteMap
        storeName="Checkstar Durban Central"
        storeLat={-29.8167}
        storeLng={30.8833}
        deliveryAddress="12 Berea Road"
        deliveryLat={-29.835}
        deliveryLng={30.972}
      />,
    );

    const markers = screen.getAllByTestId('map-marker');
    expect(markers).toHaveLength(2);
    expect(markers[0].props.coordinate).toEqual({ latitude: -29.8167, longitude: 30.8833 });
    expect(markers[1].props.coordinate).toEqual({ latitude: -29.835, longitude: 30.972 });
  });

  test('draws the decoded OSRM geometry as a polyline', async () => {
    await render(
      <RouteMap
        storeName="Checkstar Musgrave"
        storeLat={-29.84}
        storeLng={30.99}
        deliveryAddress="1 Main Road"
        deliveryLat={-29.86}
        deliveryLng={31.0}
        geometry={GEOMETRY}
        source="osrm"
      />,
    );

    const coordinates = screen.getByTestId('map-polyline').props.coordinates;
    expect(coordinates).toHaveLength(3);
    for (const point of coordinates) {
      expect(Number.isFinite(point.latitude)).toBe(true);
      expect(Number.isFinite(point.longitude)).toBe(true);
    }
    expect(screen.getByText('Live OSRM routing')).toBeTruthy();
  });

  test('falls back to a straight dashed line when there is no geometry', async () => {
    await render(
      <RouteMap
        storeName="Checkstar Musgrave"
        storeLat={-29.84}
        storeLng={30.99}
        deliveryAddress="1 Main Road"
        deliveryLat={-29.86}
        deliveryLng={31.0}
        source="haversine_fallback"
      />,
    );

    const coordinates = screen.getByTestId('map-polyline').props.coordinates;
    expect(coordinates).toHaveLength(2);
    expect(screen.getByText('Haversine estimate')).toBeTruthy();
  });

  test('degrades to the info card when coordinates are unavailable', async () => {
    await render(
      <RouteMap storeName="Checkstar Umgeni" deliveryAddress={null} distanceKm={2.3} />,
    );

    expect(screen.queryByTestId('map-view')).toBeNull();
    expect(screen.getByText('Checkstar Umgeni')).toBeTruthy();
    expect(screen.getByText('Delivery address not set')).toBeTruthy();
    // Metrics still render without a map.
    expect(screen.getByText('2.3 km')).toBeTruthy();
  });

  test('never hands the map NaN, even for malformed geometry', async () => {
    await render(
      <RouteMap
        storeName="Checkstar Musgrave"
        storeLat={-29.84}
        storeLng={30.99}
        deliveryAddress="1 Main Road"
        deliveryLat={-29.86}
        deliveryLng={31.0}
        geometry={'not a polyline !!!'}
      />,
    );

    // Whatever the decoder makes of garbage, the region, markers and polyline
    // must all stay finite — a NaN region renders a blank map on device.
    const region = screen.getByTestId('map-view').props.initialRegion;
    expect(Number.isFinite(region.latitude)).toBe(true);
    expect(Number.isFinite(region.longitude)).toBe(true);
    for (const marker of screen.getAllByTestId('map-marker')) {
      expect(Number.isFinite(marker.props.coordinate.latitude)).toBe(true);
      expect(Number.isFinite(marker.props.coordinate.longitude)).toBe(true);
    }
    for (const point of screen.getByTestId('map-polyline').props.coordinates) {
      expect(Number.isFinite(point.latitude)).toBe(true);
      expect(Number.isFinite(point.longitude)).toBe(true);
    }
  });
});
