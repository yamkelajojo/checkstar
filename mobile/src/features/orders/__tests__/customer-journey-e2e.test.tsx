import { render, screen, fireEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OrderDetailScreen } from '../OrderDetailScreen';
import { fetchOrder, cancelOrder, confirmDelivery } from '../../../lib/apiClient';
import { copy } from '../../../lib/strings';
import type { ApiOrder } from '../../../lib/types';

jest.mock('../../../lib/apiClient', () => ({
  fetchOrder: jest.fn(),
  cancelOrder: jest.fn(),
  confirmDelivery: jest.fn(),
}));

jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn().mockResolvedValue(undefined),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}));

const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
  useRoute: () => ({ params: { orderId: 42 } }),
}));

const baseOrder: ApiOrder = {
  id: 42, status: 'pending', payment_status: 'pending', payment_method: 'cod',
  delivery_address: '1 Main Road, Durban', delivery_notes: null,
  subtotal_cents: 4500, delivery_fee_cents: 2500, total_cents: 7000,
  customer_confirmed_at: null, created_at: '2026-08-01T10:00:00Z', rider_rating: null,
  items: [
    { id: 11, product_id: 7, quantity: 2, unit_price_cents: 1000, product_snapshot: { name: 'Bread', unit: 'each' } },
    { id: 12, product_id: 8, quantity: 1, unit_price_cents: 2500, product_snapshot: { name: 'Milk', unit: '2L' } },
  ],
  store: null, rider: null, activity_logs: [],
};

const clients: QueryClient[] = [];

function renderOrder(status: string, overrides: Partial<ApiOrder> = {}) {
  (fetchOrder as jest.Mock).mockResolvedValue({ ...baseOrder, status, ...overrides });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  return render(
    <QueryClientProvider client={client}>
      <OrderDetailScreen />
    </QueryClientProvider>,
  );
}

beforeEach(() => jest.clearAllMocks());

afterEach(() => {
  for (const c of clients) c.clear();
  clients.length = 0;
});

describe('Customer Journey (Order Detail after checkout)', () => {
  test('customer sees order details with items, address, and status timeline', async () => {
    await renderOrder('confirmed');
    expect(await screen.findByText('Order #42')).toBeTruthy();
    expect(screen.getByText('1 Main Road, Durban')).toBeTruthy();
    expect(screen.getByText(/Bread/)).toBeTruthy();
    expect(screen.getByText(/Milk/)).toBeTruthy();
    expect(screen.getByText(copy.orders.delivery)).toBeTruthy();
    expect(screen.getByText(copy.orders.items)).toBeTruthy();
  });

  test('status timeline highlights completed steps for a preparing order', async () => {
    await renderOrder('preparing');
    expect(await screen.findByText('Order #42')).toBeTruthy();
    expect(screen.getByText('Order received')).toBeTruthy();
    expect(screen.getByText('Confirmed')).toBeTruthy();
    expect(screen.getByText('Being packed')).toBeTruthy();
    expect(screen.getByText('Out for delivery')).toBeTruthy();
    expect(screen.getByText('Delivered')).toBeTruthy();
  });

  test('customer can cancel a pending order', async () => {
    await renderOrder('pending', { payment_status: 'pending' });
    await screen.findByText('Order #42');
    expect(screen.getByText(copy.orders.cancel)).toBeTruthy();
  });

  test('cancel is hidden once the order is out for delivery', async () => {
    await renderOrder('out_for_delivery', { payment_status: 'pending' });
    await screen.findByText('Order #42');
    expect(screen.queryByText(copy.orders.cancel)).toBeNull();
  });

  test('customer can confirm delivery when order is out for delivery', async () => {
    await renderOrder('out_for_delivery');
    expect(await screen.findByText(copy.orders.confirmReceived)).toBeTruthy();
    await fireEvent.press(screen.getByText(copy.orders.confirmReceived));
    expect(confirmDelivery).toHaveBeenCalledWith(42);
  });

  test('confirm-received button is hidden before out_for_delivery', async () => {
    await renderOrder('preparing');
    await screen.findByText('Order #42');
    expect(screen.queryByText(copy.orders.confirmReceived)).toBeNull();
  });

  test('delivered order shows the review card when unrated', async () => {
    await renderOrder('delivered', { rider_rating: null });
    expect(await screen.findByText(copy.review.title)).toBeTruthy();
  });

  test('delivered order hides the review card when already rated', async () => {
    await renderOrder('delivered', { rider_rating: 5 });
    await screen.findByText('Order #42');
    expect(screen.queryByText(copy.review.title)).toBeNull();
  });

  test('done button navigates back', async () => {
    await renderOrder('delivered', { rider_rating: 5 });
    await screen.findByText('Order #42');
    await fireEvent.press(screen.getByText(copy.orders.done));
    expect(mockGoBack).toHaveBeenCalled();
  });
});
