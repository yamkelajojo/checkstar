import type { NavigatorScreenParams } from '@react-navigation/native';
import type { ApiDispatchOutcome } from '../lib/types';

export type RootStackParamList = {
  Onboarding: undefined;
  Tabs: NavigatorScreenParams<CustomerTabParamList> | undefined;
  ProductDetail: { slug: string; source?: 'direct' | 'feed' | 'home' | 'search' | 'recommendation' | 'saved' };
  Search: undefined;
  Auth: { intent?: 'checkout' | 'rider' } | undefined;
  StorePicker: undefined;
  Checkout: undefined;
  OrderPlaced: { orderId: number; dispatch?: ApiDispatchOutcome };
  OrderDetail: { orderId: number; fromNotification?: boolean };
  SaleDetail: { slug: string };
  RiderHome: undefined;
  RiderOrderDetail: { orderId: number; fromNotification?: boolean };
  RiderProfile: undefined;
  RiderHistory: undefined;
  RouteExplorer: {
    storeName: string;
    storeLat?: number;
    storeLng?: number;
    deliveryAddress?: string | null;
    deliveryLat?: number;
    deliveryLng?: number;
    distanceKm?: number;
    durationMinutes?: number;
    source?: string;
    geometry?: string | null;
  };
};

export type CustomerTabParamList = {
  Home: undefined;
  Browse: { category?: string } | undefined;
  Favorites: undefined;
  Cart: undefined;
  Account: undefined;
};