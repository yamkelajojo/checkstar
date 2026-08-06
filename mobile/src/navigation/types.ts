import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Tabs: NavigatorScreenParams<CustomerTabParamList> | undefined;
  ProductDetail: { slug: string };
  Search: undefined;
  Auth: { intent?: 'checkout' } | undefined;
  StorePicker: undefined;
  Checkout: undefined;
  OrderPlaced: { orderId: number };
  OrderDetail: { orderId: number; fromNotification?: boolean };
  RiderHome: undefined;
  RiderOrderDetail: { orderId: number; fromNotification?: boolean };
};

export type CustomerTabParamList = {
  Home: undefined;
  Browse: undefined;
  Cart: undefined;
  Account: undefined;
};