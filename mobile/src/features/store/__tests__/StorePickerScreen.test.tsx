import { render, screen, fireEvent } from '@testing-library/react-native';
import { StorePickerScreen } from '../StorePickerScreen';
import { useDeliveryStore } from '../../../stores/deliveryStore';
import { storage, STORAGE_KEYS } from '../../../lib/storage';
import { TestWrapper } from '../../../test/utils';
import type { ApiStore } from '../../../lib/types';

jest.mock('../../../lib/storage', () => {
  const actual = jest.requireActual<typeof import('../../../lib/storage')>('../../../lib/storage');
  return {
    ...actual,
    storage: { get: jest.fn(), set: jest.fn(), remove: jest.fn() },
  };
});

const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
}));

const makeStore = (id: number, name: string): ApiStore => ({
  id,
  name,
  slug: `store-${id}`,
  address: `${name} Road`,
  delivery_radius_km: id === 1 ? 8 : 12,
});

const umgeni = makeStore(1, 'Checkstar Umgeni');
const chatsworth = makeStore(2, 'Checkstar Chatsworth');

beforeEach(() => {
  jest.clearAllMocks();
  useDeliveryStore.setState({ store: null, resolution: 'none', stores: [] });
});

const renderPicker = async () => render(<StorePickerScreen />, { wrapper: TestWrapper });

describe('store listing', () => {
  it('shows every store with its delivery radius', async () => {
    useDeliveryStore.setState({ stores: [umgeni, chatsworth] });
    await renderPicker();

    expect(screen.getByText('Checkstar Umgeni')).toBeTruthy();
    expect(screen.getByText('Checkstar Chatsworth')).toBeTruthy();
    expect(screen.getByText(/8 km radius/)).toBeTruthy();
    expect(screen.getByText(/12 km radius/)).toBeTruthy();
  });

  it('marks the currently selected store as selected', async () => {
    useDeliveryStore.setState({ stores: [umgeni, chatsworth], store: chatsworth });
    await renderPicker();

    expect(screen.getByRole('button', { name: /Checkstar Chatsworth/ }).props.accessibilityState)
      .toMatchObject({ selected: true });
    expect(screen.getByRole('button', { name: /Checkstar Umgeni/ }).props.accessibilityState)
      .toMatchObject({ selected: false });
  });

  it('shows an empty state before any stores are onboarded', async () => {
    await renderPicker();
    expect(screen.getByText('No stores yet')).toBeTruthy();
  });

  it('falls back to a placeholder caption when a store has no address yet', async () => {
    useDeliveryStore.setState({
      stores: [{ ...umgeni, address: undefined }],
    });
    await renderPicker();
    expect(screen.getByText(/Address coming soon/)).toBeTruthy();
  });
});

describe('choosing a store', () => {
  beforeEach(() => {
    useDeliveryStore.setState({ stores: [umgeni, chatsworth] });
  });

  it('persists the pick, updates the store state and closes the picker', async () => {
    await renderPicker();

    await fireEvent.press(screen.getByRole('button', { name: /Checkstar Chatsworth/ }));
    await Promise.resolve();
    await Promise.resolve();

    const state = useDeliveryStore.getState();
    expect(state.store).toEqual(chatsworth);
    expect(state.resolution).toBe('pick');
    expect(storage.set).toHaveBeenCalledWith(STORAGE_KEYS.deliveryStore, chatsworth);
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('lets the customer switch to a different store later', async () => {
    useDeliveryStore.setState({ store: umgeni, resolution: 'pick' });
    await renderPicker();

    await fireEvent.press(screen.getByRole('button', { name: /Checkstar Umgeni/ }));
    await fireEvent.press(screen.getByRole('button', { name: /Checkstar Chatsworth/ }));
    await Promise.resolve();
    await Promise.resolve();

    expect(useDeliveryStore.getState().store).toEqual(chatsworth);
    expect(mockGoBack).toHaveBeenCalledTimes(2);
  });
});
