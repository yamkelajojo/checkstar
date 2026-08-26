import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { CheckoutScreen } from '../CheckoutScreen';
import { placeOrder } from '../../../lib/apiClient';
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
}));

jest.mock('../../../lib/deliveryCoords', () => ({
  getDeliveryCoords: jest.fn(),
}));

const mockUseProducts = jest.fn();
jest.mock('../../catalog/hooks', () => ({
  useProducts: (params: unknown) => mockUseProducts(params),
}));

const mockReplace = jest.fn();
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ replace: mockReplace, navigate: mockNavigate }),
}));

const customer: ApiUser = {
  id: 1,
  name: 'Anna',
  email: 'anna@example.com',
  phone: null,
  role: 'customer',
  rider: null,
};

const testStore: ApiStore = {
  id: 3,
  name: 'Checkstar Umgeni',
  slug: 'umgeni',
  delivery_radius_km: 8,
};

const product = (id: number, effective: number): ProductVO =>
  ({
    id,
    slug: `p${id}`,
    name: `Product ${id}`,
    description: null,
    unit: 'each',
    categoryId: 1,
    tags: [],
    images: [],
    basePriceCents: effective,
    salePriceCents: null,
    collectionPriceCents: null,
    effectivePriceCents: effective,
    brand: null,
    storageTip: null,
    keyPoints: [],
    isFeatured: false,
    isActive: true,
    stockLabel: '',
  }) as ProductVO;

const catalog = [product(1, 3000), product(2, 2000)];

const coords = { latitude: -29.85, longitude: 31.02, usedFallback: false };

const renderScreen = async () => render(<CheckoutScreen />, { wrapper: TestWrapper });

const placeOrderButton = () => screen.getByRole('button', { name: /place order/i });

beforeEach(() => {
  jest.clearAllMocks();
  mockUseProducts.mockReturnValue({ data: catalog, isLoading: false });
  (getDeliveryCoords as jest.Mock).mockResolvedValue(coords);
  useCart.setState({ items: [] });
  useSession.setState({ status: 'authenticated', token: 't', user: customer });
  useDeliveryStore.setState({ store: testStore, stores: [testStore], resolution: 'pick' });
});

describe('empty cart guard', () => {
  it('shows the empty state instead of the form when the cart has no lines', async () => {
    await renderScreen();
    expect(screen.getByText('Nothing to check out')).toBeTruthy();
  });
});

