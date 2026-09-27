/**
 * Rider order detail → RouteMap → RouteExplorer integration.
 *
 * Replaces a previous "integration" test that only asserted typeofs on object
 * literals it had just written — it could never fail. This one renders the real
 * screen with the REAL wire shape (GET /api/rider/active-deliveries returns
 * `decimal:7` coordinates as strings) and verifies:
 *
 *   1. the embedded RouteMap hands react-native-maps numeric markers,
 *   2. the distance metric formats correctly,
 *   3. "Explore Route" forwards the order's coordinates to RouteExplorer,
 *      which normalises them itself (see RouteExplorerScreen).
 *
 * The fireEvent case is deliberately last: RNTL v14's async act environment
 * stops committing renders made after a press in the same file.
 */
import { render, fireEvent, screen } from '@testing-library/react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
// NOTE: `jest` must stay the injected global: jest.mock factories are hoisted
// above imports, so an imported `jest` binding is still undefined inside them.
import { describe, test, expect, beforeEach } from '@jest/globals';
import { RiderOrderDetailScreen } from '../RiderOrderDetailScreen';
import {
  fetchOrder,
  fetchRouteGeometry,
  markItemsBought,
  markOutForDelivery,
  markDelivered,
} from '../../../lib/apiClient';
import type { ApiOrder } from '../../../lib/types';

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
  useQueryClient: jest.fn(),
}));

jest.mock('../../../lib/apiClient', () => ({
  fetchOrder: jest.fn(),
  fetchRouteGeometry: jest.fn(),
  markItemsBought: jest.fn(),
  markOutForDelivery: jest.fn(),
  markDelivered: jest.fn(),
}));

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
  useRoute: () => ({ params: { orderId: 42 } }),
}));

// Copied from a live GET /api/rider/active-deliveries payload: coordinates and
// money arrive as decimal strings.
const WIRE_ORDER = {
  id: 42,
  order_number: 'CS-1042',
  status: 'out_for_delivery',
  payment_status: 'pending',
  payment_method: 'cod',
  delivery_address: '12 Berea Road, Durban',
  delivery_notes: null,
  subtotal: '419.20',
  delivery_fee: '50.00',
  total: '469.20',
  subtotal_cents: 41920,
  delivery_fee_cents: 5000,
  total_cents: 46920,
  delivery_latitude: '-29.8350000',
  delivery_longitude: '30.9720000',
  customer_confirmed_at: null,
  created_at: '2026-08-01T10:00:00Z',
  rider_rating: null,
  items: [
    { id: 11, product_id: 7, quantity: 2, unit_price_cents: 1000, product_snapshot: { name: 'Bread', unit: 'each' } },
  ],
  store: {
    id: 1,
    name: 'Checkstar Durban Central',
    slug: 'durban-central',
    latitude: '-29.8167000',
    longitude: '30.8833000',
    delivery_radius_km: '10.00',
  },
  rider: null,
  activity_logs: [],
} as unknown as ApiOrder;

const GEOMETRY = {
  distance_km: 1.47,
  duration_minutes: 9,
  geometry: null,
  source: 'haversine_fallback',
};

beforeEach(() => {
  jest.clearAllMocks();
  (useQueryClient as unknown as jest.Mock).mockReturnValue({ invalidateQueries: jest.fn() });
  (useQuery as unknown as jest.Mock).mockImplementation(({ queryKey }: { queryKey: readonly unknown[] }) => {
    if (queryKey[0] === 'routeGeometry') return { data: GEOMETRY };
    return { data: WIRE_ORDER };
  });
  (fetchRouteGeometry as jest.Mock).mockResolvedValue(GEOMETRY);
});

describe('RiderOrderDetail → RouteMap integration', () => {
  test('the embedded map receives numeric markers despite string coordinates', async () => {
    await render(<RiderOrderDetailScreen />);

    expect(await screen.findByText('Order #42')).toBeTruthy();
    const markers = screen.getAllByTestId('map-marker');
    expect(markers).toHaveLength(2);
    expect(markers[0].props.coordinate).toEqual({
      latitude: -29.8167,
      longitude: 30.8833,
    });
    expect(markers[1].props.coordinate).toEqual({
      latitude: -29.835,
      longitude: 30.972,
    });

    const region = screen.getByTestId('map-view').props.initialRegion;
    expect(Number.isFinite(region.latitude)).toBe(true);
    expect(Number.isFinite(region.longitude)).toBe(true);
  });

  test('route metrics render from the geometry query', async () => {
    await render(<RiderOrderDetailScreen />);

    await screen.findByText('Order #42');
    expect(screen.getByText('1.5 km')).toBeTruthy();
    expect(screen.getByText('9 min')).toBeTruthy();
  });

  // Deliberately last: a press leaves RNTL's async act environment unable to
  // commit later renders within the same file.
  test('Explore Route forwards the order coordinates to RouteExplorer', async () => {
    await render(<RiderOrderDetailScreen />);

    fireEvent.press(await screen.findByText('Explore Route'));

    expect(mockNavigate).toHaveBeenCalledWith(
      'RouteExplorer',
      expect.objectContaining({
        storeName: 'Checkstar Durban Central',
        storeLat: '-29.8167000',
        storeLng: '30.8833000',
        deliveryLat: '-29.8350000',
        deliveryLng: '30.9720000',
        distanceKm: 1.47,
        durationMinutes: 9,
        source: 'haversine_fallback',
      }),
    );
  });
});
