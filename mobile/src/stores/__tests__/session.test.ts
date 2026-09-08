import { useSession } from '../session';
import { setAuthToken, tokenStorage } from '../../lib/apiClient';
import { storage, STORAGE_KEYS } from '../../lib/storage';
import type { ApiUser } from '../../lib/types';

jest.mock('../../lib/apiClient', () => ({
  tokenStorage: { get: jest.fn(), set: jest.fn(), clear: jest.fn() },
  setAuthToken: jest.fn(),
}));

jest.mock('../../lib/cartSync', () => {
  const ref = { current: true };
  const spy = jest.fn(() => ref);
  return { __ref: ref, getGlobalSyncRef: spy };
});

jest.mock('../../lib/storage', () => {
  const actual = jest.requireActual<typeof import('../../lib/storage')>('../../lib/storage');
  return {
    ...actual,
    storage: { get: jest.fn(), set: jest.fn(), remove: jest.fn() },
  };
});

const syncModule = () =>
  require('../../lib/cartSync') as {
    __ref: { current: boolean };
    getGlobalSyncRef: jest.Mock;
  };

const drainMicrotasks = async (): Promise<void> => {
  for (let i = 0; i < 12; i += 1) {
    await Promise.resolve();
  }
};

const user: ApiUser = {
  id: 1,
  name: 'Anna',
  email: 'anna@example.com',
  phone: null,
  role: 'customer',
  rider: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  syncModule().__ref.current = true;
  useSession.setState({ status: 'boot', token: null, user: null });
});

describe('boot', () => {
  it('restores an authenticated session from the persisted token', async () => {
    (tokenStorage.get as jest.Mock).mockResolvedValue('tok1');
    (storage.get as jest.Mock).mockResolvedValue(user);

    await useSession.getState().boot();

    expect(setAuthToken).toHaveBeenCalledWith('tok1');
    expect(useSession.getState().status).toBe('authenticated');
    expect(useSession.getState().token).toBe('tok1');
    expect(useSession.getState().user).toEqual(user);
  });

  it('falls back to guest when token exists but no cached user and refresh fails', async () => {
    (tokenStorage.get as jest.Mock).mockResolvedValue('tok2');
    (storage.get as jest.Mock).mockResolvedValue(null);

    await useSession.getState().boot();

    expect(useSession.getState().status).toBe('guest');
    expect(useSession.getState().user).toBeNull();
  });

  it('falls back to guest without touching the auth header when no token exists', async () => {
    (tokenStorage.get as jest.Mock).mockResolvedValue(null);

    await useSession.getState().boot();

    expect(setAuthToken).not.toHaveBeenCalled();
    expect(useSession.getState().status).toBe('guest');
    expect(useSession.getState().token).toBeNull();
    expect(useSession.getState().user).toBeNull();
  });
});

describe('signIn', () => {
  it('persists the token and user, and activates the bearer header', async () => {
    await useSession.getState().signIn('tok3', user);

    expect(setAuthToken).toHaveBeenCalledWith('tok3');
    expect(tokenStorage.set).toHaveBeenCalledWith('tok3');
    expect(storage.set).toHaveBeenCalledWith(STORAGE_KEYS.session, user);
    const state = useSession.getState();
    expect(state.status).toBe('authenticated');
    expect(state.token).toBe('tok3');
    expect(state.user).toEqual(user);
  });
});

describe('signOut', () => {
  it('clears credentials and resets the global cart sync flag', async () => {
    const mod = syncModule();
    useSession.setState({ status: 'authenticated', token: 'tok4', user });
    expect(mod.__ref.current).toBe(true);

    await useSession.getState().signOut();

    expect(setAuthToken).toHaveBeenCalledWith(null);
    expect(tokenStorage.clear).toHaveBeenCalled();
    expect(storage.remove).toHaveBeenCalledWith(STORAGE_KEYS.session);

    await drainMicrotasks();
    expect(mod.getGlobalSyncRef).toHaveBeenCalled();
    expect(mod.__ref.current).toBe(false);
    const state = useSession.getState();
    expect(state.status).toBe('guest');
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
  });

  it('still reaches guest state when the cart-sync module misbehaves', async () => {
    const mod = syncModule();
    mod.getGlobalSyncRef.mockImplementationOnce(() => {
      throw new Error('boom');
    });
    useSession.setState({ status: 'authenticated', token: 'tok5', user });

    await useSession.getState().signOut();

    const state = useSession.getState();
    expect(state.status).toBe('guest');
    expect(state.token).toBeNull();
    expect(tokenStorage.clear).toHaveBeenCalled();
  });
});
