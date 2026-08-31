import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { BrowseScreen } from '../BrowseScreen';
import { useCart } from '../../cart/store';
import { useDeliveryStore } from '../../../stores/deliveryStore';
import { TestWrapper } from '../../../test/utils';
import type { ApiCategory, ApiStore } from '../../../lib/types';
import type { ProductVO } from '../../../lib/product';

const mockUseCategories = jest.fn();
const mockUseInfiniteProducts = jest.fn();
jest.mock('../hooks', () => ({
  useCategories: () => mockUseCategories(),
  useInfiniteProducts: (params: unknown) => mockUseInfiniteProducts(params),
}));

jest.mock('../ProductSummaryModal', () => ({
  ProductSummaryModal: ({ product, onClose }: { product: { name: string }; onClose: () => void }) => {
    const React = require('react');
    const { Text, View } = require('react-native');
    const Tactile =
      require('../../../components/shared/TactilePressable').TactilePressable;
    return React.createElement(
      View,
      null,
      React.createElement(Text, null, `SUMMARY:${product.name}`),
      React.createElement(
        Tactile,
        { accessibilityRole: 'button', onPress: onClose, testID: 'close-summary' },
        React.createElement(Text, null, 'CLOSE_SUMMARY'),
      ),
    );
  },
}));

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
}));

const categories: ApiCategory[] = [{ id: 4, name: 'Fresh', slug: 'fresh', sort_order: 1 }];

const vo = (id: number, name: string): ProductVO =>
  ({
    id,
    slug: `slug-${id}`,
    name,
    description: null,
    unit: 'each',
    categoryId: 4,
    tags: [],
    images: [],
    basePriceCents: 2500,
    salePriceCents: null,
    collectionPriceCents: null,
    effectivePriceCents: 2500,
    brand: null,
    storageTip: null,
    keyPoints: [],
    isFeatured: false,
    isActive: true,
    stockLabel: '',
    storeCount: 0,
    stores: [],
  }) as ProductVO;

const products = [vo(101, 'Spinach'), vo(102, 'Milk')];

const store: ApiStore = { id: 5, name: 'Checkstar Umgeni', slug: 'u', delivery_radius_km: 8 };

beforeEach(() => {
  jest.clearAllMocks();
  mockUseCategories.mockReturnValue({ data: categories });
  mockUseInfiniteProducts.mockReturnValue({ data: { pages: [{ products }], pageParams: [undefined] }, isLoading: false, hasNextPage: false, fetchNextPage: jest.fn() });
  useCart.setState({ items: [] });
  useDeliveryStore.setState({ fulfillmentStore: store, stores: [store] });
});

const renderBrowse = async () => render(<BrowseScreen />, { wrapper: TestWrapper });

describe('catalog browsing', () => {
  it('renders every product card from the active store catalogue', async () => {
    await renderBrowse();
    expect(screen.getByText('Spinach')).toBeTruthy();
    expect(screen.getByText('Milk')).toBeTruthy();
  });

  it('requests products scoped to the selected store by default', async () => {
    await renderBrowse();
    expect(mockUseInfiniteProducts).toHaveBeenCalledWith(
      expect.objectContaining({ category: undefined, storeId: 5 }),
    );
  });

  it('filters by a category rail selection', async () => {
    await renderBrowse();
    await fireEvent.press(screen.getByRole('button', { name: 'Fresh' }));
    expect(mockUseInfiniteProducts).toHaveBeenLastCalledWith(
      expect.objectContaining({ category: 'fresh' }),
    );
  });

  it('returns to all products when All is pressed', async () => {
    await renderBrowse();
    await fireEvent.press(screen.getByRole('button', { name: 'Fresh' }));
    await fireEvent.press(screen.getByRole('button', { name: 'All' }));
    expect(mockUseInfiniteProducts).toHaveBeenLastCalledWith(
      expect.objectContaining({ category: undefined }),
    );
  });

  it('shows an empty note once loading finishes with no products', async () => {
    mockUseInfiniteProducts.mockReturnValue({ data: { pages: [], pageParams: [] }, isLoading: true, hasNextPage: false, fetchNextPage: jest.fn() });
    await renderBrowse();
    expect(screen.queryByText('No products here yet.')).toBeNull();

    mockUseInfiniteProducts.mockReturnValue({ data: { pages: [], pageParams: [] }, isLoading: false, hasNextPage: false, fetchNextPage: jest.fn() });
    await renderBrowse();
    expect(screen.getByText('No products here yet.')).toBeTruthy();
  });
});

describe('add-to-cart flow from the grid', () => {
  it('swaps the Add button for a stepper once the product is in the cart', async () => {
    await renderBrowse();
    expect(useCart.getState().items).toHaveLength(0);
    await fireEvent.press(screen.getAllByText('Add +')[0]);
    expect(useCart.getState().items).toEqual([
      { productId: '101', storeProductId: null, quantity: 1 },
    ]);
    expect(screen.getByTestId('stepper-increase')).toBeTruthy();
    expect(screen.getByTestId('stepper-decrease')).toBeTruthy();
  });

  it('steps quantity up and down through the stepper, removing the line at zero', async () => {
    await renderBrowse();
    await fireEvent.press(screen.getAllByText('Add +')[1]);
    await fireEvent.press(screen.getByTestId('stepper-increase'));
    expect(useCart.getState().items[0].quantity).toBe(2);

    await fireEvent.press(screen.getByTestId('stepper-decrease'));
    expect(useCart.getState().items[0].quantity).toBe(1);

    await fireEvent.press(screen.getByTestId('stepper-decrease'));
    expect(useCart.getState().items).toHaveLength(0);
    expect(screen.getAllByText('Add +')).toHaveLength(2);
  });

  it('keeps quantities independent per product', async () => {
    await renderBrowse();
    await fireEvent.press(screen.getAllByText('Add +')[0]);
    await fireEvent.press(screen.getByTestId('stepper-increase'));

    await fireEvent.press(screen.getAllByText('Add +')[0]);
    const items = useCart.getState().items;
    expect(items.find((i) => i.productId === '101')?.quantity).toBe(2);
    expect(items.find((i) => i.productId === '102')?.quantity).toBe(1);
  });
});

describe('product detail hand-off', () => {
  it('navigates to ProductDetail with the product slug when the card is tapped', async () => {
    await renderBrowse();
    await fireEvent.press(screen.getByLabelText('Spinach'));
    expect(mockNavigate).toHaveBeenCalledWith('ProductDetail', { slug: 'slug-101' });
  });
});

describe('quick summary popup', () => {
  it('opens from the price badge and closes again', async () => {
    await renderBrowse();
    expect(screen.queryByText(/SUMMARY:/)).toBeNull();

    await fireEvent.press(screen.getByTestId('summary-trigger-101'));
    expect(await screen.findByText('SUMMARY:Spinach')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('close-summary'));
    expect(screen.queryByText(/SUMMARY:/)).toBeNull();
  });
});
