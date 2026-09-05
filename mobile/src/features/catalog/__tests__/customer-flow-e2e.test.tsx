import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { useCart } from '../../cart/store';
import { useDeliveryStore } from '../../../stores/deliveryStore';
import { useSession } from '../../../stores/session';
import { BrowseScreen } from '../BrowseScreen';
import { TestWrapper } from '../../../test/utils';
import type { ProductVO } from '../../../lib/product';
import type { ApiStore } from '../../../lib/types';

const mockUseCategories = jest.fn();
const mockUseInfiniteProducts = jest.fn();
jest.mock('../hooks', () => ({
  useCategories: () => mockUseCategories(),
  useInfiniteProducts: (params: unknown) => mockUseInfiniteProducts(params),
}));

jest.mock('../ProductSummaryModal', () => ({
  ProductSummaryModal: () => null,
}));

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
  useRoute: () => ({ params: undefined }),
}));

const vo = (id: number, name: string, price: number): ProductVO =>
  ({
    id, slug: `slug-${id}`, name, description: null, unit: 'each', categoryId: 1, categoryName: 'Test Category', tags: [],
    images: [], basePriceCents: price, salePriceCents: null, collectionPriceCents: null,
    effectivePriceCents: price, brand: null, storageTip: null, keyPoints: [], isFeatured: false,
    isActive: true, stockLabel: '', storeCount: 0, stores: [],
  }) as ProductVO;

const products = [vo(101, 'Bread', 1000), vo(102, 'Milk', 2500)];
const store: ApiStore = { id: 3, name: 'Checkstar Musgrave', slug: 'musgrave', delivery_radius_km: 5 };

beforeEach(() => {
  jest.clearAllMocks();
  useCart.setState({ items: [] });
  useSession.setState({ status: 'guest', token: null, user: null });
  useDeliveryStore.setState({ fulfillmentStore: store, stores: [store] });
  mockUseCategories.mockReturnValue({ data: [] });
  mockUseInfiniteProducts.mockReturnValue({
    data: { pages: [{ products }], pageParams: [undefined] }, isLoading: false, hasNextPage: false, fetchNextPage: jest.fn(),
  });
});

describe('Customer Purchase Flow (Browse → Cart → Checkout)', () => {
  test('browse screen renders products from the active store', async () => {
    await render(<BrowseScreen />, { wrapper: TestWrapper });
    expect(screen.getByText('Bread')).toBeTruthy();
    expect(screen.getByText('Milk')).toBeTruthy();
  });

  test('customer can add an item to the cart from the browse grid', async () => {
    await render(<BrowseScreen />, { wrapper: TestWrapper });
    await fireEvent.press(screen.getAllByText('Add +')[0]);
    expect(useCart.getState().items).toHaveLength(1);
    expect(useCart.getState().items[0].productId).toBe('101');
    expect(useCart.getState().items[0].quantity).toBe(1);
  });

  test('stepper appears after adding an item and allows quantity changes', async () => {
    await render(<BrowseScreen />, { wrapper: TestWrapper });
    await fireEvent.press(screen.getAllByText('Add +')[0]);
    expect(screen.getByTestId('stepper-increase')).toBeTruthy();
    expect(screen.getByTestId('stepper-decrease')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('stepper-increase'));
    expect(useCart.getState().items[0].quantity).toBe(2);

    await fireEvent.press(screen.getByTestId('stepper-decrease'));
    expect(useCart.getState().items[0].quantity).toBe(1);

    await fireEvent.press(screen.getByTestId('stepper-decrease'));
    expect(useCart.getState().items).toHaveLength(0);
  });

  test('tapping a product card navigates to ProductDetail', async () => {
    await render(<BrowseScreen />, { wrapper: TestWrapper });
    await fireEvent.press(screen.getByLabelText('Bread'));
    expect(mockNavigate).toHaveBeenCalledWith('ProductDetail', { slug: 'slug-101', source: 'feed' });
  });
});
