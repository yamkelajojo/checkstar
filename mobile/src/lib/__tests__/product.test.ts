import { toCents, mapProduct, type ProductVO } from '../product';
import type { ApiProduct } from '../types';

describe('product', () => {
  describe('toCents', () => {
    it('converts string Rand to cents', () => {
      expect(toCents('12.50')).toBe(1250);
      expect(toCents('0.01')).toBe(1);
      expect(toCents('100')).toBe(10000);
    });

    it('converts number Rand to cents', () => {
      expect(toCents(12.5)).toBe(1250);
      expect(toCents(100)).toBe(10000);
    });

    it('returns 0 for invalid input', () => {
      expect(toCents('invalid')).toBe(0);
      expect(toCents(NaN)).toBe(0);
      expect(toCents(Infinity)).toBe(0);
    });

    it('rounds correctly', () => {
      expect(toCents('12.555')).toBe(1256);
      expect(toCents('12.554')).toBe(1255);
    });
  });

  const baseApiProduct: ApiProduct = {
    id: 1,
    slug: 'test-product',
    name: 'Test Product',
    description: 'A test product',
    unit: 'each',
    category_id: 5,
    tags: ['tag1', 'tag2'],
    images: ['img1.jpg', 'img2.jpg'],
    price: '25.00',
    sale_price: null,
    specials: [],
    brand: 'Test Brand',
    storage_tip: 'Keep cool',
    key_points: ['Point 1', 'Point 2'],
    is_featured: true,
    is_active: true,
  };

  describe('mapProduct', () => {
    it('maps all fields correctly', () => {
      const result = mapProduct(baseApiProduct);
      expect(result.id).toBe(1);
      expect(result.slug).toBe('test-product');
      expect(result.name).toBe('Test Product');
      expect(result.description).toBe('A test product');
      expect(result.unit).toBe('each');
      expect(result.categoryId).toBe(5);
      expect(result.categoryName).toBeNull();
      expect(result.tags).toEqual(['tag1', 'tag2']);
      expect(result.images).toEqual(['img1.jpg', 'img2.jpg']);
      expect(result.basePriceCents).toBe(2500);
      expect(result.brand).toBe('Test Brand');
      expect(result.storageTip).toBe('Keep cool');
      expect(result.keyPoints).toEqual(['Point 1', 'Point 2']);
      expect(result.isFeatured).toBe(true);
      expect(result.isActive).toBe(true);
    });

    it('uses sale price when available', () => {
      const withSale = { ...baseApiProduct, sale_price: '20.00' };
      const result = mapProduct(withSale);
      expect(result.salePriceCents).toBe(2000);
      expect(result.effectivePriceCents).toBe(2000);
    });

    it('uses collection price when no sale price', () => {
      const withSpecial = {
        ...baseApiProduct,
        sale_price: null,
        specials: [{ id: 1, title: 'Special', sale_price: '18.00', is_active: true }],
      };
      const result = mapProduct(withSpecial);
      expect(result.collectionPriceCents).toBe(1800);
      expect(result.effectivePriceCents).toBe(1800);
    });

    it('prioritizes sale price over collection price', () => {
      const withBoth = {
        ...baseApiProduct,
        sale_price: '20.00',
        specials: [{ id: 1, title: 'Special', sale_price: '18.00', is_active: true }],
      };
      const result = mapProduct(withBoth);
      expect(result.salePriceCents).toBe(2000);
      expect(result.collectionPriceCents).toBe(1800);
      expect(result.effectivePriceCents).toBe(2000);
    });

    it('maps category name from nested category object', () => {
      const withCategory = {
        ...baseApiProduct,
        category: { id: 5, name: 'Fresh Produce', slug: 'fresh-produce', description: null, icon: null, image: null, sort_order: 1 },
      };
      const result = mapProduct(withCategory);
      expect(result.categoryName).toBe('Fresh Produce');
    });

    it('handles null optional fields', () => {
      const minimal: ApiProduct = {
        id: 2,
        slug: 'minimal',
        name: 'Minimal',
        description: null,
        unit: 'kg',
        category_id: 1,
        tags: null,
        images: [],
        price: '10.00',
        sale_price: null,
        specials: undefined,
        brand: null,
        storage_tip: null,
        key_points: null,
        is_featured: false,
        is_active: false,
      };
      const result = mapProduct(minimal);
      expect(result.description).toBeNull();
      expect(result.tags).toEqual([]);
      expect(result.images).toEqual([]);
      expect(result.brand).toBeNull();
      expect(result.storageTip).toBeNull();
      expect(result.keyPoints).toEqual([]);
      expect(result.isFeatured).toBe(false);
      expect(result.isActive).toBe(false);
      expect(result.stockLabel).toBe('Out of stock');
    });

    it('sets stockLabel based on is_active', () => {
      const active = { ...baseApiProduct, is_active: true };
      const inactive = { ...baseApiProduct, is_active: false };
      expect(mapProduct(active).stockLabel).toBe('In stock');
      expect(mapProduct(inactive).stockLabel).toBe('Out of stock');
    });

    it('returns correct ProductVO type', () => {
      const result = mapProduct(baseApiProduct);
      const expectedKeys: (keyof ProductVO)[] = [
        'id', 'slug', 'name', 'description', 'unit', 'categoryId', 'categoryName',
        'tags', 'images', 'basePriceCents', 'salePriceCents',
        'collectionPriceCents', 'effectivePriceCents', 'brand',
        'storageTip', 'keyPoints', 'isFeatured', 'isActive', 'stockLabel',
      ];
      expectedKeys.forEach((key) => {
        expect(key in result).toBe(true);
      });
    });
  });
});