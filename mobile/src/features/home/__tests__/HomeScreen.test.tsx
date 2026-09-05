import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { HomeScreen } from '../HomeScreen';
import { TestWrapper } from '../../../test/utils';

// Mutable catalog fixtures read lazily by the mock factories below.
const mockCatalog: {
  categories: unknown[];
  products: unknown[];
  specials: unknown[];
  isLoading: boolean;
} = { categories: [], products: [], specials: [], isLoading: false };

jest.mock('../../catalog/hooks', () => ({
  useCategories: () => ({ data: mockCatalog.categories }),
  useProducts: () => ({ data: mockCatalog.products, isLoading: mockCatalog.isLoading }),
  useSpecials: () => ({ data: mockCatalog.specials }),
}));

jest.mock('../../../lib/apiClient', () => ({
  fetchBanners: async () => [],
  fetchRecommendations: async () => [],
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

beforeEach(() => {
  mockCatalog.categories = [];
  mockCatalog.products = [];
  mockCatalog.specials = [];
  mockCatalog.isLoading = false;
});

const renderHome = async () => render(<HomeScreen />, { wrapper: TestWrapper });

describe('HomeScreen with an empty (unseeded) catalogue', () => {
  it('shows one coherent first-run empty state', async () => {
    await renderHome();

    expect(await screen.findByText('The shelves are being stocked')).toBeTruthy();
  });

  it('does not render orphan section headers with nothing beneath them', async () => {
    await renderHome();

    await screen.findByText('The shelves are being stocked');
    expect(screen.queryByText('Best Deals')).toBeNull();
    expect(screen.queryByText('Shop by category')).toBeNull();
    expect(screen.queryByText('Featured')).toBeNull();
    expect(screen.queryByText('No featured products yet')).toBeNull();
  });
});

describe('HomeScreen with a stocked catalogue', () => {
  const product = {
    id: 42,
    slug: 'spinach',
    name: 'Spinach',
    description: null,
    unit: 'bunch',
    categoryId: 1,
    categoryName: 'Fresh',
    tags: [],
    images: [],
    basePriceCents: 1500,
    salePriceCents: null,
    collectionPriceCents: null,
    effectivePriceCents: 1500,
    brand: null,
    storageTip: null,
    keyPoints: [],
    isFeatured: true,
    isActive: true,
    stockLabel: '',
    storeCount: 0,
    stores: [],
  };

  it('renders the sections and their content', async () => {
    mockCatalog.categories = [{ id: 1, name: 'Fresh', slug: 'fresh' }];
    mockCatalog.products = [product];

    await renderHome();

    expect(screen.getByText('Best Deals')).toBeTruthy();
    expect(screen.getByText('Shop by category')).toBeTruthy();
    expect(screen.getByText('Featured')).toBeTruthy();
    expect(screen.getByText('Spinach')).toBeTruthy();
    expect(screen.queryByText('The shelves are being stocked')).toBeNull();
  });

  it('keeps the featured empty state when only featured products are missing', async () => {
    mockCatalog.categories = [{ id: 1, name: 'Fresh', slug: 'fresh' }];

    await renderHome();

    expect(screen.getByText('Shop by category')).toBeTruthy();
    expect(screen.getByText('No featured products yet')).toBeTruthy();
    expect(screen.queryByText('The shelves are being stocked')).toBeNull();
  });
});
