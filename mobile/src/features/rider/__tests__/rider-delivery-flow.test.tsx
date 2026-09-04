import { render, fireEvent, screen } from '@testing-library/react-native';
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

function renderOrder(status: ApiOrder['status']) {
  (useQuery as jest.Mock).mockImplementation(() => ({ data: { ...baseOrder, status }, isLoading: false }));
  (useQueryClient as jest.Mock).mockReturnValue({ invalidateQueries: mockInvalidate });
  return render(<RiderOrderDetailScreen />);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockInvalidate.mockClear();
});

describe('Rider Delivery Flow', () => {
  test('claim assigns order and rider can see order details', async () => {
    await renderOrder('preparing');
    expect(await screen.findByText('Order #42')).toBeTruthy();
    expect(screen.getByText('Preparing')).toBeTruthy();
    expect(screen.getAllByText('1 Main Road, Durban').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Bread/)).toBeTruthy();
    expect(screen.getByText(/Milk/)).toBeTruthy();
  });

  test('mark items bought calls the API with all item ids', async () => {
    (markItemsBought as jest.Mock).mockResolvedValue({});
    await renderOrder('preparing');
    await fireEvent.press(screen.getByRole('button', { name: copy.rider.markItemsBought }));
    expect(markItemsBought).toHaveBeenCalledWith(42, [11, 12]);
    expect(mockInvalidate).toHaveBeenCalled();
  });

  test('delivery confirmation transitions order to delivered', async () => {
    (markDelivered as jest.Mock).mockResolvedValue({});
    (useQuery as jest.Mock).mockImplementation(() => ({
      data: { ...baseOrder, status: 'out_for_delivery' }, isLoading: false,
    }));
    (useQueryClient as jest.Mock).mockReturnValue({ invalidateQueries: mockInvalidate });
    await render(<RiderOrderDetailScreen />);
    expect(await screen.findByText('Order #42')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: copy.rider.markDelivered }));
    expect(markDelivered).toHaveBeenCalledWith(42);
    expect(mockInvalidate).toHaveBeenCalled();
  });

  test('delivered order shows confirmation with no action buttons', async () => {
    (useQuery as jest.Mock).mockImplementation(() => ({
      data: { ...baseOrder, status: 'delivered' }, isLoading: false,
    }));
    (useQueryClient as jest.Mock).mockReturnValue({ invalidateQueries: mockInvalidate });
    await render(<RiderOrderDetailScreen />);
    expect(await screen.findByText('Delivered ✓')).toBeTruthy();
    expect(screen.queryByRole('button', { name: copy.rider.markItemsBought })).toBeNull();
    expect(screen.queryByRole('button', { name: copy.rider.markDelivered })).toBeNull();
  });
});
