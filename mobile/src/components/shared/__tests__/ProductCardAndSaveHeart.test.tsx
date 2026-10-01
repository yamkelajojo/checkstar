import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ProductCard } from '../ProductCard';
import { useCart } from '../../../features/cart/store';
import { useFavoritesStore } from '../../../stores/favoritesStore';
import { TestWrapper } from '../../../test/utils';
import type { ProductVO } from '../../../lib/product';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('../../../lib/apiClient', () => ({
  ...jest.requireActual('../../../lib/apiClient'),
  addFavorite: jest.fn(() => Promise.resolve({ message: 'Added' })),
  removeFavorite: jest.fn(() => Promise.resolve({ message: 'Removed' })),
}));

const makeProduct = (overrides: Partial<ProductVO> = {}): ProductVO =>
  ({
    id: 33,
    slug: 'spinach',
    name: 'Baby Spinach 200g',
    description: 'Fresh baby spinach leaves.',
    unit: 'pack',
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
    keyPoints: [],
    isFeatured: false,
    isActive: true,
    stockLabel: '',
    storeCount: 1,
    stores: [
      {
        storeProductId: 101,
        id: 1,
        name: 'Checkstar Umgeni',
        slug: 'umgeni',
        isAvailable: true,
        stockQuantity: 10,
      },
    ],
    ...overrides,
  }) as ProductVO;

beforeEach(() => {
  jest.clearAllMocks();
  useCart.setState({ items: [] });
  useFavoritesStore.setState({
    favorites: new Set<number>(),
    favoriteProducts: {},
    loaded: true,
  });
});

describe('ProductCard & SaveHeart UI States and Transitions (White-Box)', () => {
  it('renders idle state (quantity === 0) with Add + button and transitions smoothly to Stepper and back', async () => {
    const product = makeProduct();
    await render(<ProductCard product={product} />, { wrapper: TestWrapper });

    // State 1: Idle (quantity === 0)
    expect(screen.getByText('Baby Spinach 200g')).toBeTruthy();
    expect(screen.getByText('R 25.00 / pack')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add Baby Spinach 200g to cart' })).toBeTruthy();
    expect(screen.queryByLabelText('Increase quantity')).toBeNull();

    // Transition 1: Add + -> Stepper (quantity 0 -> 1)
    await fireEvent.press(screen.getByRole('button', { name: 'Add Baby Spinach 200g to cart' }));
    expect(useCart.getState().items).toEqual([
      { productId: '33', storeProductId: null, quantity: 1 },
    ]);
    expect(screen.queryByRole('button', { name: 'Add Baby Spinach 200g to cart' })).toBeNull();
    expect(screen.getByLabelText('Increase quantity')).toBeTruthy();
    expect(screen.getByLabelText('Decrease quantity')).toBeTruthy();
    expect(screen.getByText('1')).toBeTruthy();

    // State 2: Stepper increment (quantity 1 -> 2)
    await fireEvent.press(screen.getByLabelText('Increase quantity'));
    expect(useCart.getState().items[0].quantity).toBe(2);
    expect(screen.getByText('2')).toBeTruthy();

    // Transition 2: Stepper -> Add + (quantity 2 -> 1 -> 0)
    await fireEvent.press(screen.getByLabelText('Decrease quantity'));
    expect(screen.getByText('1')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Decrease quantity'));
    expect(useCart.getState().items).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Add Baby Spinach 200g to cart' })).toBeTruthy();
  });

  it('resolves store-scoped cart quantities when storeProductId is provided vs fallback', async () => {
    useCart.setState({
      items: [{ productId: '33', storeProductId: 101, quantity: 3 }],
    });
    const product = makeProduct();
    await render(<ProductCard product={product} storeProductId={101} />, { wrapper: TestWrapper });

    expect(screen.getByText('3')).toBeTruthy();
  });

  it('renders black % OFF badge for product-level salePriceCents and collectionPriceCents, and hides badge at full price', async () => {
    const saleProduct = makeProduct({ salePriceCents: 2000, effectivePriceCents: 2000 });
    const { rerender } = await render(<ProductCard product={saleProduct} />, { wrapper: TestWrapper });
    expect(screen.getByText('20% OFF')).toBeTruthy();

    const specialProduct = makeProduct({
      salePriceCents: null,
      collectionPriceCents: 1500,
      effectivePriceCents: 1500,
    });
    await rerender(<ProductCard product={specialProduct} />);
    expect(screen.getByText('40% OFF')).toBeTruthy();

    const regularProduct = makeProduct();
    await rerender(<ProductCard product={regularProduct} />);
    expect(screen.queryByText(/% OFF/)).toBeNull();
  });

  it('handles string image, empty image fallback (🛒), and onRequestSummary pressable price trigger', async () => {
    const onRequestSummary = jest.fn();
    const noImgProduct = makeProduct({ images: [] });
    await render(
      <ProductCard product={noImgProduct} onRequestSummary={onRequestSummary} source="search" />,
      { wrapper: TestWrapper },
    );

    // Fallback emoji rendered when images is empty
    expect(screen.getByText('🛒')).toBeTruthy();

    // Press summary trigger
    await fireEvent.press(screen.getByTestId('summary-trigger-33'));
    expect(onRequestSummary).toHaveBeenCalledWith(noImgProduct, null);

    // Press card body navigates to ProductDetail with source attribution
    await fireEvent.press(screen.getByLabelText('Baby Spinach 200g'));
    expect(mockNavigate).toHaveBeenCalledWith('ProductDetail', {
      slug: 'spinach',
      source: 'search',
    });
  });

  it('toggles SaveHeart between saved and unsaved states and caches the product in favoritesStore', async () => {
    const product = makeProduct();
    await render(<ProductCard product={product} />, { wrapper: TestWrapper });

    // Initial unsaved state
    const saveBtn = screen.getByRole('button', { name: 'Save to favorites' });
    expect(saveBtn).toBeTruthy();
    expect(useFavoritesStore.getState().favorites.has(33)).toBe(false);

    // Transition: Unsaved -> Saved
    await fireEvent.press(saveBtn);
    expect(useFavoritesStore.getState().favorites.has(33)).toBe(true);
    expect(useFavoritesStore.getState().favoriteProducts[33]?.name).toBe('Baby Spinach 200g');
    expect(screen.getByRole('button', { name: 'Remove from favorites' })).toBeTruthy();

    // Transition: Saved -> Unsaved
    await fireEvent.press(screen.getByRole('button', { name: 'Remove from favorites' }));
    expect(useFavoritesStore.getState().favorites.has(33)).toBe(false);
    expect(screen.getByRole('button', { name: 'Save to favorites' })).toBeTruthy();
  });
});
