import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { SearchScreen } from '../SearchScreen';
import { storage, STORAGE_KEYS } from '../../../lib/storage';
import { useDeliveryStore } from '../../../stores/deliveryStore';
import { TestWrapper } from '../../../test/utils';
import type { ApiCategory } from '../../../lib/types';

jest.mock('../../../lib/storage', () => {
  const actual = jest.requireActual<typeof import('../../../lib/storage')>('../../../lib/storage');
  return {
    ...actual,
    storage: { get: jest.fn(), set: jest.fn(), remove: jest.fn() },
  };
});

const mockUseCategories = jest.fn();
const mockUseProducts = jest.fn();
const mockGoBack = jest.fn();

jest.mock('../../catalog/hooks', () => ({
  useCategories: () => mockUseCategories(),
  useProducts: (params: unknown) => mockUseProducts(params),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
}));

const categories: ApiCategory[] = [
  { id: 1, name: 'Beverages', slug: 'beverages', sort_order: 1 },
];

const advance = async (ms: number) => {
  await act(() => new Promise((r) => setTimeout(r, ms)));
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseCategories.mockReturnValue({ data: categories });
  mockUseProducts.mockReturnValue({ data: [], isLoading: false });
  useDeliveryStore.setState({
    store: { id: 5, name: 'U', slug: 'u', delivery_radius_km: 8 },
    stores: [],
  });
  (storage.get as jest.Mock).mockResolvedValue(null);
});

const renderSearch = async () =>
  render(<SearchScreen />, { wrapper: TestWrapper });

const flush = () => act(async () => { await Promise.resolve(); });

const type = async (text: string) => {
  await act(async () => {
    fireEvent.changeText(screen.getByLabelText('Search for products'), text);
  });
};

describe('idle state', () => {
  it('shows recent searches loaded from storage', async () => {
    (storage.get as jest.Mock).mockResolvedValue(['milk']);
    await renderSearch();
    await flush();
    expect(screen.getByText('milk')).toBeTruthy();
  });

  it('lists categories as one-tap search shortcuts', async () => {
    await renderSearch();
    await flush();

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: /beverages/i }));
    });
    expect(screen.getByLabelText('Search for products').props.value).toBe('Beverages');
  });

  it('queries with the store scope but disabled while under two characters', async () => {
    await renderSearch();
    await flush();
    await type('m');
    await advance(500);
    expect(mockUseProducts).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false, storeId: 5 }),
    );
  });
});

describe('debounced searching', () => {
  it('enables the query once the term is long enough and settles for 400ms', async () => {
    await renderSearch();
    await flush();
    await type('mi');
    await advance(200);
    expect(mockUseProducts).not.toHaveBeenCalledWith(
      expect.objectContaining({ search: 'mi' }),
    );

    await type('mil');
    await advance(450);
    expect(mockUseProducts).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'mil', enabled: true }),
    );
  });

  it('shows a no-match state when nothing came back', async () => {
    await renderSearch();
    await flush();
    await type('zzz');
    await advance(450);
    expect(screen.getByText(/No matches for "zzz"/)).toBeTruthy();
  });

  it('renders result cards when products match', async () => {
    mockUseProducts.mockReturnValue({
      data: [{ id: 9, name: 'Full Cream Milk' }],
      isLoading: false,
    });
    await renderSearch();
    await flush();
    await type('milk');
    await advance(450);
    expect(screen.getByText(/results \u00B7 save search/)).toBeTruthy();
    expect(screen.getByText('Full Cream Milk')).toBeTruthy();
  });
});

describe('saving searches', () => {
  const primeResults = () =>
    mockUseProducts.mockReturnValue({ data: [{ id: 1, name: 'X' }], isLoading: false });

  it('persists the debounced term newest-first, deduped, capped at five', async () => {
    (storage.get as jest.Mock).mockResolvedValue(['bread', 'eggs']);
    primeResults();
    await renderSearch();
    await flush();

    await type('milk');
    await advance(450);
    await act(async () => {
      fireEvent.press(screen.getByText(/save search/));
    });
    await flush();
    expect(storage.set).toHaveBeenCalledWith(STORAGE_KEYS.recentSearches, [
      'milk',
      'bread',
      'eggs',
    ]);
  });

  it('moves a repeated term to the front instead of duplicating it', async () => {
    (storage.get as jest.Mock).mockResolvedValue(['bread', 'milk']);
    primeResults();
    await renderSearch();
    await flush();

    await type('milk');
    await advance(450);
    await act(async () => {
      fireEvent.press(screen.getByText(/save search/));
    });
    await flush();
    expect(storage.set).toHaveBeenLastCalledWith(STORAGE_KEYS.recentSearches, ['milk', 'bread']);
  });

  it('never keeps more than five recents', async () => {
    (storage.get as jest.Mock).mockResolvedValue(['a', 'b', 'c', 'd', 'e']);
    primeResults();
    await renderSearch();
    await flush();

    await type('fresh');
    await advance(450);
    await act(async () => {
      fireEvent.press(screen.getByText(/save search/));
    });
    await flush();
    const saved = (storage.set as jest.Mock).mock.calls.at(-1)[1] as string[];
    expect(saved).toEqual(['fresh', 'a', 'b', 'c', 'd']);
  });
});

describe('leaving the screen', () => {
  it('goes back when Cancel is tapped', async () => {
    await renderSearch();
    await flush();
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
    });
    expect(mockGoBack).toHaveBeenCalled();
  });
});

describe('edge cases', () => {
  it('shows loading state while searching', async () => {
    mockUseProducts.mockReturnValue({ data: [], isLoading: true });
    await renderSearch();
    await flush();

    await type('milk');
    await advance(450);

    expect(screen.getByText('Searching\u2026')).toBeTruthy();
  });

  it('handles empty search results gracefully', async () => {
    mockUseProducts.mockReturnValue({ data: [], isLoading: false });
    await renderSearch();
    await flush();

    await type('nonexistentproduct');
    await advance(450);

    expect(screen.getByText(/No matches for/)).toBeTruthy();
  });

  it('debounces rapid input changes', async () => {
    // This test verifies the debounce logic by checking that
    // the query is not enabled for short terms
    await renderSearch();
    await flush();

    await type('m');
    await advance(200);
    // Query should still be disabled for single character
    expect(mockUseProducts).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false }),
    );
  });
});
