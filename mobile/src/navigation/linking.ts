import { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['checkstar://', 'https://checkstar.co.za'],
  config: {
    screens: {
      SaleDetail: 'specials/:slug',
      ProductDetail: 'products/:slug',
      OrderDetail: 'orders/:orderId',
      Auth: 'auth',
      Checkout: 'checkout',
      StorePicker: 'store-picker',
      Search: 'search',
      Tabs: {
        screens: {
          Home: 'home',
          Browse: 'browse',
          Cart: 'cart',
          Orders: 'orders',
          Account: 'account',
        },
      },
    },
  },
};