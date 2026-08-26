import { render, fireEvent, screen } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OrderPlacedScreen } from '../OrderPlacedScreen';
import { fetchOrder } from '../../../lib/apiClient';
import type { ApiDispatchOutcome, ApiOrder } from '../../../lib/types';
import { copy } from '../../../lib/strings';

jest.mock('../../../lib/apiClient', () => ({
  fetchOrder: jest.fn(),
}));

const mockReplace = jest.fn();
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ replace: mockReplace, navigate: mockNavigate }),
  useRoute: jest.fn(),
}));

const { useRoute } = jest.requireMock('@react-navigation/native') as {
  useRoute: jest.Mock;
};

const baseOrder: ApiOrder = {
  id: 7,
  status: 'confirmed',
  payment_status: 'pending',
  payment_method: 'cash_on_delivery',
  subtotal_cents: 10000,
  delivery_fee_cents: 2500,
  total_cents: 12500,
  created_at: '2026-08-01T10:00:00Z',
  items: [],
  store: { id: 1, name: 'Checkstar Musgrave', slug: 'musgrave', delivery_radius_km: 5 },
  rider: null,
};

const clients: QueryClient[] = [];

async function renderPlaced(params: { orderId: number; dispatch?: ApiDispatchOutcome }, order?: Partial<ApiOrder>) {
  (fetchOrder as jest.Mock).mockResolvedValue({ ...baseOrder, ...order });
  useRoute.mockReturnValue({ params });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  return render(
    <QueryClientProvider client={client}>
      <OrderPlacedScreen />
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

describe('OrderPlacedScreen', () => {
  it('shows the success state with Track order for an assigned dispatch', async () => {
    await renderPlaced({ orderId: 7, dispatch: { status: 'assigned', rider_id: 3, store_id: 1 } });
    expect(await screen.findByText(copy.orders.placedTitle)).toBeTruthy();
    expect(screen.getByText(copy.orders.trackOrder)).toBeTruthy();
  });

  it('derives assigned from the fetched order when no dispatch param exists', async () => {
    await renderPlaced({ orderId: 7 });
    expect(await screen.findByText(copy.orders.placedTitle)).toBeTruthy();
    expect(screen.getByText(copy.orders.trackOrder)).toBeTruthy();
  });

  it('shows the amber retrying state while a rider is being found, still offering Track order', async () => {
    await renderPlaced(
      { orderId: 7, dispatch: { status: 'retrying' } },
      { status: 'retrying', store: null },
    );
    expect(await screen.findByText(copy.orders.retryingTitle)).toBeTruthy();
    expect(screen.getByText(copy.orders.retryingBody)).toBeTruthy();
    expect(screen.getByText(copy.orders.trackOrder)).toBeTruthy();
    expect(screen.queryByText(copy.orders.dispatchFailedTitle)).toBeNull();
  });

  it('falls back to the route envelope for retrying before the fetch resolves', async () => {
    await renderPlaced({ orderId: 7, dispatch: { status: 'retrying' } }, { status: 'pending', store: null });
    expect(screen.getByText(copy.orders.retryingTitle)).toBeTruthy();
  });

  it('shows the failed state and swaps Track order for return to checkout when dispatch is cancelled', async () => {
    await renderPlaced({ orderId: 7, dispatch: { status: 'cancelled' } }, { status: 'cancelled' });
    expect(await screen.findByText(copy.orders.dispatchFailedTitle)).toBeTruthy();
    expect(screen.getByText(copy.orders.dispatchFailedBody)).toBeTruthy();
    expect(screen.queryByText(copy.orders.trackOrder)).toBeNull();
    expect(screen.getByText(copy.checkout.title)).toBeTruthy();
  });

  it('renders store, rider and latency when dispatch is assigned', async () => {
    await renderPlaced(
      { orderId: 7, dispatch: { status: 'assigned', store_name: 'Checkstar Musgrave', rider_name: 'Thabo', claim_latency_ms: 42 } },
      { status: 'confirmed' },
    );
    expect((await screen.findAllByText(/Checkstar Musgrave/)).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Thabo/)).toBeTruthy();
    expect(screen.getByText(/42ms/)).toBeTruthy();
  });

  it('navigates to Checkout from the failed state and to OrderDetail when tracking', async () => {
    await renderPlaced({ orderId: 7, dispatch: { status: 'cancelled' } }, { status: 'cancelled' });
    await fireEvent.press(await screen.findByText(copy.checkout.title));
    expect(mockNavigate).toHaveBeenCalledWith('Checkout');

    await renderPlaced({ orderId: 7, dispatch: { status: 'assigned' } });
    await fireEvent.press(await screen.findByText(copy.orders.trackOrder));
    expect(mockReplace).toHaveBeenCalledWith('OrderDetail', { orderId: 7 });
  });
});
