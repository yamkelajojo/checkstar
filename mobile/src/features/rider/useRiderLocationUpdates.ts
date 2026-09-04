import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { useQuery } from '@tanstack/react-query';
import { sendRiderLocation, fetchActiveDeliveries } from '../../lib/apiClient';
import { queryKeys } from '../../lib/queryKeys';

const LOCATION_UPDATE_INTERVAL_MS = 30_000;
const LOCATION_ACCURACY = Location.Accuracy.Balanced;

/**
 * Sends periodic location updates to the server while the rider has active deliveries.
 * Runs in the foreground — the rider must have the app open during delivery.
 * No background task dependency (expo-task-manager not installed).
 */
export function useRiderLocationUpdates() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: activeDeliveries = [] } = useQuery({
    queryKey: queryKeys.activeDeliveries,
    queryFn: fetchActiveDeliveries,
    refetchInterval: 60_000,
  });

  const hasActiveDelivery = activeDeliveries.length > 0;

  useEffect(() => {
    if (!hasActiveDelivery) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const sendLocation = async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') return;

        const location = await Location.getCurrentPositionAsync({ accuracy: LOCATION_ACCURACY });
        await sendRiderLocation(location.coords.latitude, location.coords.longitude);
      } catch (err) {
        console.warn('[RiderLocation] Failed to send location update:', err);
      }
    };

    // Send immediately when active delivery starts
    sendLocation();

    // Then every 30 seconds
    intervalRef.current = setInterval(sendLocation, LOCATION_UPDATE_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [hasActiveDelivery]);
}
