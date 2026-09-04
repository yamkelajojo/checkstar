import { render, screen, fireEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OrderPlacedScreen } from '../OrderPlacedScreen';
import { fetchOrder } from '../../../lib/apiClient';
import { copy } from '../../../lib/strings';
import type { ApiDispatchOutcome, ApiOrder } from '../../../lib/types';
import { resolveDispatchOutcome, STATUS_STEPS } from '../model';

jest.mock('../../../lib/apiClient', () => ({
  fetchOrder: jest.fn(),
}));

const mockReplace = jest.fn();
const mockNavigate = jest.fn();
const mockUseRoute = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ replace: mockReplace, navigate: mockNavigate }),
  useRoute: () => mockUseRoute(),
}));

const baseOrder: ApiOrder = {
  id: 9, status: 'confirmed', payment_status: 'pending', payment_method: 'cod',
  delivery_address: '45 Florida Road, Durban', delivery_notes: null,
  subtotal_cents: 6000, delivery_fee_cents: 2500, total_cents: 8500,
  customer_confirmed_at: null, created_at: '2026-08-01T10:00:00Z', rider_rating: null,
  items: [
    { id: 1, product_id: 7, quantity: 3, unit_price_cents: 2000, product_snapshot: { name: 'Milk', unit: '2L' } },
  ],
  store: { id: 3, name: 'Checkstar Musgrave', slug: 'musgrave', delivery_radius_km: 5 },
  rider: null, activity_logs: [],
};

const clients: QueryClient[] = [];

function renderPlaced(params: { orderId: number; dispatch?: ApiDispatchOutcome }, orderOverrides: Partial<ApiOrder> = {}) {
  (fetchOrder as jest.Mock).mockResolvedValue({ ...baseOrder, ...orderOverrides });
  mockUseRoute.mockReturnValue({ params });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  return render(
    <QueryClientProvider client={client}>
      <OrderPlacedScreen />
    </QueryClientProvider>,
  );
}

beforeEach(() => jest.clearAllMocks());

afterEach(() => {
  for (const c of clients) c.clear();
  clients.length = 0;
});

describe('Full Customer Journey: Checkout → OrderPlaced → OrderDetail', () => {
  test('assigned dispatch shows success headline and track order button', async () => {
    await renderPlaced({ orderId: 9, dispatch: { status: 'assigned', rider_id: 2, store_id: 3 } });
    expect(await screen.findByText(copy.orders.placedTitle)).toBeTruthy();
    expect(screen.getByText(copy.orders.trackOrder)).toBeTruthy();
  });

  test('retrying dispatch shows the retrying headline and body', async () => {
    await renderPlaced(
      { orderId: 9, dispatch: { status: 'retrying' } },
      { status: 'retrying', store: null },
    );
    expect(await screen.findByText(copy.orders.retryingTitle)).toBeTruthy();
    expect(screen.getByText(copy.orders.retryingBody)).toBeTruthy();
  });

  test('cancelled dispatch shows the failure headline and returns to checkout', async () => {
    await renderPlaced(
      { orderId: 9, dispatch: { status: 'cancelled' } },
      { status: 'cancelled' },
    );
    expect(await screen.findByText(copy.orders.dispatchFailedTitle)).toBeTruthy();
    expect(screen.queryByText(copy.orders.trackOrder)).toBeNull();
    expect(screen.getByText(copy.checkout.title)).toBeTruthy();
  });

  test('track order navigates to OrderDetail', async () => {
    await renderPlaced({ orderId: 9, dispatch: { status: 'assigned' } });
    await fireEvent.press(await screen.findByText(copy.orders.trackOrder));
    expect(mockReplace).toHaveBeenCalledWith('OrderDetail', { orderId: 9 });
  });

  test('return to checkout from cancelled state navigates to Checkout', async () => {
    await renderPlaced(
      { orderId: 9, dispatch: { status: 'cancelled' } },
      { status: 'cancelled' },
    );
    await fireEvent.press(await screen.findByText(copy.checkout.title));
    expect(mockNavigate).toHaveBeenCalledWith('Checkout');
  });

  test('dispatch outcome resolves correctly from route params and live order status', () => {
    expect(resolveDispatchOutcome({ status: 'assigned' }, 'confirmed')).toBe('assigned');
    expect(resolveDispatchOutcome({ status: 'retrying' }, 'retrying')).toBe('retrying');
    expect(resolveDispatchOutcome({ status: 'cancelled' }, 'cancelled')).toBe('cancelled');
    expect(resolveDispatchOutcome(null, 'preparing')).toBe('assigned');
    expect(resolveDispatchOutcome(null, null)).toBe('assigned');
  });

  test('STATUS_STEPS covers the full happy-path lifecycle', () => {
    expect(STATUS_STEPS).toEqual(['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered']);
  });

  test('order summary shows the total from the fetched order', async () => {
    await renderPlaced({ orderId: 9, dispatch: { status: 'assigned' } });
    await screen.findByText(copy.orders.placedTitle);
    expect(screen.getByText(/R 85,00/)).toBeTruthy();
  });

  test('dispatch store name is displayed when available', async () => {
    await renderPlaced(
      { orderId: 9, dispatch: { status: 'assigned', store_name: 'Checkstar Musgrave' } },
      { status: 'confirmed' },
    );
    await screen.findByText(copy.orders.placedTitle);
    expect(screen.getAllByText(/Checkstar Musgrave/).length).toBeGreaterThanOrEqual(1);
  });
});
