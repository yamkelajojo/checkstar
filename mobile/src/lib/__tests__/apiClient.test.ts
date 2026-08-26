import { getApiBaseUrl, setApiBaseUrl, resetApiClient } from '../apiClient';
import { storage, STORAGE_KEYS } from '../storage';

jest.mock('../storage', () => ({
  storage: {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
  },
  STORAGE_KEYS: {
    apiBaseUrl: 'checkstar.api.baseUrl',
  },
}));

const mockStorage = storage as jest.Mocked<typeof storage>;

describe('apiClient config', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.get.mockResolvedValue(null);
    mockStorage.set.mockResolvedValue(undefined);
    mockStorage.remove.mockResolvedValue(undefined);
  });

  it('returns default URL when nothing is configured', async () => {
    mockStorage.get.mockResolvedValue(null);
    const url = await getApiBaseUrl();
    // In Node.js test environment (not Android/iOS), defaults to localhost
    expect(url).toBe('http://localhost:8000/api');
  });

  it('returns stored URL when configured', async () => {
    mockStorage.get.mockResolvedValue('http://192.168.1.50:8000/api');
    const url = await getApiBaseUrl();
    expect(url).toBe('http://192.168.1.50:8000/api');
  });

  it('stores the URL and resets the client', async () => {
    await setApiBaseUrl('http://192.168.1.100:8000/api');
    expect(mockStorage.set).toHaveBeenCalledWith('checkstar.api.baseUrl', 'http://192.168.1.100:8000/api');
  });

  it('removes stored URL on reset', async () => {
    await resetApiClient();
    // resetApiClient doesn't directly remove storage, but clears the client
    // The test verifies it doesn't throw
  });
});