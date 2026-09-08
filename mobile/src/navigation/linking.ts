import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['checkstar://', 'https://checkstar.co.za'],
  config: {
    screens: {
      Tabs: {
        screens: {
          Home: 'home',
          Browse: 'browse',
          Cart: 'cart',
          Favorites: 'favorites',
          Account: 'account',
        },
      },
      ProductDetail: 'product/:slug',
      OrderDetail: 'order/:orderId',
      Auth: 'auth',
      StorePicker: 'store-picker',
      Checkout: 'checkout',
    },
  },
};
