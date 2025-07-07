import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Define your authentication stack parameters
export type AuthStackParamList = {
  Welcome: undefined;
  ServiceSelection: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  LogisticsHome: undefined;
  TransportHome: undefined;
  Notifications: undefined;
  Settings: undefined;
  UserProfile: undefined;
  NewShipment: undefined;
  TrackPackage: undefined;
  ShipmentDetails: undefined;
  EmailVerification: undefined;
  // Add other auth screens here
};

// Welcome screen props type
export type WelcomeScreenProps = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

// ServiceSelection screen props type
export type ServiceSelectionScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'ServiceSelection'
>;

// Register screen props type
export type RegisterScreenProps = NativeStackScreenProps<AuthStackParamList, 'Register'>;

// Login screen props type
export type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;

// LogisticsHome screen props type
export type LogisticsHomeScreenProps = NativeStackScreenProps<AuthStackParamList, 'LogisticsHome'>;

// TransportHome screen props type
export type TransportHomeScreenProps = NativeStackScreenProps<AuthStackParamList, 'TransportHome'>;

// EmailVerificationScreen screen props type
export type EmailVerificationScreenProps = NativeStackScreenProps<AuthStackParamList, 'EmailVerification'>;
