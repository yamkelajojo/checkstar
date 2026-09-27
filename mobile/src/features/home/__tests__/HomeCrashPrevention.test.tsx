/**
 * Home screen crash prevention — renders the real screen.
 *
 * The previous version of this file imported `render` and never called it:
 * its only assertion was `typeof HomeScreen === 'function'`, which passes even
 * when the screen throws on mount. The home screen is the first thing every
 * customer sees, so this suite mounts it for real across the three data states
 * that used to blank it: empty, loading and error.
 *
 * The section hooks read their state from a global that each test sets, so the
 * mock factory stays hoist-safe without resetting the module registry (which
 * would duplicate React and break hooks).
 */
import { render, screen } from '@testing-library/react-native';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { HomeScreen } from '../HomeScreen';

interface QueryState {
  data?: unknown;
  isLoading?: boolean;
  error?: Error | null;
}

function setState(state: QueryState) {
  (globalThis as Record<string, unknown>).__homeHookState = {
    categories: state,
    specials: state,
    trending: state,
    popular: state,
    newArrivals: state,
  };
}

jest.mock('../../catalog/hooks', () => {
  const current = () =>
    (globalThis as Record<string, any>).__homeHookState ?? {
      categories: {},
      specials: {},
      trending: {},
      popular: {},
      newArrivals: {},
    };
  return {
    useCategories: () => current().categories,
    useSpecials: () => current().specials,
    useTrendingProducts: () => current().trending,
    usePopularProducts: () => current().popular,
    useNewArrivals: () => current().newArrivals,
  };
});

jest.mock('@tanstack/react-query', () => ({
  ...(jest.requireActual('@tanstack/react-query') as object),
  useQuery: () => ({ data: [], isLoading: false, error: null, refetch: jest.fn() }),
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  setState({ data: [], isLoading: false, error: null });
});

describe('HomeScreen crash prevention', () => {
  it('mounts with an empty catalogue and shows the core affordances', async () => {
    await render(<HomeScreen />);

    // Search and store selection are always present, whatever the data does.
    expect(screen.getByLabelText('Search for products')).toBeTruthy();
    expect(screen.getByLabelText('Choose delivery store')).toBeTruthy();
  });

  it('mounts while every section is still loading', async () => {
    setState({ isLoading: true });

    await render(<HomeScreen />);

    expect(screen.getByLabelText('Search for products')).toBeTruthy();
    expect(screen.queryByLabelText('Choose delivery store')).toBeTruthy();
  });

  it('offers a retry instead of a blank screen when sections fail', async () => {
    setState({ error: new Error('network down') });

    await render(<HomeScreen />);

    expect(screen.getByText('Retry')).toBeTruthy();
  });
});
