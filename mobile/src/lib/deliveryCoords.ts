import * as Location from 'expo-location';
export { DURBAN_COORDS } from './constants';
import { DURBAN_COORDS } from './constants';

export interface DeliveryCoordsResult {
  latitude: number;
  longitude: number;
  usedFallback: boolean;
}

const FIX_TIMEOUT_MS = 5000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Location fix timed out')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

const durbanFallback = (): DeliveryCoordsResult => ({ ...DURBAN_COORDS, usedFallback: true });

/**
 * Resolves the device's current coordinates for a delivery order. Requests
 * foreground permission and a balanced-accuracy fix with a short timeout,
 * falling back to Durban CBD whenever permission is denied, location services
 * are off, or the fix fails — placing an order must never block on GPS.
 */
export async function getDeliveryCoords(): Promise<DeliveryCoordsResult> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) return durbanFallback();
    if (!(await Location.hasServicesEnabledAsync())) return durbanFallback();
    const position = await withTimeout(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      FIX_TIMEOUT_MS,
    );
    return { latitude: position.coords.latitude, longitude: position.coords.longitude, usedFallback: false };
  } catch {
    return durbanFallback();
  }
}
