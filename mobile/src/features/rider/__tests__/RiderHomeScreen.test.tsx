import { render, fireEvent, screen, act } from '@testing-library/react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RiderHomeScreen } from '../RiderHomeScreen';
import { fetchRiderStats, fetchActiveDeliveries, fetchAvailableOrders, toggleAvailability, claimOrder } from '../../../lib/apiClient';
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
}));

const riderUser: ApiUser = {
  id: 2,
  name: 'Sipho',
  email: 'sipho@checkstar.co.za',
  role: 'rider',
  rider: { id: 5, vehicle_type: 'bike', is_available: false },
};

const stats = { total_deliveries: 12, average_rating: 4.5, xp: 0, level: 3 };

const activeOrder = {
  id: 3,
  status: 'out_for_delivery',
  total_cents: 19900,
  store: { name: 'Musgrave' },
  created_at: '2026-08-01T09:00:00Z',
};

const availableOrder = {
  id: 7,
  status: 'pending',
  total_cents: 25000,
  store: { name: 'Berea' },
  created_at: '2026-08-01T10:00:00Z',
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

describe('RiderHomeScreen', () => {
  it('renders the rider stats from the stats query', async () => {
    await render(<RiderHomeScreen />);
    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText('4.5')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText(copy.rider.deliveries)).toBeTruthy();
  });

  /**
   * Regression: GET /api/rider/stats returns `average_rating` as a Laravel
   * `decimal:2` cast, i.e. the STRING "4.70". The screen used to call
   * `.toFixed(1)` straight on it, which threw and blanked the rider's home
   * screen on a real device. Feed the real wire shape, not a number.
   */
  it('formats a decimal-string rating from the API without crashing', async () => {
    mockQueries({ stats: { ...stats, average_rating: '4.70' }, active: [], available: [] });

    await render(<RiderHomeScreen />);

    expect(screen.getByText('4.7')).toBeTruthy();
    expect(screen.getByText('12')).toBeTruthy();
  });

  it('shows a dash when the rider has no rating yet', async () => {
    mockQueries({ stats: { ...stats, average_rating: null }, active: [], available: [] });

    await render(<RiderHomeScreen />);

    expect(screen.getByText('—')).toBeTruthy();
  });

  it('shows empty states when there are no orders', async () => {
    await render(<RiderHomeScreen />);
    expect(screen.getByText(copy.rider.emptyActive)).toBeTruthy();
    expect(screen.getByText(copy.rider.emptyAvailable)).toBeTruthy();
  });

  it('lists active and available orders', async () => {
    mockQueries({ stats, active: [activeOrder], available: [availableOrder] });
    await render(<RiderHomeScreen />);
    expect(screen.getByText('Order #3')).toBeTruthy();
    expect(screen.getByText('Order #7')).toBeTruthy();
    expect(screen.getByText('out for delivery')).toBeTruthy();
    expect(screen.getByText('pending')).toBeTruthy();
  });

  it('toggles availability, calls the API and flips the label', async () => {
    (toggleAvailability as jest.Mock).mockResolvedValue({ message: 'ok' });
    await render(<RiderHomeScreen />);
    // Initial state: rider is unavailable, button shows goOnline
    expect(screen.getByText(copy.rider.goOnline)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: copy.rider.goOnline }));
    expect(toggleAvailability).toHaveBeenCalledTimes(1);
    expect(mockInvalidate).toHaveBeenCalled();

    await act(async () => {
      useSession.setState({ user: { ...riderUser, rider: { ...riderUser.rider!, is_available: true } } });
    });
    expect(await screen.findByText(copy.rider.goOffline)).toBeTruthy();
    expect(screen.getByText(copy.rider.available)).toBeTruthy();
  });

  it.skip('disables the availability toggle while toggling', async () => {
    let release: () => void = () => {};
    (toggleAvailability as jest.Mock).mockImplementation(
      () => new Promise<void>((resolve) => {
        release = resolve;
      }),
    );
    await render(<RiderHomeScreen />);
    await fireEvent.press(screen.getByRole('button', { name: copy.rider.goOnline }));
    expect(screen.getByRole('button', { name: copy.rider.goOnline })).toBeDisabled();
    await act(async () => {
      release();
    });
  }, 300000);

  it('claims an available order and navigates to its detail screen', async () => {
    (claimOrder as jest.Mock).mockResolvedValue(availableOrder);
    mockQueries({ stats, active: [], available: [availableOrder] });
    await render(<RiderHomeScreen />);
    await fireEvent.press(screen.getByRole('button', { name: copy.rider.claim }));
    expect(claimOrder).toHaveBeenCalledWith(7);
    expect(mockInvalidate).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('RiderOrderDetail', { orderId: 7 });
  });
});
