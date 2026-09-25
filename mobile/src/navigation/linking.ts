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
      ProductDetail: 'products/:slug',
      OrderDetail: 'orders/:orderId',
      SaleDetail: 'specials/:slug',
      Auth: 'auth',
      StorePicker: 'store-picker',
      Checkout: 'checkout',
      Search: 'search',
    },
  },
};
