/**
 * RouteExplorer integration — renders the real screen with real params.
 *
 * The previous file asserted typeofs on param literals it had just written
 * ("STLC verification" that could never fail). This one renders
 * RouteExplorerScreen exactly as RootNavigator mounts it, with the params
 * RiderOrderDetailScreen/OrderPlacedScreen forward — including the API's
 * decimal-string coordinates — and checks the screen normalises them:
 *
 *   docs/route-explorer.md §Navigation Integration
 *   - RouteExplorer receives navigator params: storeName, storeLat/storeLng,
 *     deliveryAddress, deliveryLat/deliveryLng, distanceKm, durationMinutes,
 *     source, geometry
 *   - the map renders markers for both endpoints
 */
import { render, screen } from '@testing-library/react-native';
import { describe, test, expect, jest } from '@jest/globals';
import { RouteExplorerScreen } from '../RouteExplorerScreen';

const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack, navigate: jest.fn() }),
  // The wire shape forwarded by RiderOrderDetailScreen: decimal strings.
  useRoute: () => ({
    params: {
      storeName: 'Checkstar Durban Central',
      storeLat: '-29.8167000',
      storeLng: '30.8833000',
      deliveryAddress: '12 Berea Road, Durban',
      deliveryLat: '-29.8350000',
      deliveryLng: '30.9720000',
      distanceKm: '1.47',
      durationMinutes: '9',
      source: 'haversine_fallback',
      geometry: null,
    },
  }),
}));

describe('RouteExplorerScreen with forwarded navigator params', () => {
  test('renders a map with numeric markers from decimal-string params', async () => {
    await render(<RouteExplorerScreen />);

    const markers = screen.getAllByTestId('map-marker');
    expect(markers).toHaveLength(2);
    expect(markers[0].props.coordinate).toEqual({ latitude: -29.8167, longitude: 30.8833 });
    expect(markers[1].props.coordinate).toEqual({ latitude: -29.835, longitude: 30.972 });

    const region = screen.getByTestId('map-view').props.initialRegion;
    expect(Number.isFinite(region.latitude)).toBe(true);
    expect(Number.isFinite(region.longitude)).toBe(true);
  });

  test('shows the endpoints, the distance and the duration', async () => {
    await render(<RouteExplorerScreen />);

    expect(screen.getByText('Checkstar Durban Central')).toBeTruthy();
    expect(screen.getByText('12 Berea Road, Durban')).toBeTruthy();
    // Coordinates are displayed to 4 decimals, from the coerced numbers.
    expect(screen.getByText('-29.8167, 30.8833')).toBeTruthy();
    expect(screen.getByText('-29.8350, 30.9720')).toBeTruthy();
    expect(screen.getByText('1.47 km')).toBeTruthy();
    expect(screen.getByText('9 min')).toBeTruthy();
  });
});
