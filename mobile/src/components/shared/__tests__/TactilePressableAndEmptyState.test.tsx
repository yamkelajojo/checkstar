import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { Heart } from 'lucide-react-native';
import { TactilePressable } from '../TactilePressable';
import { EmptyState } from '../EmptyState';
import { FavoritesScreen } from '../../../features/favorites/FavoritesScreen';
import { useFavoritesStore } from '../../../stores/favoritesStore';
import { useSession } from '../../../stores/session';
import { haptic } from '../../../lib/haptics';
import { TestWrapper } from '../../../test/utils';
import type { ProductVO } from '../../../lib/product';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
}));

jest.mock('../../../lib/haptics', () => ({
  haptic: {
    tap: jest.fn(),
    light: jest.fn(),
    commit: jest.fn(),
    impact: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
    selection: jest.fn(),
  },
}));

const mockFetchFavorites = jest.fn(() => Promise.resolve([]));
jest.mock('../../../lib/apiClient', () => ({
  ...jest.requireActual('../../../lib/apiClient'),
  fetchFavorites: () => mockFetchFavorites(),
  addFavorite: jest.fn(() => Promise.resolve({ message: 'Added' })),
  removeFavorite: jest.fn(() => Promise.resolve({ message: 'Removed' })),
}));

const sampleProduct = (id: number, name: string): ProductVO =>
  ({
    id,
    slug: `product-${id}`,
    name,
    description: 'Fresh item',
    unit: 'each',
    categoryId: 1,
    categoryName: 'Fresh',
    tags: [],
    images: ['https://cdn.example/p.jpg'],
    basePriceCents: 1999,
    salePriceCents: null,
    collectionPriceCents: null,
    effectivePriceCents: 1999,
    brand: 'Checkstar',
    storageTip: '',
    keyPoints: [],
    isFeatured: false,
    isActive: true,
    stockLabel: '',
    storeCount: 1,
    stores: [{ storeProductId: id, id: 1, name: 'Durban Central', slug: 'durban-central', isAvailable: true, stockQuantity: 10 }],
  }) as ProductVO;

describe('TactilePressable UI Variants, Layout & Haptic Transitions (White-Box)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('defaults inner Pressable flexDirection to column (preventing horizontal squeeze on vertical cards) and respects explicit row style', async () => {
    const { rerender } = await render(
      <TactilePressable variant="card" accessibilityLabel="Vertical Card">
        <Text>Top</Text>
        <Text>Bottom</Text>
      </TactilePressable>,
      { wrapper: TestWrapper },
    );

    const cardBtn = screen.getByRole('button', { name: 'Vertical Card' });
    const flatCard = StyleSheet.flatten(cardBtn.props.style);
    expect(flatCard.flexDirection).toBe('column');
    expect(flatCard.alignItems).toBe('stretch');
    expect(flatCard.width).toBe('100%');

    await rerender(
      <TactilePressable
        variant="compact"
        accessibilityLabel="Row Pill"
        style={{ flexDirection: 'row', gap: 6 }}
      >
        <Text>Left</Text>
        <Text>Right</Text>
      </TactilePressable>,
    );
    const rowBtn = screen.getByRole('button', { name: 'Row Pill' });
    const flatRow = StyleSheet.flatten(rowBtn.props.style);
    expect(flatRow.flexDirection).toBe('row');
    expect(flatRow.gap).toBe(6);
  });

  it('fires pressIn/pressOut handlers and maps each haptic mode when enabled, and suppresses when disabled', async () => {
    const onPress = jest.fn();
    const onPressIn = jest.fn();
    const onPressOut = jest.fn();

    const { rerender } = await render(
      <TactilePressable
        variant="assertive"
        haptic="commit"
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityLabel="Commit Button"
      >
        <Text>Commit</Text>
      </TactilePressable>,
      { wrapper: TestWrapper },
    );

    const btn = screen.getByRole('button', { name: 'Commit Button' });
    await fireEvent(btn, 'pressIn', {});
    expect(onPressIn).toHaveBeenCalledTimes(1);
    expect(haptic.commit).toHaveBeenCalledTimes(1);

    await fireEvent(btn, 'pressOut', {});
    expect(onPressOut).toHaveBeenCalledTimes(1);

    await fireEvent.press(btn);
    expect(onPress).toHaveBeenCalledTimes(1);

    // Disabled branch
    await rerender(
      <TactilePressable
        disabled
        haptic="commit"
        onPress={onPress}
        accessibilityLabel="Commit Button"
      >
        <Text>Commit</Text>
      </TactilePressable>,
    );
    await fireEvent(screen.getByRole('button', { name: 'Commit Button' }), 'pressIn', {});
    await fireEvent.press(screen.getByRole('button', { name: 'Commit Button' }));
    expect(haptic.commit).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('EmptyState & FavoritesScreen UI States and Transitions (White-Box)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSession.setState({ status: 'guest', token: null, user: null });
    useFavoritesStore.setState({
      favorites: new Set<number>(),
      favoriteProducts: {},
      loaded: true,
    });
  });

  it('renders EmptyState centered vertically (flex: 1, justifyContent: center, alignItems: center) with and without action', async () => {
    const { toJSON, rerender } = await render(
      <EmptyState icon={Heart} title="Empty Title" caption="Empty Caption" />,
      { wrapper: TestWrapper },
    );
    expect(screen.getByText('Empty Title')).toBeTruthy();
    expect(screen.getByText('Empty Caption')).toBeTruthy();

    const tree = toJSON() as any;
    const rootStyle = StyleSheet.flatten(tree.props.style);
    expect(rootStyle.flex).toBe(1);
    expect(rootStyle.justifyContent).toBe('center');
    expect(rootStyle.alignItems).toBe('center');

    await rerender(
      <EmptyState
        icon={Heart}
        title="Empty Title"
        caption="Empty Caption"
        action={<Text>Action CTA</Text>}
      />,
    );
    expect(screen.getByText('Action CTA')).toBeTruthy();
  });

  it('transitions FavoritesScreen from empty state -> 1 saved item -> 2 saved items -> back to empty state on unsave', async () => {
    const p1 = sampleProduct(10, 'Avocados 4 Pack');
    const p2 = sampleProduct(20, 'Sourdough Loaf');

    await render(<FavoritesScreen />, { wrapper: TestWrapper });

    // State 1: Empty state
    expect(screen.getByText('No favorites yet')).toBeTruthy();
    await fireEvent.press(screen.getByText('Browse Products'));
    expect(mockNavigate).toHaveBeenCalledWith('Browse');

    // Transition to State 2: 1 saved item (singular label)
    await act(async () => {
      await useFavoritesStore.getState().toggleFavorite(10, p1);
    });

    expect(await screen.findByText('1 saved item')).toBeTruthy();
    expect(screen.getByText('Avocados 4 Pack')).toBeTruthy();

    // Transition to State 3: 2 saved items (plural label)
    await act(async () => {
      await useFavoritesStore.getState().toggleFavorite(20, p2);
    });
    expect(await screen.findByText('2 saved items')).toBeTruthy();
    expect(screen.getByText('Sourdough Loaf')).toBeTruthy();

    // Transition back to Empty state when both items are unsaved
    await act(async () => {
      await useFavoritesStore.getState().toggleFavorite(10, p1);
      await useFavoritesStore.getState().toggleFavorite(20, p2);
    });
    expect(await screen.findByText('No favorites yet')).toBeTruthy();
  });
});
