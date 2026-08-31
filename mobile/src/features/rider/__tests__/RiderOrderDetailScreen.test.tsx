import { render, fireEvent, screen, act } from '@testing-library/react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RiderOrderDetailScreen } from '../RiderOrderDetailScreen';
import { fetchOrder, markItemsBought, markOutForDelivery, markDelivered } from '../../../lib/apiClient';
import { copy } from '../../../lib/strings';
import type { ApiOrder } from '../../../lib/types';

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
  useQueryClient: jest.fn(),
}));

jest.mock('../../../lib/apiClient', () => ({
  fetchOrder: jest.fn(),
  markItemsBought: jest.fn(),
  markOutForDelivery: jest.fn(),
  markDelivered: jest.fn(),
}));

const mockGoBack = jest.fn();
const mockInvalidate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
  useRoute: () => ({ params: { orderId: 42 } }),
}));

const baseOrder: ApiOrder = {
  id: 42,
  status: 'preparing',
  payment_status: 'pending',
  payment_method: 'cod',
  delivery_address: '1 Main Road, Durban',
  delivery_notes: null,
  subtotal_cents: 4500,
  delivery_fee_cents: 2500,
  total_cents: 7000,
  customer_confirmed_at: null,
  created_at: '2026-08-01T10:00:00Z',
  rider_rating: null,
  items: [
    { id: 11, product_id: 7, quantity: 2, unit_price_cents: 1000, product_snapshot: { name: 'Bread', unit: 'each' } },
    { id: 12, product_id: 8, quantity: 1, unit_price_cents: 2500, product_snapshot: { name: 'Milk', unit: '2L' } },
  ],
  store: null,
  rider: null,
  activity_logs: [],
};

function renderOrder(status: ApiOrder['status']) {
  (useQuery as jest.Mock).mockImplementation(() => ({ data: { ...baseOrder, status }, isLoading: false }));
  (useQueryClient as jest.Mock).mockReturnValue({ invalidateQueries: mockInvalidate });
  return render(<RiderOrderDetailScreen />);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockInvalidate.mockClear();
});

describe('RiderOrderDetailScreen', () => {
  it('renders the order header, delivery address and items', async () => {
    await renderOrder('preparing');
    expect(await screen.findByText('Order #42')).toBeTruthy();
    expect(screen.getByText('Preparing')).toBeTruthy();
    expect(screen.getAllByText('1 Main Road, Durban').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('2 × Bread')).toBeTruthy();
    expect(screen.getByText('1 × Milk')).toBeTruthy();
    expect(screen.getByText('R 70,00')).toBeTruthy();
  });

  it('toggles a bought item only while the order is preparing', async () => {
    await renderOrder('preparing');
    const bread = screen.getByRole('button', { name: /2 × Bread/ });
    expect(bread).toHaveProp('accessibilityState', { checked: false, disabled: false });
    await fireEvent.press(bread);
    expect(screen.getByRole('button', { name: /2 × Bread/ })).toHaveProp('accessibilityState', { checked: true, disabled: false });
    expect(screen.queryByRole('button', { name: copy.rider.outForDelivery })).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: /1 × Milk/ }));
    expect(screen.getByRole('button', { name: copy.rider.outForDelivery })).toBeTruthy();
  });

  it('does not allow toggling items once the order has left the store', async () => {
    await renderOrder('out_for_delivery');
    expect(screen.getByRole('button', { name: /2 × Bread/ })).toBeDisabled();
  });

  it('calls markItemsBought with every item id', async () => {
    (markItemsBought as jest.Mock).mockResolvedValue({});
    await renderOrder('preparing');
    await fireEvent.press(screen.getByRole('button', { name: copy.rider.markItemsBought }));
    expect(markItemsBought).toHaveBeenCalledWith(42, [11, 12]);
    expect(mockInvalidate).toHaveBeenCalled();
  });

  it('marks the order out for delivery once every item is selected', async () => {
    (markOutForDelivery as jest.Mock).mockResolvedValue({});
    await renderOrder('preparing');
    await fireEvent.press(screen.getByRole('button', { name: /2 × Bread/ }));
    await fireEvent.press(screen.getByRole('button', { name: /1 × Milk/ }));
    await fireEvent.press(screen.getByRole('button', { name: copy.rider.outForDelivery }));
    expect(markOutForDelivery).toHaveBeenCalledWith(42);
    expect(mockInvalidate).toHaveBeenCalled();
  });

  it('shows the mark-delivered action only while out for delivery', async () => {
    await renderOrder('preparing');
    expect(screen.queryByRole('button', { name: copy.rider.markDelivered })).toBeNull();

    await renderOrder('out_for_delivery');
    await fireEvent.press(screen.getByRole('button', { name: copy.rider.markDelivered }));
    expect(markDelivered).toHaveBeenCalledWith(42);
    expect(mockInvalidate).toHaveBeenCalled();
  });

  it('shows a delivered confirmation with no actions once delivered', async () => {
    await renderOrder('delivered');
    expect(await screen.findByText('Delivered ✓')).toBeTruthy();
    expect(screen.queryByRole('button', { name: copy.rider.markItemsBought })).toBeNull();
    expect(screen.queryByRole('button', { name: copy.rider.markDelivered })).toBeNull();
  });

  it.skip('disables the action buttons while a mutation is in flight', async () => {
    let release: () => void = () => {};
    (markItemsBought as jest.Mock).mockImplementation(
      () => new Promise<void>((resolve) => {
        release = resolve;
      }),
    );
    await renderOrder('preparing');
    await fireEvent.press(screen.getByRole('button', { name: copy.rider.markItemsBought }));
    expect(screen.getByRole('button', { name: copy.rider.markItemsBought })).toBeDisabled();
    await act(async () => {
      release();
    });
  }, 300000);

  it('goes back from the done button', async () => {
    await renderOrder('preparing');
    await fireEvent.press(screen.getByRole('button', { name: copy.orders.done }));
    expect(mockGoBack).toHaveBeenCalled();
  });
});
