import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { ProductDetailScreen } from '../ProductDetailScreen';
import { useProduct } from '../../catalog/hooks';
import { useCart } from '../../cart/store';
import { useDeliveryStore } from '../../../stores/deliveryStore';
import { TestWrapper } from '../../../test/utils';
import type { ProductVO } from '../../../lib/product';

const mockUseRelated = jest.fn(() => ({ data: [] }));
jest.mock('../../catalog/hooks', () => ({
  useProduct: (slug: string) => mockUseProduct(slug),
  useRelatedProducts: (slug: string) => mockUseRelated(slug),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

const mockUseRoute = jest.fn();
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useRoute: () => mockUseRoute(),
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
}));

const mockUseProduct = jest.fn();

const vo = (): ProductVO =>
  ({
    id: 33,
    slug: 'spinach',
    name: 'Baby Spinach',
    description: 'Fresh baby spinach leaves.',
    unit: 'kg',
    categoryId: 4,
    categoryName: 'Fresh',
    tags: [],
    images: ['https://cdn.example/spinach.jpg'],
    basePriceCents: 2500,
    salePriceCents: null,
    collectionPriceCents: null,
    effectivePriceCents: 2500,
    brand: 'Green Farms',
    storageTip: 'Keep refrigerated.',
    keyPoints: ['Rich in iron', 'Washed and ready'],
    isFeatured: false,
    isActive: true,
    stockLabel: '',
    storeCount: 1,
    stores: [{ storeProductId: 1, id: 1, name: 'Checkstar Umgeni', slug: 'umgeni', isAvailable: true, stockQuantity: 10 }],
  }) as ProductVO;

beforeEach(() => {
  jest.clearAllMocks();
  mockUseRoute.mockReturnValue({ params: { slug: 'spinach' } });
  mockUseProduct.mockReturnValue({ data: vo(), isLoading: false });
  useCart.setState({ items: [] });
  useDeliveryStore.setState({
    fulfillmentStore: { id: 1, name: 'Checkstar Umgeni', slug: 'umgeni', delivery_radius_km: 10 },
    stores: [{ id: 1, name: 'Checkstar Umgeni', slug: 'umgeni', delivery_radius_km: 10 }],
  });
});

const renderDetail = async () => render(<ProductDetailScreen />, { wrapper: TestWrapper });

describe('loading', () => {
  it('shows only the skeleton until the product resolves', async () => {
    mockUseProduct.mockReturnValue({ data: undefined, isLoading: true });
    await renderDetail();
    expect(screen.queryByText('Baby Spinach')).toBeNull();
  });
});

describe('loaded product', () => {
  beforeEach(() => {
    mockUseProduct.mockReturnValue({ data: vo(), isLoading: false });
  });

  it('renders name, brand, key points, description and storage tip', async () => {
    await renderDetail();
    expect(screen.getByText('Baby Spinach')).toBeTruthy();
    expect(screen.getByText('Green Farms')).toBeTruthy();
    expect(screen.getByText(/Rich in iron/)).toBeTruthy();
    expect(screen.getByText(/Washed and ready/)).toBeTruthy();
    expect(screen.getByText('Fresh baby spinach leaves.')).toBeTruthy();
    expect(screen.getByText(/Keep refrigerated\./)).toBeTruthy();
  });

  it('offers an add-to-cart action priced at the effective price per unit', async () => {
    await renderDetail();
    expect(
      screen.getByRole('button', { name: 'Add Baby Spinach to cart' }),
    ).toBeTruthy();
    expect(screen.getByText(/R 25,00 \/ kg/)).toBeTruthy();  });

  it('adds the product once and swaps to a stepper', async () => {
    await renderDetail();
    await fireEvent.press(screen.getByRole('button', { name: 'Add Baby Spinach to cart' }));

    expect(useCart.getState().items).toEqual([
      { productId: '33', storeProductId: null, quantity: 1 },
    ]);
    expect(screen.getByLabelText('Increase quantity')).toBeTruthy();
    expect(screen.getByLabelText('Decrease quantity')).toBeTruthy();
  });

  it('removes the line again when stepped back down to zero', async () => {
    await renderDetail();
    await fireEvent.press(screen.getByRole('button', { name: 'Add Baby Spinach to cart' }));
    await fireEvent.press(screen.getByLabelText('Increase quantity'));
    expect(useCart.getState().items[0].quantity).toBe(2);

    await fireEvent.press(screen.getByLabelText('Decrease quantity'));
    await fireEvent.press(screen.getByLabelText('Decrease quantity'));
    expect(useCart.getState().items).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Add Baby Spinach to cart' })).toBeTruthy();
  });
});

describe('specials display', () => {
  it('flags a special offer when the sale price beats the base price', async () => {
    const onSale = vo();
    onSale.salePriceCents = 2000;
    mockUseProduct.mockReturnValue({ data: onSale, isLoading: false });
    await renderDetail();
    expect(screen.getByText(/Special Offer/i)).toBeTruthy();
  });

  it('shows no special flag at full price', async () => {
    await renderDetail();
    expect(screen.queryByText(/Special Offer/i)).toBeNull();
  });
});

describe('related items shelf', () => {
  it('lists related products below the product info', async () => {
    const related = vo();
    related.id = 99;
    related.name = 'Baby Carrots 500g';
    mockUseRelated.mockReturnValue({ data: [related] });
    await renderDetail();
    expect(screen.getByText('You might also like')).toBeTruthy();
    expect(screen.getByText('Baby Carrots 500g')).toBeTruthy();
  });

  it('renders no shelf when there are no related products', async () => {
    mockUseRelated.mockReturnValue({ data: [] });
    await renderDetail();
    expect(screen.queryByText('You might also like')).toBeNull();
  });
});

describe('error resilience', () => {
  it('keeps showing the skeleton if the fetch fails outright', async () => {
    mockUseProduct.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    await renderDetail();
    expect(screen.queryByText('Baby Spinach')).toBeNull();
  });
});
