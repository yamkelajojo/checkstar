import { render, fireEvent, screen, act } from '@testing-library/react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RiderHomeScreen } from '../RiderHomeScreen';
import { RiderOrderDetailScreen } from '../RiderOrderDetailScreen';
import { fetchRiderStats, fetchActiveDeliveries, fetchAvailableOrders, toggleAvailability, claimOrder, fetchOrder, markItemsBought, markOutForDelivery, markDelivered } from '../../../lib/apiClient';
import { useSession } from '../../../stores/session';
import { copy } from '../../../lib/strings';
import type { ApiUser, ApiOrder } from '../../../lib/types';

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
  fetchOrder: jest.fn(),
  markItemsBought: jest.fn(),
  markOutForDelivery: jest.fn(),
  markDelivered: jest.fn(),
}));

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockInvalidate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
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

const baseOrder: ApiOrder = {
  id: 42, status: 'preparing', payment_status: 'pending', payment_method: 'cod',
  delivery_address: '1 Main Road, Durban', delivery_notes: null,
  subtotal_cents: 4500, delivery_fee_cents: 2500, total_cents: 7000,
  customer_confirmed_at: null, created_at: '2026-08-01T10:00:00Z', rider_rating: null,
  items: [
    { id: 11, product_id: 7, quantity: 2, unit_price_cents: 1000, product_snapshot: { name: 'Bread', unit: 'each' } },
    { id: 12, product_id: 8, quantity: 1, unit_price_cents: 2500, product_snapshot: { name: 'Milk', unit: '2L' } },
  ],
  store: null, rider: null, activity_logs: [],
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

describe('Rider Full Journey', () => {
  test('rider home screen renders stats and empty states', async () => {
    await render(<RiderHomeScreen />);
    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText('4.5')).toBeTruthy();
    expect(screen.getByText(copy.rider.deliveries)).toBeTruthy();
    expect(screen.getByText(copy.rider.emptyActive)).toBeTruthy();
    expect(screen.getByText(copy.rider.emptyAvailable)).toBeTruthy();
  });

  test('rider can toggle availability online and offline', async () => {
    (toggleAvailability as jest.Mock).mockResolvedValue({ message: 'ok' });
    await render(<RiderHomeScreen />);
    expect(screen.getByText(copy.rider.offline)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: copy.rider.goOnline }));
    expect(toggleAvailability).toHaveBeenCalledTimes(1);
    expect(mockInvalidate).toHaveBeenCalled();
  });

  test('rider claims an available order and navigates to order detail', async () => {
    (claimOrder as jest.Mock).mockResolvedValue(availableOrder);
    mockQueries({ stats, active: [], available: [availableOrder] });
    await render(<RiderHomeScreen />);
    await fireEvent.press(screen.getByRole('button', { name: copy.rider.claim }));
    expect(claimOrder).toHaveBeenCalledWith(7);
    expect(mockNavigate).toHaveBeenCalledWith('RiderOrderDetail', { orderId: 7 });
  });

  test('rider can mark items as bought on order detail', async () => {
    (markItemsBought as jest.Mock).mockResolvedValue({});
    (useQuery as jest.Mock).mockImplementation(() => ({ data: baseOrder, isLoading: false }));
    (useQueryClient as jest.Mock).mockReturnValue({ invalidateQueries: mockInvalidate });
    await render(<RiderOrderDetailScreen />);
    expect(await screen.findByText('Order #42')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: copy.rider.markItemsBought }));
    expect(markItemsBought).toHaveBeenCalledWith(42, [11, 12]);
    expect(mockInvalidate).toHaveBeenCalled();
  });

  test('rider can mark order out for delivery after selecting all items', async () => {
    (markOutForDelivery as jest.Mock).mockResolvedValue({});
    (useQuery as jest.Mock).mockImplementation(() => ({ data: baseOrder, isLoading: false }));
    (useQueryClient as jest.Mock).mockReturnValue({ invalidateQueries: mockInvalidate });
    await render(<RiderOrderDetailScreen />);
    await screen.findByText('Order #42');
    await fireEvent.press(screen.getByRole('button', { name: /2 × Bread/ }));
    await fireEvent.press(screen.getByRole('button', { name: /1 × Milk/ }));
    expect(screen.getByRole('button', { name: copy.rider.outForDelivery })).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: copy.rider.outForDelivery }));
    expect(markOutForDelivery).toHaveBeenCalledWith(42);
  });

  test('rider can mark order as delivered when out for delivery', async () => {
    (markDelivered as jest.Mock).mockResolvedValue({});
    (useQuery as jest.Mock).mockImplementation(() => ({
      data: { ...baseOrder, status: 'out_for_delivery' }, isLoading: false,
    }));
    (useQueryClient as jest.Mock).mockReturnValue({ invalidateQueries: mockInvalidate });
    await render(<RiderOrderDetailScreen />);
    expect(await screen.findByText('Order #42')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: copy.rider.markDelivered }));
    expect(markDelivered).toHaveBeenCalledWith(42);
  });
});
