import type { StackNavigationProp } from '@react-navigation/stack';

export type RootStackParamList = {
  Welcome: undefined;
  Home: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ServiceSelection: undefined;
  LogisticsHome: undefined;
  TransportHome: undefined;
   NewShipment: undefined;
  TrackPackage: undefined;
  ShipmentDetails: { id: string };
  UserProfile: undefined;
   Notifications: undefined;
    Settings: undefined;
};

export type WelcomeScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Welcome'>;
};

export type LoginScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Login'>;
};

export type RegisterScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Register'>;
};

export type ForgotPasswordScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'ForgotPassword'>;
};

export type ServiceSelectionScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'ServiceSelection'>;
};

export type LogisticsHomeScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'LogisticsHome'>;
};
