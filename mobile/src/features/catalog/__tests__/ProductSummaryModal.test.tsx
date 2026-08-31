import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { ProductSummaryModal } from '../ProductSummaryModal';
import { useCart } from '../../cart/store';
import type { ProductVO } from '../../../lib/product';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

const product: ProductVO = {
  id: 12,
  slug: 'fresh-bread',
  name: 'Fresh Bread',
  description: null,
  unit: 'each',
  categoryId: 2,
  tags: [],
  images: [],
  basePriceCents: 1500,
  salePriceCents: 1000,
  collectionPriceCents: null,
  effectivePriceCents: 1000,
  brand: null,
  storageTip: null,
  keyPoints: [],
  isFeatured: false,
  isActive: true,
  stockLabel: 'In stock',
  storeCount: 0,
  stores: [],
};

async function renderModal() {
  return render(<ProductSummaryModal product={product} onClose={onClose} />);
}

const onClose = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  useCart.setState({ items: [] });
});

describe('ProductSummaryModal', () => {
  it('shows the product name and effective price', async () => {
    await renderModal();
    expect(screen.getByText('Fresh Bread')).toBeTruthy();
    expect(screen.getByText('R 10,00')).toBeTruthy();
    expect(screen.getByText('per each')).toBeTruthy();
  });

  it('adds the chosen quantity to the cart and closes', async () => {
    await renderModal();
    await fireEvent.press(screen.getByLabelText('Increase quantity'));
    await fireEvent.press(screen.getByLabelText('Add Fresh Bread to cart'));
    await waitFor(() => {
      expect(useCart.getState().items).toEqual([{ productId: '12', quantity: 2, storeProductId: null }]);
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('dismisses on backdrop tap without touching the cart', async () => {
    await renderModal();
    await fireEvent.press(screen.getByLabelText('Dismiss'));
    expect(onClose).toHaveBeenCalled();
    expect(useCart.getState().items).toEqual([]);
  });

  it('links through to the full product detail screen', async () => {
    await renderModal();
    await fireEvent.press(screen.getByText('View full details'));
    expect(mockNavigate).toHaveBeenCalledWith('ProductDetail', { slug: 'fresh-bread' });
    expect(onClose).toHaveBeenCalled();
  });

  it('shows stock status', async () => {
    await renderModal();
    expect(screen.getByText('In stock')).toBeTruthy();
  });

  it('renders with a source rect without crashing', async () => {
    const { getByText } = await render(<ProductSummaryModal product={product} sourceRect={{ x: 10, y: 20, width: 100, height: 30 }} onClose={onClose} />);
    expect(getByText('Fresh Bread')).toBeTruthy();
  });
});
