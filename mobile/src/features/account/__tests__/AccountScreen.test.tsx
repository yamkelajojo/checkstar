import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { AccountScreen } from '../AccountScreen';
import { fetchOrders } from '../../../lib/apiClient';
import { useSession } from '../../../stores/session';
import { TestWrapper } from '../../../test/utils';
import { copy } from '../../../lib/strings';
import type { ApiOrder, ApiUser } from '../../../lib/types';

jest.mock('../../../lib/apiClient', () => ({
  fetchOrders: jest.fn(),
  fetchAddresses: jest.fn(() => Promise.resolve([])),
  createAddress: jest.fn(),
  updateAddress: jest.fn(),
  deleteAddress: jest.fn(),
  getApiBaseUrl: jest.fn().mockResolvedValue('http://test.api'),
  setApiBaseUrl: jest.fn().mockResolvedValue(undefined),
  resetApiClient: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../lib/storage', () => ({
  storage: { get: jest.fn(), set: jest.fn(), remove: jest.fn() },
  STORAGE_KEYS: { apiBaseUrl: 'test.key' },
}));

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

const customer: ApiUser = {
  id: 1,
  name: 'Anna',
  email: 'anna@example.com',
  phone: null,
  role: 'customer',
  rider: null,
};

const order = (over: Partial<ApiOrder>): ApiOrder => ({
  id: 7,
  status: 'pending',
  payment_status: 'paid',
  subtotal_cents: null,
  delivery_fee_cents: null,
  total_cents: 12500,
  created_at: '2026-08-01T10:00:00.000Z',
  items: [],
  ...over,
});

beforeEach(() => {
  jest.clearAllMocks();
  (fetchOrders as jest.Mock).mockResolvedValue([]);
  useSession.setState({ status: 'guest', token: null, user: null });
});

const renderAccount = async () => render(<AccountScreen />, { wrapper: TestWrapper });

describe('guest account', () => {
  it('greets a guest and hides order history behind sign-in', async () => {
    await renderAccount();
    expect(screen.getByText('Guest')).toBeTruthy();
    expect(screen.getByText('Sign in to see your orders')).toBeTruthy();
    expect(screen.queryByText('Sign out')).toBeNull();
  });

  it('routes the guest to Auth when tapping Sign in', async () => {
    await renderAccount();
    await fireEvent.press(screen.getByText('Sign in'));
    expect(mockNavigate).toHaveBeenCalledWith('Auth');
  });
});

describe('authenticated account', () => {
  beforeEach(() => {
    useSession.setState({ status: 'authenticated', token: 't', user: customer });
  });

  it('shows the customer name and an empty-orders note when none exist yet', async () => {
    await renderAccount();
    await waitFor(() => expect(fetchOrders).toHaveBeenCalled());
    expect(screen.getByText('Anna')).toBeTruthy();
    expect(screen.getByText(copy.orders.emptyTitle)).toBeTruthy();
  });

  it('never surfaces a role label — the profile is just the person', async () => {
    useSession.setState({ status: 'authenticated', token: 't', user: { ...customer, role: 'store_owner' } });
    await renderAccount();

    expect(screen.getByText('Anna')).toBeTruthy();
    expect(screen.queryByText(/Owner/)).toBeNull();
    expect(screen.queryByText(/Customer/)).toBeNull();
    expect(screen.queryByText(/Rider/)).toBeNull();
  });

  it('signs out and confirms with a toast', async () => {
    const signOut = jest.fn().mockResolvedValue(undefined);
    useSession.setState({ signOut });
    await renderAccount();

    await fireEvent.press(screen.getByRole('button', { name: 'Sign out' }));
    await waitFor(() => expect(signOut).toHaveBeenCalled());
    expect(await screen.findByText('Signed out')).toBeTruthy();
  });

  it('lists past orders with friendly statuses and totals', async () => {
    (fetchOrders as jest.Mock).mockReturnValue([
      order({}),
      order({ id: 8, status: 'out_for_delivery', total_cents: 99000 }),
    ]);
    await renderAccount();

    expect(await screen.findByText('Order #7')).toBeTruthy();
    expect(screen.getByText('Order #8')).toBeTruthy();
    expect(screen.getByText('Pending')).toBeTruthy();
    expect(screen.getByText('Out for delivery')).toBeTruthy();
    expect(screen.getByText('R 125,00')).toBeTruthy();
    expect(screen.getByText('R 990,00')).toBeTruthy();
  });

  it('falls back to the raw status string when unmapped', async () => {
    (fetchOrders as jest.Mock).mockReturnValue([order({ status: 'mysterious' })]);
    await renderAccount();
    expect(await screen.findByText('mysterious')).toBeTruthy();
  });

  it('opens the order detail for a tapped order', async () => {
    (fetchOrders as jest.Mock).mockReturnValue([order({ id: 12 })]);
    await renderAccount();
    await fireEvent.press(await screen.findByText('Order #12'));
    expect(mockNavigate).toHaveBeenCalledWith('OrderDetail', { orderId: 12 });
  });
});

describe('developer settings (regression: previously cut off at the bottom)', () => {
  beforeEach(() => {
    useSession.setState({ status: 'authenticated', token: 't', user: customer });
  });

  it('renders the Developer Settings row in normal flow, even with a long order list', async () => {
    (fetchOrders as jest.Mock).mockReturnValue([
      order({}),
      order({ id: 8 }),
      order({ id: 9 }),
      order({ id: 10 }),
      order({ id: 11 }),
    ]);
    await renderAccount();
    await screen.findByText('Order #11');

    // The row exists in the tree (inside the scrollview) and is tappable —
    // it is no longer a fixed element that could be clipped off-screen.
    const row = screen.getByRole('button', { name: /Developer Settings/ });
    expect(row).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Save & Test/i })).toBeNull();
  });

  it('expands into the debug panel when tapped', async () => {
    await renderAccount();
    await fireEvent.press(screen.getByRole('button', { name: /Developer Settings/ }));

    expect(await screen.findByRole('button', { name: /Save & Test/i })).toBeTruthy();
  });
});
