import type { StackNavigationProp } from '@react-navigation/stack';
import { DrawerNavigationProp } from '@react-navigation/drawer'; // Add this import


export type LogisticsDrawerParamList = {
  LogisticsHome: undefined;
  Shipments: undefined;
  Drivers: undefined;
  Vehicles: undefined;
  Settings: undefined;
  UserProfile: undefined;
  Notifications: undefined;
  NewShipment: undefined;
  TrackPackage: undefined;
  ShipmentDetails: { id: string };
  // Add other screens here
};

export type RootStackParamList = {
  Welcome: undefined;
  Home: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ServiceSelection: undefined;
  TransportHome: undefined;
  LogisticsHome: undefined;
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
  navigation: DrawerNavigationProp<LogisticsDrawerParamList, 'LogisticsHome'>;
};