describe('summary and totals', () => {
  it('prices the order from live product prices across lines', async () => {
    useCart.setState({
      items: [
        { productId: '1', storeProductId: 11, quantity: 2 },
        { productId: '2', storeProductId: null, quantity: 1 },
      ],
    });
    await renderScreen();
    await fireEvent.changeText(
      screen.getByPlaceholderText(copy.checkout.deliveryAddressPlaceholder),
      '12 Berea Road',
    );
    expect(placeOrderButton().props.accessibilityState.disabled).toBe(false);
    expect(screen.getByText(/Place order \u00B7 R 80,00/)).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});

describe('submit gates', () => {
  beforeEach(() => {
    useCart.setState({ items: [{ productId: '1', storeProductId: 11, quantity: 2 }] });
  });

  it('keeps the button disabled while the address is too short', async () => {
    await renderScreen();
    await fireEvent.changeText(
      screen.getByPlaceholderText(copy.checkout.deliveryAddressPlaceholder),
      'short',
    );
    expect(placeOrderButton().props.accessibilityState.disabled).toBe(true);
  });

  it('blocks guests with a sign-in prompt instead of submitting', async () => {
    useSession.setState({ status: 'guest', token: null, user: null });
    await renderScreen();
    expect(screen.getByText(copy.checkout.signInPrompt)).toBeTruthy();
    expect(placeOrderButton().props.accessibilityState.disabled).toBe(true);
  });

  it('sends the guest to Auth when they tap the sign-in prompt link', async () => {
    useSession.setState({ status: 'guest', token: null, user: null });
    await renderScreen();
    await fireEvent.press(screen.getByText(copy.checkout.signInToContinue));
    expect(mockNavigate).toHaveBeenCalledWith('Auth', { intent: 'checkout' });
  });

  it('prompts for a store when none is selected', async () => {
    useDeliveryStore.setState({ store: null });
    await renderScreen();
    expect(screen.getByText(copy.checkout.noStoreTitle)).toBeTruthy();
    await fireEvent.press(screen.getByText(copy.checkout.pickStore));
    expect(mockNavigate).toHaveBeenCalledWith('StorePicker');
  });
});

describe('placing the order', () => {
  const address = '12 Berea Road';

  beforeEach(() => {
    useCart.setState({
      items: [
        { productId: '1', storeProductId: 11, quantity: 2 },
        { productId: '2', storeProductId: null, quantity: 1 },
      ],
    });
    (placeOrder as jest.Mock).mockResolvedValue({
      data: { id: 9 },
      dispatch: { status: 'assigned', rider_id: 7, store_id: 3 },
    });
  });

  it('maps cart lines into api items with trimmed fields and coordinates', async () => {
    await renderScreen();
    await fireEvent.changeText(
      screen.getByPlaceholderText(copy.checkout.deliveryAddressPlaceholder),
      `  ${address}  `,
    );
    await fireEvent.changeText(
      screen.getByPlaceholderText(copy.checkout.deliveryNotesPlaceholder),
      '  gate code 4444  ',
    );
    await fireEvent.press(placeOrderButton());

    await waitFor(() => expect(mockReplace).toHaveBeenCalled());
    expect(placeOrder).toHaveBeenCalledTimes(1);
    const payload = (placeOrder as jest.Mock).mock.calls[0][0];
    expect(payload.items).toEqual([
      { product_id: 1, quantity: 2 },
      { product_id: 2, quantity: 1 },
    ]);
    expect(payload.delivery_address).toBe(address);
    expect(payload.delivery_notes).toBe('gate code 4444');
    expect(payload.delivery_latitude).toBe(coords.latitude);
    expect(payload.delivery_longitude).toBe(coords.longitude);
    expect(payload.payment_method).toBe('cash_on_delivery');
  });

  it('navigates to OrderPlaced with the order id and dispatch outcome', async () => {
    await renderScreen();
    await fireEvent.changeText(
      screen.getByPlaceholderText(copy.checkout.deliveryAddressPlaceholder),
      address,
    );
    await fireEvent.press(placeOrderButton());

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('OrderPlaced', {
      orderId: 9,
      dispatch: { status: 'assigned', rider_id: 7, store_id: 3 },
    }));
  });

  it('clears the cart after a successful dispatch', async () => {
    await renderScreen();
    await fireEvent.changeText(
      screen.getByPlaceholderText(copy.checkout.deliveryAddressPlaceholder),
      address,
    );
    await fireEvent.press(placeOrderButton());
    await waitFor(() => expect(useCart.getState().items).toHaveLength(0));
  });

  it('keeps the cart and warns when dispatch is retrying so the customer can re-submit', async () => {
    (placeOrder as jest.Mock).mockResolvedValue({
      data: { id: 10 },
      dispatch: { status: 'retrying' },
    });
    await renderScreen();
    await fireEvent.changeText(
      screen.getByPlaceholderText(copy.checkout.deliveryAddressPlaceholder),
      address,
    );
    await fireEvent.press(placeOrderButton());

    await waitFor(() => expect(mockReplace).toHaveBeenCalled());
    expect(useCart.getState().items).toHaveLength(2);
    expect(await screen.findByText(/No riders available right now/)).toBeTruthy();
  });

  it('keeps the cart on a cancelled dispatch too', async () => {
    (placeOrder as jest.Mock).mockResolvedValue({
      data: { id: 11 },
      dispatch: { status: 'cancelled' },
    });
    await renderScreen();
    await fireEvent.changeText(
      screen.getByPlaceholderText(copy.checkout.deliveryAddressPlaceholder),
      address,
    );
    await fireEvent.press(placeOrderButton());

    await waitFor(() => expect(mockReplace).toHaveBeenCalled());
    expect(useCart.getState().items).toHaveLength(2);
  });

  it('surfaces server error messages without clearing the cart', async () => {
    (placeOrder as jest.Mock).mockRejectedValue(new Error('Store cannot deliver to that address'));
    await renderScreen();
    await fireEvent.changeText(
      screen.getByPlaceholderText(copy.checkout.deliveryAddressPlaceholder),
      address,
    );
    await fireEvent.press(placeOrderButton());

    expect(await screen.findByText('Store cannot deliver to that address')).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(useCart.getState().items).toHaveLength(2);
  });

  it('falls back to a generic message for non-Error rejections', async () => {
    (placeOrder as jest.Mock).mockRejectedValue('boom');
    await renderScreen();
    await fireEvent.changeText(
      screen.getByPlaceholderText(copy.checkout.deliveryAddressPlaceholder),
      address,
    );
    await fireEvent.press(placeOrderButton());

    expect(await screen.findByText('Could not place the order.')).toBeTruthy();
  });
});

describe('location fallback', () => {
  it('warns when precise location failed and Durban CBD will be used', async () => {
    (getDeliveryCoords as jest.Mock).mockResolvedValue({
      latitude: -29.8587,
      longitude: 31.0218,
      usedFallback: true,
    });
    useCart.setState({ items: [{ productId: '1', storeProductId: 11, quantity: 2 }] });
    await renderScreen();
    expect(await screen.findByText(copy.checkout.locationFallback)).toBeTruthy();
  });
});
