import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RiderHomeScreen } from '../RiderHomeScreen';
import { RiderOrderDetailScreen } from '../RiderOrderDetailScreen';
import { toggleAvailability, claimOrder, fetchRiderStats, fetchActiveDeliveries, fetchAvailableOrders } from '../../../lib/apiClient';
import { useSession } from '../../../stores/session';
import { copy } from '../../../lib/strings';
import type { ApiUser } from '../../../lib/types';

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
  useQueryClient: jest.fn(),
}));

jest.mock('../../../lib/apiClient', () => ({
  fetchRiderStats: jest.fn(),
  fetchActiveDeliveries: jest.fn(),
  fetchAvailableOrders: jest.fn(),
  toggleAvailability: jest.fn(),
  claimOrder: jest.fn(),
}));

const mockNavigate = jest.fn();
const mockInvalidate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useRoute: () => ({ params: { orderId: 42 } }),
}));

const riderUser: ApiUser = {
  id: 2, name: 'Sipho', email: 'sipho@checkstar.co.za', role: 'rider',
  rider: { id: 5, vehicle_type: 'bike', is_available: false },
};

const stats = { total_deliveries: 12, average_rating: 4.5, xp: 0, level: 3 };

const availableOrder = {
  id: 7, status: 'pending', total_cents: 25000,
  store: { name: 'Berea' }, created_at: '2026-08-01T10:00:00Z',
};

function mockQueries(overrides: { stats?: unknown; active?: unknown; available?: unknown }) {
  (useQuery as jest.Mock).mockImplementation(({ queryKey }: { queryKey: readonly unknown[] }) => {
    if (queryKey[1] === 'stats') return { data: overrides.stats };
    if (queryKey[1] === 'active-deliveries') return { data: overrides.active ?? [] };
    return { data: overrides.available ?? [] };
  });
  (useQueryClient as jest.Mock).mockReturnValue({ invalidateQueries: mockInvalidate });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockInvalidate.mockClear();
  useSession.setState({ user: riderUser });
  mockQueries({ stats, active: [], available: [] });
});

describe('Rider Full Flow: Home → Toggle → Stats → Claim → Deliver', () => {
  test('rider home renders stats from the stats query', async () => {
    await render(React.createElement(RiderHomeScreen));
    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText('4.5')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText(copy.rider.deliveries)).toBeTruthy();
  });

  test('availability toggle calls the API and invalidates queries', async () => {
    (toggleAvailability as jest.Mock).mockResolvedValue({ message: 'ok' });
    await render(React.createElement(RiderHomeScreen));
    expect(screen.getByText(copy.rider.offline)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: copy.rider.goOnline }));
    expect(toggleAvailability).toHaveBeenCalledTimes(1);
    expect(mockInvalidate).toHaveBeenCalled();
  });

  test('claim order navigates to RiderOrderDetail', async () => {
    (claimOrder as jest.Mock).mockResolvedValue(availableOrder);
    mockQueries({ stats, active: [], available: [availableOrder] });
    await render(React.createElement(RiderHomeScreen));
    expect(screen.getByText('Order #7')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: copy.rider.claim }));
    expect(claimOrder).toHaveBeenCalledWith(7);
    expect(mockNavigate).toHaveBeenCalledWith('RiderOrderDetail', { orderId: 7 });
  });

  test('rider order detail shows delivered confirmation when delivered', async () => {
    const deliveredOrder = {
      id: 42, status: 'delivered', payment_status: 'paid', payment_method: 'cod',
      delivery_address: '1 Main Road', delivery_notes: null,
      subtotal_cents: 4500, delivery_fee_cents: 2500, total_cents: 7000,
      customer_confirmed_at: '2026-08-01T12:00:00Z', created_at: '2026-08-01T10:00:00Z',
      rider_rating: null,
      items: [{ id: 11, product_id: 7, quantity: 2, unit_price_cents: 1000, product_snapshot: { name: 'Bread', unit: 'each' } }],
      store: null, rider: null, activity_logs: [],
    };
    (useQuery as jest.Mock).mockImplementation(() => ({ data: deliveredOrder, isLoading: false }));
    (useQueryClient as jest.Mock).mockReturnValue({ invalidateQueries: mockInvalidate });

    await render(React.createElement(RiderOrderDetailScreen));
    expect(await screen.findByText('Delivered ✓')).toBeTruthy();
  });
});
