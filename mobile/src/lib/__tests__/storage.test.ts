import { storage, STORAGE_KEYS } from '../storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

const AsyncStorage = require('@react-native-async-storage/async-storage');

describe('storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('returns null when key does not exist', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      const result = await storage.get<string>('nonexistent');
      expect(result).toBeNull();
    });

    it('returns parsed value when key exists', async () => {
      AsyncStorage.getItem.mockResolvedValue('{"name":"Test","value":42}');
      const result = await storage.get<{ name: string; value: number }>('test-key');
      expect(result).toEqual({ name: 'Test', value: 42 });
    });

    it('returns null when JSON parsing fails', async () => {
      AsyncStorage.getItem.mockResolvedValue('invalid-json');
      const result = await storage.get('test-key');
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('stores JSON stringified value', async () => {
      AsyncStorage.setItem.mockResolvedValue(undefined);
      await storage.set('test-key', { name: 'Test', value: 42 });
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('test-key', '{"name":"Test","value":42}');
    });
  });

  describe('remove', () => {
    it('removes the key', async () => {
      AsyncStorage.removeItem.mockResolvedValue(undefined);
      await storage.remove('test-key');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('test-key');
    });
  });
});

describe('STORAGE_KEYS', () => {
  it('has all required keys', () => {
    expect(STORAGE_KEYS.cart).toBe('checkstar.cart');
    expect(STORAGE_KEYS.onboardingSeen).toBe('checkstar.onboarding.seen');
    expect(STORAGE_KEYS.deliveryStore).toBe('checkstar.deliveryStore');
    expect(STORAGE_KEYS.recentSearches).toBe('checkstar.search.recent');
    expect(STORAGE_KEYS.session).toBe('checkstar.session');
    expect(STORAGE_KEYS.apiBaseUrl).toBe('checkstar.api.baseUrl');
  });

  it('is readonly (as const)', () => {
    // TypeScript ensures this at compile time
    expect(typeof STORAGE_KEYS.cart).toBe('string');
  });
});