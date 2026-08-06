import { render, fireEvent, screen } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { OrderDetailScreen } from '../OrderDetailScreen';
import { fetchOrder, cancelOrder, confirmDelivery, reviewOrder } from '../../../lib/apiClient';
import type { ApiOrder } from '../../../lib/types';
import { copy } from '../../../lib/strings';

jest.mock('../../../lib/apiClient', () => ({
  fetchOrder: jest.fn(),
  cancelOrder: jest.fn(),
  confirmDelivery: jest.fn(),
  reviewOrder: jest.fn(),
}));

const clients: QueryClient[] = [];

const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
  useRoute: () => ({ params: { orderId: 42 } }),
}));

const baseOrder: ApiOrder = {
  id: 42,
  status: 'pending',
  payment_status: 'pending',
  payment_method: 'cod',
  delivery_address: '1 Main Road, Durban',
  delivery_notes: null,
  subtotal_cents: 12300,
  delivery_fee_cents: 2500,
  total_cents: 14800,
  customer_confirmed_at: null,
  created_at: '2026-08-01T10:00:00Z',
  rider_rating: null,
  items: [
    { id: 1, product_id: 7, quantity: 2, unit_price_cents: 1000, product_snapshot: { name: 'Bread', unit: 'each' } },
  ],
  store: null,
  rider: null,
  activity_logs: [],
};

function renderOrder(overrides: Partial<ApiOrder>) {
  (fetchOrder as jest.Mock).mockResolvedValue({ ...baseOrder, ...overrides });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  return render(
    <QueryClientProvider client={client}>
      <OrderDetailScreen />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  for (const client of clients) {
    client.clear();
  }
  clients.length = 0;
});

describe('OrderDetailScreen', () => {
  it('renders the full status timeline for a pending order', async () => {
    await renderOrder({ status: 'pending' });
    expect(await screen.findByText('Order #42')).toBeTruthy();
    for (const label of ['Order received', 'Confirmed', 'Being packed', 'Out for delivery', 'Delivered']) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  it('shows the cancelled state instead of the timeline for a cancelled order', async () => {
    await renderOrder({ status: 'cancelled' });
    expect(await screen.findByText(copy.orders.cancelled)).toBeTruthy();
    expect(screen.queryByText('Order received')).toBeNull();
  });

  it('shows the confirm-received button only when the order is out for delivery', async () => {
    await renderOrder({ status: 'preparing' });
    await screen.findByText('Order #42');
    expect(screen.queryByText(copy.orders.confirmReceived)).toBeNull();

    await renderOrder({ status: 'out_for_delivery' });
    expect(await screen.findByText(copy.orders.confirmReceived)).toBeTruthy();
  });

  it('calls confirmDelivery when the customer confirms receipt', async () => {
    await renderOrder({ status: 'out_for_delivery' });
    await screen.findByText(copy.orders.confirmReceived);
    await fireEvent.press(screen.getByText(copy.orders.confirmReceived));
    expect(confirmDelivery).toHaveBeenCalledWith(42);
  });

  it('shows the cancel action only while the order is cancellable', async () => {
    await renderOrder({ status: 'pending', payment_status: 'pending' });
    expect(await screen.findByText(copy.orders.cancel)).toBeTruthy();

    await renderOrder({ status: 'out_for_delivery', payment_status: 'pending' });
    await screen.findByText('Order #42');
    expect(screen.queryByText(copy.orders.cancel)).toBeNull();

    await renderOrder({ status: 'confirmed', payment_status: 'paid' });
    await screen.findByText('Order #42');
    expect(screen.queryByText(copy.orders.cancel)).toBeNull();
  });

  it('confirms the cancellation through the Alert dialog', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    await renderOrder({ status: 'confirmed', payment_status: 'pending' });
    await fireEvent.press(await screen.findByText(copy.orders.cancel));
    expect(alertSpy).toHaveBeenCalledWith(copy.orders.cancelThisOrder, copy.orders.cancelWarning, expect.any(Array));
    alertSpy.mockRestore();
  });

  it('shows the review card only when delivered and unrated', async () => {
    await renderOrder({ status: 'delivered', rider_rating: null });
    expect(await screen.findByText(copy.review.title)).toBeTruthy();

    await renderOrder({ status: 'delivered', rider_rating: 5 });
    await screen.findByText('Order #42');
    expect(screen.queryByText(copy.review.title)).toBeNull();

    await renderOrder({ status: 'preparing', rider_rating: null });
    await screen.findByText('Order #42');
    expect(screen.queryByText(copy.review.title)).toBeNull();
  });

  it('submits a rating when the review is filled in', async () => {
    await renderOrder({ status: 'delivered', rider_rating: null });
    await fireEvent.press(await screen.findByLabelText('1 stars'));
    await fireEvent.press(screen.getByText(copy.review.cta));
    expect(reviewOrder).toHaveBeenCalledWith(42, 1, undefined);
  });
});
