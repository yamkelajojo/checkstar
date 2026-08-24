import * as Location from 'expo-location';
import { DURBAN_COORDS, getDeliveryCoords } from '../deliveryCoords';

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  hasServicesEnabledAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
}));

const requestPermission = Location.requestForegroundPermissionsAsync as jest.Mock;
const servicesEnabled = Location.hasServicesEnabledAsync as jest.Mock;
const getCurrentPosition = Location.getCurrentPositionAsync as jest.Mock;

const granted = { status: 'granted', granted: true };
const denied = { status: 'denied', granted: false };
const fix = { coords: { latitude: -29.7, longitude: 30.9 } };

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getDeliveryCoords', () => {
  it('returns the device fix when permission is granted and location works', async () => {
    requestPermission.mockResolvedValue(granted);
    servicesEnabled.mockResolvedValue(true);
    getCurrentPosition.mockResolvedValue(fix);

    await expect(getDeliveryCoords()).resolves.toEqual({
      latitude: -29.7,
      longitude: 30.9,
      usedFallback: false,
    });
    expect(getCurrentPosition).toHaveBeenCalledWith({ accuracy: Location.Accuracy.Balanced });
  });

  it('falls back to Durban when foreground permission is denied', async () => {
    requestPermission.mockResolvedValue(denied);

    await expect(getDeliveryCoords()).resolves.toEqual({ ...DURBAN_COORDS, usedFallback: true });
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it('falls back to Durban when location services are off', async () => {
    requestPermission.mockResolvedValue(granted);
    servicesEnabled.mockResolvedValue(false);

    await expect(getDeliveryCoords()).resolves.toEqual({ ...DURBAN_COORDS, usedFallback: true });
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it('falls back to Durban when the position call rejects', async () => {
    requestPermission.mockResolvedValue(granted);
    servicesEnabled.mockResolvedValue(true);
    getCurrentPosition.mockRejectedValue(new Error('no fix'));

    await expect(getDeliveryCoords()).resolves.toEqual({ ...DURBAN_COORDS, usedFallback: true });
  });

  it('falls back to Durban when the fix exceeds the timeout', async () => {
    jest.useFakeTimers();
    try {
      requestPermission.mockResolvedValue(granted);
      servicesEnabled.mockResolvedValue(true);
      getCurrentPosition.mockReturnValue(new Promise(() => {}));

      const pending = getDeliveryCoords();
      await jest.advanceTimersByTimeAsync(5001);
      await expect(pending).resolves.toEqual({ ...DURBAN_COORDS, usedFallback: true });
    } finally {
      jest.useRealTimers();
    }
  });
});
