import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { ProductGrid } from '../ProductGrid';
import { ProductCarousel } from '../ProductCarousel';
import { getGridMetrics } from '../../../lib/grid';
import { semanticSpacing } from '../../../theme/spacing';
import type { ProductVO } from '../../../lib/product';
import { TestWrapper } from '../../../test/utils';

const product = (id: number): ProductVO =>
  ({
    id,
    slug: `p${id}`,
    name: `Product ${id}`,
    description: null,
    unit: 'each',
    categoryId: 1,
    categoryName: 'Test',
    tags: [],
    images: [],
    basePriceCents: 1000,
    salePriceCents: null,
    collectionPriceCents: null,
    effectivePriceCents: 1000,
    brand: null,
    storageTip: null,
    keyPoints: [],
    isFeatured: false,
    isActive: true,
    stockLabel: '',
    storeCount: 1,
    stores: [{ storeProductId: id, id: 1, name: 'Store', slug: 'store', isAvailable: true, stockQuantity: 5 }],
  }) as ProductVO;

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useRoute: () => ({ params: {} }),
}));

const noop = () => undefined;
const getStoreProductId = (_p: ProductVO) => null;

describe('getGridMetrics — the single source of card-width truth', () => {
  it('derives the column width from the window width (390pt device)', () => {
    const m = getGridMetrics(390);
    expect(m.screenPadding).toBe(semanticSpacing.screenPadding); // 16
    expect(m.gap).toBe(semanticSpacing.inlineGap); // 8
    expect(m.columnWidth).toBe((390 - 16 * 2 - 8) / 2); // 175
  });

  it('derives the column width on a wide window', () => {
    const m = getGridMetrics(768);
    expect(m.columnWidth).toBe((768 - 40) / 2); // 364
  });

  it('always fills the window exactly: 2 cols + gutter + edge padding', () => {
    for (const width of [320, 375, 390, 414, 430, 768]) {
      const m = getGridMetrics(width);
      expect(m.columnWidth * 2 + m.gap + m.screenPadding * 2).toBe(width);
    }
  });
});

describe('ProductGrid rendering', () => {
  it('renders every product and pins each card to the computed column width', async () => {
    const items = [product(1), product(2), product(3)];
    await render(<ProductGrid data={items} getStoreProductId={getStoreProductId} onRequestSummary={noop} />, { wrapper: TestWrapper });

    expect(screen.getByText('Product 1')).toBeTruthy();
    expect(screen.getByText('Product 2')).toBeTruthy();
    expect(screen.getByText('Product 3')).toBeTruthy();

    // Every item wrapper carries the exact computed width for the current
    // window — cards can no longer drift between screens.
    const { columnWidth } = getGridMetrics();
    const wrappers = screen.getAllByTestId('product-grid-item');
    expect(wrappers).toHaveLength(3);
    for (const wrapper of wrappers) {
      expect(wrapper.props.style).toMatchObject({ width: columnWidth });
    }
  });
});

describe('ProductCarousel rendering', () => {
  it('renders the rail with the same card width as the grid', async () => {
    await render(
      <ProductCarousel
        data={[product(1), product(2)]}
        getStoreProductId={getStoreProductId}
        ListEmptyComponent={null}
      />,
      { wrapper: TestWrapper },
    );

    const { columnWidth } = getGridMetrics();
    const wrappers = screen.getAllByTestId('product-carousel-item');
    expect(wrappers).toHaveLength(2);
    for (const wrapper of wrappers) {
      expect(wrapper.props.style).toMatchObject({ width: columnWidth });
    }
  });

  it('shows the empty component when there are no products', async () => {
    function EmptyNote() {
      return <Text>nothing to show</Text>;
    }
    await render(<ProductCarousel data={[]} getStoreProductId={getStoreProductId} ListEmptyComponent={EmptyNote} />, { wrapper: TestWrapper });
    expect(screen.queryByText('nothing to show')).toBeTruthy();
  });
});

describe('architecture guard — no scroll-motion machinery in the shared product path', () => {
  // The on-device crash (PhysicsCarousel onMomentumScrollEnd) and the
  // "motiony" feel came from Reanimated scroll worklets. The shared grid /
  // carousel must stay a plain FlatList — this keeps it that way.
  const fs = require('fs');
  const path = require('path');
  const root = path.join(__dirname, '../../../../');

  const SHARED_PATH_FILES = [
    'src/lib/grid.ts',
    'src/components/shared/ProductGrid.tsx',
    'src/components/shared/ProductCarousel.tsx',
  ];

  it.each(SHARED_PATH_FILES)('does not import Reanimated: %s', (file) => {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    expect(source).not.toMatch(/from ['"]react-native-reanimated/);
    expect(source).not.toMatch(/require\(['"]react-native-reanimated/);
  });

  it('no momentum / scroll-worklet helpers survive anywhere in src', () => {
    const { execSync } = require('child_process');
    const out = execSync(
      "grep -rn --include='*.ts' --include='*.tsx' -E 'useAnimatedScrollHandler|onMomentumScrollEnd|PhysicsCarousel' src | grep -v 'ProductGrid.test' || true",
      { cwd: root, encoding: 'utf8' },
    );
    expect(out.trim()).toBe('');
  });
});
