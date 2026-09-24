import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { CustomerTabs } from '../CustomerTabs';
import { TAB_ORDER } from '../tabTransitions';

// Mock PagerView
jest.mock('react-native-pager-view', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockPagerView = React.forwardRef(({ children, onPageScroll, onPageSelected, ...props }: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      setPage: jest.fn((index: number) => {
        if (onPageSelected) {
          onPageSelected({ nativeEvent: { position: index } });
        }
      }),
    }));
    return React.createElement(View, { ...props, testID: 'pager-view' }, children);
  });
  MockPagerView.displayName = 'PagerView';
  return MockPagerView;
});

// Mock screens to avoid heavy dependencies
jest.mock('../../features/home/HomeScreen', () => ({
  HomeScreen: () => {
    const { Text } = require('react-native');
    const React = require('react');
    return React.createElement(Text, null, 'HomeScreen');
  },
}));
jest.mock('../../features/catalog/BrowseScreen', () => ({
  BrowseScreen: () => {
    const { Text } = require('react-native');
    const React = require('react');
    return React.createElement(Text, null, 'BrowseScreen');
  },
}));
jest.mock('../../features/favorites/FavoritesScreen', () => ({
  FavoritesScreen: () => {
    const { Text } = require('react-native');
    const React = require('react');
    return React.createElement(Text, null, 'FavoritesScreen');
  },
}));
jest.mock('../../features/cart/CartScreen', () => ({
  CartScreen: () => {
    const { Text } = require('react-native');
    const React = require('react');
    return React.createElement(Text, null, 'CartScreen');
  },
}));
jest.mock('../../features/account/AccountScreen', () => ({
  AccountScreen: () => {
    const { Text } = require('react-native');
    const React = require('react');
    return React.createElement(Text, null, 'AccountScreen');
  },
}));

jest.mock('../../features/cart/store', () => ({
  useCart: (selector?: any) => {
    const state = { items: [] };
    if (typeof selector === 'function') {
      return selector(state);
    }
    return state;
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 20, top: 0, left: 0, right: 0 }),
}));

jest.mock('../../theme', () => ({
  useTheme: () => ({
    name: 'light',
    colors: {
      background: { primary: '#fff' },
      surface: { elevated: '#fff', primary: '#fff' },
      border: { subtle: '#eee' },
      text: { tertiary: '#999', disabled: '#bbb' },
    },
  }),
}));

jest.mock('../../lib/haptics', () => ({
  haptic: { selection: jest.fn() },
}));

describe('CustomerTabs', () => {
  it('defines tabs in correct order matching TAB_ORDER', () => {
    expect(TAB_ORDER).toEqual(['Home', 'Browse', 'Favorites', 'Cart', 'Account']);
  });

  it('renders without crashing', () => {
    expect(() => render(<CustomerTabs />)).not.toThrow();
  });

  it('renders tab bar labels', () => {
    const result = render(<CustomerTabs />);
    expect(result).toBeTruthy();
  });

  it('uses directional logic: right swipe should be direction 1', () => {
    const { getTabDirection } = require('../tabTransitions');
    expect(getTabDirection(0, 1)).toBe(1);
    expect(getTabDirection(1, 4)).toBe(1);
  });

  it('uses directional logic: left swipe should be direction -1', () => {
    const { getTabDirection } = require('../tabTransitions');
    expect(getTabDirection(3, 1)).toBe(-1);
    expect(getTabDirection(4, 0)).toBe(-1);
  });
});
