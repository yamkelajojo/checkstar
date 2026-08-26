import { useDeliveryStore } from '../deliveryStore';
import { fetchStores } from '../../lib/apiClient';
import { storage, STORAGE_KEYS } from '../../lib/storage';
import type { ApiStore } from '../../lib/types';

jest.mock('../../lib/apiClient', () => ({
  fetchStores: jest.fn(),
}));

jest.mock('../../lib/storage', () => {
  const actual = jest.requireActual<typeof import('../../lib/storage')>('../../lib/storage');
  return {
    ...actual,
    storage: { get: jest.fn(), set: jest.fn(), remove: jest.fn() },
  };
});

const makeStore = (id: number, name: string): ApiStore => ({
  id,
  name,
  slug: `store-${id}`,
  delivery_radius_km: 8,
});

const umgeni = makeStore(1, 'Checkstar Umgeni');
const chatsworth = makeStore(2, 'Checkstar Chatsworth');

beforeEach(() => {
  jest.clearAllMocks();
  useDeliveryStore.setState({ store: null, resolution: 'none', stores: [] });
});

describe('loadStores', () => {
  it('loads the store list and restores a still-valid cached selection', async () => {
    (fetchStores as jest.Mock).mockResolvedValue([umgeni, chatsworth]);
    (storage.get as jest.Mock).mockResolvedValue(umgeni);

    await useDeliveryStore.getState().loadStores();

    expect(useDeliveryStore.getState().stores).toEqual([umgeni, chatsworth]);
    expect(useDeliveryStore.getState().store).toEqual(umgeni);
    expect(storage.remove).not.toHaveBeenCalled();
  });

  it('clears a stale cached store that no longer exists upstream', async () => {
    (fetchStores as jest.Mock).mockResolvedValue([umgeni]);
    (storage.get as jest.Mock).mockResolvedValue(makeStore(99, 'Demolished Store'));

    await useDeliveryStore.getState().loadStores();

    expect(storage.remove).toHaveBeenCalledWith(STORAGE_KEYS.deliveryStore);
    expect(useDeliveryStore.getState().store).toBeNull();
  });

  it('never overrides a selection the user already made this session', async () => {
    useDeliveryStore.setState({ store: chatsworth });
    (fetchStores as jest.Mock).mockResolvedValue([umgeni, chatsworth]);
    (storage.get as jest.Mock).mockResolvedValue(umgeni);

    await useDeliveryStore.getState().loadStores();

    expect(useDeliveryStore.getState().store).toEqual(chatsworth);
  });

  it('drops the active selection too when it vanished upstream', async () => {
    const ghost = makeStore(42, 'Ghost Store');
    useDeliveryStore.setState({ store: ghost });
    (fetchStores as jest.Mock).mockResolvedValue([umgeni]);
    (storage.get as jest.Mock).mockResolvedValue(ghost);

    await useDeliveryStore.getState().loadStores();

    expect(storage.remove).toHaveBeenCalledWith(STORAGE_KEYS.deliveryStore);
    expect(useDeliveryStore.getState().store).toBeNull();
  });

  it('propagates backend failures to the caller', async () => {
    (fetchStores as jest.Mock).mockRejectedValue(new Error('network down'));
    await expect(useDeliveryStore.getState().loadStores()).rejects.toThrow('network down');
  });
});

describe('chooseStore', () => {
  it('persists the pick and records how it was chosen', async () => {
    await useDeliveryStore.getState().chooseStore(chatsworth, 'pick');

    expect(storage.set).toHaveBeenCalledWith(STORAGE_KEYS.deliveryStore, chatsworth);
    expect(useDeliveryStore.getState().store).toEqual(chatsworth);
    expect(useDeliveryStore.getState().resolution).toBe('pick');
  });

  it('records location-based resolution separately from manual picks', async () => {
    await useDeliveryStore.getState().chooseStore(umgeni, 'location');
    expect(useDeliveryStore.getState().resolution).toBe('location');
  });
});
