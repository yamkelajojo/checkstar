import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { RootNavigator } from '../RootNavigator';
import { useSession } from '../../stores/session';
import { useNavigationSignal } from '../../stores/navigationSignal';
import { storage } from '../../lib/storage';
import type { ApiUser } from '../../lib/types';

jest.mock('@react-navigation/native-stack', () => {
  const React = require('react');
  const registered: string[] = [];
  const collect = (node: unknown): void => {
    React.Children.toArray(node).forEach((child: unknown) => {
      const el = child as { props?: { name?: unknown; children?: unknown } } | null;
      if (!el || !el.props) return;
      if (typeof el.props.name === 'string') registered.push(el.props.name);
      if (el.props.children != null) collect(el.props.children);
    });
  };
  const Stack = {
    Navigator: ({ children }: { children?: React.ReactNode }) => {
      registered.length = 0;
      collect(children);
      return null;
    },
    Screen: () => null,
  };
  return {
    __registered: registered,
    createNativeStackNavigator: () => Stack,
  };
});

jest.mock('../../lib/storage', () => {
  const actual = jest.requireActual<typeof import('../../lib/storage')>('../../lib/storage');
  return {
    ...actual,
    storage: { get: jest.fn(), set: jest.fn(), remove: jest.fn() },
  };
});

jest.mock('../../features/onboarding/SplashScreen', () => ({
  SplashScreen: () => {
    const { Text } = require('react-native');
    const React = require('react');
    return React.createElement(Text, null, 'SPLASH');
  },
}));

jest.mock('../../features/onboarding/OnboardingScreen', () => ({
  OnboardingScreen: () => null,
}));
jest.mock('../../features/store/StorePickerScreen', () => ({
  StorePickerScreen: () => null,
}));
jest.mock('../../features/auth/AuthScreen', () => ({ AuthScreen: () => null }));
jest.mock('../../features/checkout/CheckoutScreen', () => ({ CheckoutScreen: () => null }));
jest.mock('../../features/orders/OrderPlacedScreen', () => ({
  OrderPlacedScreen: () => null,
}));
jest.mock('../../features/orders/OrderDetailScreen', () => ({
  OrderDetailScreen: () => null,
}));
jest.mock('../../features/product/ProductDetailScreen', () => ({
  ProductDetailScreen: () => null,
}));
jest.mock('../../features/search/SearchScreen', () => ({ SearchScreen: () => null }));
jest.mock('../../features/rider/RiderHomeScreen', () => ({ RiderHomeScreen: () => null }));
jest.mock('../../features/rider/RiderOrderDetailScreen', () => ({
  RiderOrderDetailScreen: () => null,
}));
jest.mock('../CustomerTabs', () => ({ CustomerTabs: () => null }));

const stackModule = () =>
  require('@react-navigation/native-stack') as { __registered: string[] };

const customer: ApiUser = {
  id: 1,
  name: 'Anna',
  email: 'anna@example.com',
  phone: null,
  role: 'customer',
  rider: null,
};

const rider: ApiUser = {
  id: 2,
  name: 'Sipho',
  email: 'sipho@example.com',
  phone: null,
  role: 'rider',
  rider: { id: 5, vehicle_type: 'motorbike', is_available: true },
};

const CUSTOMER_STACK = [
  'Tabs',
  'ProductDetail',
  'Search',
  'Auth',
  'StorePicker',
  'Checkout',
  'OrderPlaced',
  'OrderDetail',
  'RouteExplorer',
];

beforeEach(() => {
  jest.clearAllMocks();
  useNavigationSignal.setState({ v: 0 });
});

test('renders only the splash while the session is booting', async () => {
  useSession.setState({ status: 'boot', token: null, user: null });
  await render(<RootNavigator />);
  expect(screen.getByText('SPLASH')).toBeTruthy();
  expect(stackModule().__registered).toEqual([]);
});

test('first-time guests get the onboarding flow with Auth available as a modal', async () => {
  (storage.get as jest.Mock).mockResolvedValue(null);
  useSession.setState({ status: 'guest', token: null, user: null });

  await render(<RootNavigator />);
  await waitFor(() => expect(stackModule().__registered).toEqual(['Onboarding', 'Auth']));
  expect(screen.queryByText('SPLASH')).toBeNull();
});

test('returning guests skip onboarding straight to the customer stack', async () => {
  (storage.get as jest.Mock).mockResolvedValue(true);
  useSession.setState({ status: 'guest', token: null, user: null });

  await render(<RootNavigator />);
  await waitFor(() => expect(stackModule().__registered).toEqual(CUSTOMER_STACK));
});

test('authenticated customers land on the full customer stack', async () => {
  useSession.setState({ status: 'authenticated', token: 't', user: customer });
  await render(<RootNavigator />);
  await waitFor(() => expect(stackModule().__registered).toEqual(CUSTOMER_STACK));
});

test('riders are routed to the dedicated rider stack with no checkout screens', async () => {
  useSession.setState({ status: 'authenticated', token: 't', user: rider });
  await render(<RootNavigator />);
  await waitFor(() =>
    expect(stackModule().__registered).toEqual(['RiderHome', 'RiderOrderDetail', 'RiderProfile', 'RouteExplorer']),
  );
  expect(stackModule().__registered).not.toContain('Checkout');
});
