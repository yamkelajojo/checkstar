import { render, fireEvent, screen } from '@testing-library/react-native';
import { CartScreen } from '../CartScreen';
import { useCart } from '../store';
import { useAllProducts } from '../../catalog/hooks';
import { useDeliveryStore } from '../../../stores/deliveryStore';
import { formatZar } from '../../../lib/currency';
import { copy } from '../../../lib/strings';
import { TestWrapper } from '../../../test/utils';

jest.mock('../../catalog/hooks', () => ({ useAllProducts: jest.fn() }));

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

type CartLine = { productId: string; quantity: number; storeProductId: number | null };

const bread = {
  id: 1,
  slug: 'bread',
  name: 'Fresh Bread',
  description: null,
  unit: 'each',
  categoryId: 2,
  tags: [],
  images: [],
  basePriceCents: 1000,
  salePriceCents: null,
  collectionPriceCents: null,
  effectivePriceCents: 1000,
  brand: null,
  storageTip: null,
  keyPoints: [],
  isFeatured: false,
};

const premium = { ...bread, id: 2, slug: 'premium-bread', name: 'Premium Bread', effectivePriceCents: 3000 };

const store = { id: 3, name: 'Checkstar Musgrave', slug: 'musgrave', delivery_radius_km: 5 };

const minOrderWarning = copy.cart.minOrder.replace('{minCents}', formatZar(5000));

function setCart(items: CartLine[]) {
  useCart.setState({ items });
}

beforeEach(() => {
  mockNavigate.mockClear();
  useCart.setState({ items: [] });
  useDeliveryStore.setState({ fulfillmentStore: store });
  (useAllProducts as jest.Mock).mockReturnValue({ data: [bread, premium], isLoading: false });
});

describe('CartScreen', () => {
  it('shows the empty state when the cart has no items', async () => {
    await render(<CartScreen />, { wrapper: TestWrapper });
    expect(screen.getByText(copy.cart.emptyTitle)).toBeTruthy();
  });

  it('navigates to Browse from the empty state', async () => {
    await render(<CartScreen />, { wrapper: TestWrapper });
    await fireEvent.press(screen.getByText(copy.cart.browseSpecials));
    expect(mockNavigate).toHaveBeenCalledWith('Tabs', { screen: 'Browse' });
  });

  it('renders the subtotal for the items in the cart', async () => {
    setCart([{ productId: '1', quantity: 2, storeProductId: null }]);
    await render(<CartScreen />, { wrapper: TestWrapper });
    expect(screen.getByText('Subtotal (2 items)')).toBeTruthy();
    expect(screen.getAllByText('R 20,00').length).toBeGreaterThan(0);
  });

  it('shows the min-order warning and disables checkout below R50', async () => {
    setCart([{ productId: '1', quantity: 2, storeProductId: null }]);
    await render(<CartScreen />, { wrapper: TestWrapper });
    expect(screen.getByText(minOrderWarning)).toBeTruthy();
    expect(screen.getByRole('button', { name: copy.cart.checkOut })).toBeDisabled();
  });

  it('enables checkout once the subtotal reaches R50', async () => {
    setCart([{ productId: '2', quantity: 2, storeProductId: null }]);
    await render(<CartScreen />, { wrapper: TestWrapper });
    expect(screen.queryByText(minOrderWarning)).toBeNull();
    expect(screen.getByRole('button', { name: copy.cart.checkOut })).toBeEnabled();
  });

  it('increments the quantity from the stepper', async () => {
    setCart([{ productId: '1', quantity: 2, storeProductId: null }]);
    await render(<CartScreen />, { wrapper: TestWrapper });
    await fireEvent.press(screen.getByLabelText('Increase quantity'));
    expect(useCart.getState().items[0].quantity).toBe(3);
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('decrements the quantity from the stepper', async () => {
    setCart([{ productId: '1', quantity: 2, storeProductId: null }]);
    await render(<CartScreen />, { wrapper: TestWrapper });
    await fireEvent.press(screen.getByLabelText('Decrease quantity'));
    expect(useCart.getState().items[0].quantity).toBe(1);
  });

  it('empties the cart when the stepper decrements a single item to zero', async () => {
    setCart([{ productId: '1', quantity: 1, storeProductId: null }]);
    await render(<CartScreen />, { wrapper: TestWrapper });
    await fireEvent.press(screen.getByLabelText('Decrease quantity'));
    expect(screen.getByText(copy.cart.emptyTitle)).toBeTruthy();
  });
});
