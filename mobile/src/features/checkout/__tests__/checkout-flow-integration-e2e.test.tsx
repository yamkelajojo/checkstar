import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { CheckoutScreen } from '../CheckoutScreen';
import { placeOrder, validateFulfillment } from '../../../lib/apiClient';
import { getDeliveryCoords } from '../../../lib/deliveryCoords';
import type { ProductVO } from '../../../lib/product';
import { useCart } from '../../cart/store';
import { useSession } from '../../../stores/session';
import { useDeliveryStore } from '../../../stores/deliveryStore';
import { TestWrapper } from '../../../test/utils';
import { copy } from '../../../lib/strings';
import type { ApiStore, ApiUser } from '../../../lib/types';

jest.mock('../../../lib/apiClient', () => ({
  placeOrder: jest.fn(),
  validateFulfillment: jest.fn(),
  fetchStores: jest.fn(() => Promise.resolve([])),
  fetchAddresses: jest.fn(() => Promise.resolve([])),
}));

jest.mock('../../../lib/deliveryCoords', () => ({
  getDeliveryCoords: jest.fn(),
}));

const mockUseProducts = jest.fn();
const mockUseAllProducts = jest.fn();
jest.mock('../../catalog/hooks', () => ({
  useProducts: (params: unknown) => mockUseProducts(params),
  useAllProducts: (params: unknown) => mockUseAllProducts(params),
}));

const mockReplace = jest.fn();
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ replace: mockReplace, navigate: mockNavigate }),
}));

const customer: ApiUser = {
  id: 1, name: 'Anna', email: 'anna@example.com', phone: null, role: 'customer', rider: null,
};

const testStore: ApiStore = {
  id: 3, name: 'Checkstar Umgeni', slug: 'umgeni', delivery_radius_km: 8,
};

const product = (id: number, effective: number): ProductVO =>
  ({
    id, slug: `p${id}`, name: `Product ${id}`, description: null, unit: 'each', categoryId: 1, categoryName: 'Test Category',
    tags: [], images: [], basePriceCents: effective, salePriceCents: null,
    collectionPriceCents: null, effectivePriceCents: effective, brand: null, storageTip: null,
    keyPoints: [], isFeatured: false, isActive: true, stockLabel: '', storeCount: 0, stores: [],
  }) as ProductVO;

const catalog = [product(1, 3000), product(2, 2000)];
const coords = { latitude: -29.85, longitude: 31.02, usedFallback: false };
const renderScreen = async () => render(<CheckoutScreen />, { wrapper: TestWrapper });
const placeOrderButton = () => screen.getByRole('button', { name: /place order/i });
const waitForButtonEnabled = () =>
  waitFor(() => {
    expect(placeOrderButton().props.accessibilityState.disabled).toBe(false);
  }, { timeout: 3000 });

beforeEach(() => {
  jest.clearAllMocks();
  mockUseProducts.mockReturnValue({ data: catalog, isLoading: false });
  mockUseAllProducts.mockReturnValue({ data: catalog, isLoading: false });
  (getDeliveryCoords as jest.Mock).mockResolvedValue(coords);
  (validateFulfillment as jest.Mock).mockResolvedValue({ success: true, store: testStore });
  useCart.setState({ items: [] });
  useSession.setState({ status: 'authenticated', token: 't', user: customer });
  useDeliveryStore.setState({ fulfillmentStore: testStore, stores: [testStore] });
});

describe('Checkout flow integration', () => {
  it('validates fulfillment and enables submit when address is valid', async () => {
    useCart.setState({ items: [{ productId: '1', storeProductId: 11, quantity: 2 }] });
    await renderScreen();
    await fireEvent.changeText(
      screen.getByPlaceholderText(copy.checkout.deliveryAddressPlaceholder),
      '12 Berea Road',
    );
    await waitForButtonEnabled();
    expect(placeOrderButton().props.accessibilityState.disabled).toBe(false);
  });

  it('places order and navigates to OrderPlaced with dispatch outcome', async () => {
    useCart.setState({
      items: [{ productId: '1', storeProductId: 11, quantity: 2 }, { productId: '2', storeProductId: null, quantity: 1 }],
    });
    (placeOrder as jest.Mock).mockResolvedValue({
      data: { id: 9 },
      dispatch: { status: 'assigned', rider_id: 7, store_id: 3 },
    });
    await renderScreen();
    await fireEvent.changeText(
      screen.getByPlaceholderText(copy.checkout.deliveryAddressPlaceholder),
      '12 Berea Road',
    );
    await waitForButtonEnabled();
    await fireEvent.press(placeOrderButton());
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('OrderPlaced', {
      orderId: 9,
      dispatch: { status: 'assigned', rider_id: 7, store_id: 3 },
    }));
  });

  it('clears cart on successful dispatch', async () => {
    useCart.setState({ items: [{ productId: '1', storeProductId: 11, quantity: 2 }] });
    (placeOrder as jest.Mock).mockResolvedValue({
      data: { id: 10 },
      dispatch: { status: 'assigned', rider_id: 1, store_id: 3 },
    });
    await renderScreen();
    await fireEvent.changeText(
      screen.getByPlaceholderText(copy.checkout.deliveryAddressPlaceholder),
      '12 Berea Road',
    );
    await waitForButtonEnabled();
    await fireEvent.press(placeOrderButton());
    await waitFor(() => expect(useCart.getState().items).toHaveLength(0));
  });

  it('keeps cart when dispatch is retrying', async () => {
    useCart.setState({ items: [{ productId: '1', storeProductId: 11, quantity: 2 }] });
    (placeOrder as jest.Mock).mockResolvedValue({
      data: { id: 11 },
      dispatch: { status: 'retrying' },
    });
    await renderScreen();
    await fireEvent.changeText(
      screen.getByPlaceholderText(copy.checkout.deliveryAddressPlaceholder),
      '12 Berea Road',
    );
    await waitForButtonEnabled();
    await fireEvent.press(placeOrderButton());
    await waitFor(() => expect(mockReplace).toHaveBeenCalled());
    expect(useCart.getState().items).toHaveLength(1);
  });

  it('keeps cart when dispatch is cancelled', async () => {
    useCart.setState({ items: [{ productId: '1', storeProductId: 11, quantity: 2 }] });
    (placeOrder as jest.Mock).mockResolvedValue({
      data: { id: 12 },
      dispatch: { status: 'cancelled' },
    });
    await renderScreen();
    await fireEvent.changeText(
      screen.getByPlaceholderText(copy.checkout.deliveryAddressPlaceholder),
      '12 Berea Road',
    );
    await waitForButtonEnabled();
    await fireEvent.press(placeOrderButton());
    await waitFor(() => expect(mockReplace).toHaveBeenCalled());
    expect(useCart.getState().items).toHaveLength(1);
  });

  it('shows sign-in prompt for guest users', async () => {
    useSession.setState({ status: 'guest', token: null, user: null });
    useCart.setState({ items: [{ productId: '1', storeProductId: 11, quantity: 2 }] });
    await renderScreen();
    expect(screen.getByText(copy.checkout.signInPrompt)).toBeTruthy();
    expect(placeOrderButton().props.accessibilityState.disabled).toBe(true);
  });
});
