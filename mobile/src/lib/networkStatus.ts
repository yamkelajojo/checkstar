import { useEffect, useState, useCallback } from 'react';

// Dynamic import with fallback for test environments
let Network: { getNetworkStateAsync: () => Promise<any>; addNetworkStateListener: (cb: (state: any) => void) => { remove: () => void } } | null = null;
try {
  Network = require('expo-network');
} catch {
  // Module not available in test environment
}

export type NetworkState = {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  networkType: string | null;
  lastOnline: Date | null;
};

let networkState: NetworkState = {
  isConnected: true,
  isInternetReachable: null,
  networkType: null,
  lastOnline: new Date(),
};

const listeners = new Set<(state: NetworkState) => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener(networkState));
}

async function updateNetworkState() {
  try {
    if (Network?.getNetworkStateAsync) {
      const state = await Network.getNetworkStateAsync();
      const wasConnected = networkState.isConnected;
      networkState = {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? null,
        networkType: state.type ?? null,
        lastOnline: networkState.isConnected ? new Date() : networkState.lastOnline,
      };
      if (!wasConnected && networkState.isConnected) {
        networkState.lastOnline = new Date();
      }
      notifyListeners();
    } else {
      // In test environment, assume online
      networkState = {
        isConnected: true,
        isInternetReachable: true,
        networkType: 'wifi',
        lastOnline: new Date(),
      };
      notifyListeners();
    }
  } catch {
    // Ignore errors
  }
}

export function useNetworkStatus(): NetworkState & {
  checkConnection: () => Promise<boolean>;
} {
  const [state, setState] = useState<NetworkState>(networkState);

  useEffect(() => {
    updateNetworkState();
    const listener = (newState: NetworkState) => setState(newState);
    listeners.add(listener);

    let subscription: { remove: () => void } | null = null;
    if (Network?.addNetworkStateListener) {
      subscription = Network.addNetworkStateListener((newState) => {
        const wasConnected = networkState.isConnected;
        networkState = {
          isConnected: newState.isConnected ?? false,
          isInternetReachable: newState.isInternetReachable ?? null,
          networkType: newState.type ?? null,
          lastOnline: wasConnected && !newState.isConnected ? networkState.lastOnline : 
                       !wasConnected && newState.isConnected ? new Date() : networkState.lastOnline,
        };
        notifyListeners();
      });
    }

    return () => {
      listeners.delete(listener);
      subscription?.remove();
    };
  }, []);

  const checkConnection = useCallback(async () => {
    await updateNetworkState();
    return networkState.isConnected && networkState.isInternetReachable !== false;
  }, []);

  return {
    ...state,
    checkConnection,
  };
}

export function isOnline(): boolean {
  return networkState.isConnected && networkState.isInternetReachable !== false;
}

export function getLastOnline(): Date | null {
  return networkState.lastOnline;
}