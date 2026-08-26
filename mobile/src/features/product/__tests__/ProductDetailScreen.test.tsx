import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { ProductDetailScreen } from '../ProductDetailScreen';
import { useProduct } from '../../catalog/hooks';
import { useCart } from '../../cart/store';
import { TestWrapper } from '../../../test/utils';
import type { ProductVO } from '../../../lib/product';

jest.mock('../../catalog/hooks', () => ({
  useProduct: (slug: string) => mockUseProduct(slug),
}));

const mockUseRoute = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useRoute: () => mockUseRoute(),
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
  }) as ProductVO;

beforeEach(() => {
  jest.clearAllMocks();
  mockUseRoute.mockReturnValue({ params: { slug: 'spinach' } });
  mockUseProduct.mockReturnValue({ data: vo(), isLoading: false });
  useCart.setState({ items: [] });
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
    expect(screen.getByText('\u2022 Rich in iron')).toBeTruthy();
    expect(screen.getByText('\u2022 Washed and ready')).toBeTruthy();
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
    expect(screen.getByText('Special offer')).toBeTruthy();
  });

  it('shows no special flag at full price', async () => {
    await renderDetail();
    expect(screen.queryByText('Special offer')).toBeNull();
  });
});

describe('error resilience', () => {
  it('keeps showing the skeleton if the fetch fails outright', async () => {
    mockUseProduct.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    await renderDetail();
    expect(screen.queryByText('Baby Spinach')).toBeNull();
  });
});
