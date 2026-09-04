import { render, screen, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

jest.mock('../../lib/apiClient', () => ({
  fetchOrderRiderLocation: jest.fn().mockResolvedValue(null),
}));

jest.mock('react-native-maps', () => {
  const React = require('react');
  function MockMapView(props: any) {
    return React.createElement('MapView', props, props.children);
  }
  MockMapView.prototype.fitToCoordinates = jest.fn();
  function MockMarker(props: any) {
    return React.createElement('Marker', props, props.children);
  }
  function MockPolyline() {
    return null;
  }
  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker,
    Polyline: MockPolyline,
    PROVIDER_DEFAULT: 'default',
  };
});

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const Easing = {
    linear: (t: any) => t,
    ease: (t: any) => t,
    in: (t: any) => t,
    out: (t: any) => t,
    inOut: (t: any) => t,
    bezier: () => (t: any) => t,
    bounce: () => (t: any) => t,
    circle: () => (t: any) => t,
    cubic: () => (t: any) => t,
    poly: () => (t: any) => t,
    quad: () => (t: any) => t,
    sin: () => (t: any) => t,
    step: () => (t: any) => t,
  };
  return {
    __esModule: true,
    default: {
      View: (props: any) => React.createElement('AnimatedView', props, props.children),
      Text: (props: any) => React.createElement('AnimatedText', props, props.children),
      createAnimatedComponent: (C: any) => C,
    },
    Easing,
    useSharedValue: (v: any) => ({ value: v }),
    useAnimatedStyle: (fn: any) => fn(),
    withSpring: (v: any) => v,
    withRepeat: (v: any) => v,
    withTiming: (v: any) => v,
    cancelAnimation: () => {},
    interpolate: (v: any) => v,
  };
});

jest.mock('lucide-react-native', () => {
  const React = require('react');
  function MockIcon(props: any) {
    return React.createElement('Icon', props);
  }
  return {
    Navigation: MockIcon,
    Clock: MockIcon,
    MapPin: MockIcon,
    WifiOff: MockIcon,
  };
});

jest.mock('../../components/shared/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

const { fetchOrderRiderLocation } = require('../../lib/apiClient');
const { LiveDeliveryMap } = require('../shared/LiveDeliveryMap');

const clients: QueryClient[] = [];

function renderMap(props: any = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  clients.push(client);

  const defaults = {
    orderId: 1,
    storeName: 'Durban Central',
    storeLat: -29.8587,
    storeLng: 31.0218,
    deliveryAddress: '10 Beach Road',
    deliveryLat: -29.8600,
    deliveryLng: 31.0300,
    distanceKm: 2.5,
    durationMinutes: 12,
    riderName: 'John',
    mapHeight: 300,
  };

  return render(
    <QueryClientProvider client={client}>
      <LiveDeliveryMap {...defaults} {...props} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  fetchOrderRiderLocation.mockResolvedValue(null);
});

afterEach(() => {
  for (const client of clients) {
    client.clear();
  }
  clients.length = 0;
});

describe('LiveDeliveryMap', () => {
  it('renders the header with Live Tracking text', async () => {
    await act(async () => {
      renderMap();
    });
    expect(screen.getByText('Live Tracking')).toBeTruthy();
  });

  it('shows store name in the info row', async () => {
    await act(async () => {
      renderMap({ storeName: 'Umhlanga Store' });
    });
    expect(screen.getByText('Umhlanga Store')).toBeTruthy();
  });

  it('shows rider name when provided', async () => {
    await act(async () => {
      renderMap({ riderName: 'Thabo' });
    });
    expect(screen.getByText('Thabo')).toBeTruthy();
  });

  it('shows delivery address in info row', async () => {
    await act(async () => {
      renderMap({ deliveryAddress: '123 Florida Road' });
    });
    expect(screen.getByText('123 Florida Road')).toBeTruthy();
  });

  it('shows distance and duration chips when provided', async () => {
    await act(async () => {
      renderMap({ distanceKm: 3.2, durationMinutes: 15 });
    });
    expect(screen.getByText('3.2 km')).toBeTruthy();
    expect(screen.getByText('15 min')).toBeTruthy();
  });

  it('does not show distance/duration chips when undefined', async () => {
    await act(async () => {
      renderMap({ distanceKm: undefined, durationMinutes: undefined });
    });
    expect(screen.queryByText('km')).toBeNull();
    expect(screen.queryByText('min')).toBeNull();
  });

  it('shows fallback when coordinates are missing', async () => {
    await act(async () => {
      renderMap({ storeLat: undefined, storeLng: undefined });
    });
    expect(screen.getByText('Map unavailable — coordinates not set')).toBeTruthy();
  });

  it('calls fetchOrderRiderLocation with the correct orderId', async () => {
    await act(async () => {
      renderMap({ orderId: 99 });
    });
    expect(fetchOrderRiderLocation).toHaveBeenCalledWith(99);
  });

  it('renders the To fallback when deliveryAddress is empty', async () => {
    await act(async () => {
      renderMap({ deliveryAddress: null });
    });
    expect(screen.getByText('Delivery')).toBeTruthy();
  });

  it('shows LIVE badge when rider location is available', async () => {
    fetchOrderRiderLocation.mockResolvedValue({
      latitude: -29.855,
      longitude: 31.025,
      recorded_at: new Date().toISOString(),
    });
    await act(async () => {
      renderMap();
    });
    await waitFor(() => {
      expect(screen.getByText('LIVE')).toBeTruthy();
    });
  });
});
