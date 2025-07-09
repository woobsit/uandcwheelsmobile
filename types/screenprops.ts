import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

// Define your authentication stack parameters
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  EmailVerification: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
  Dashboard: undefined;
  Notifications: undefined;
  Settings: undefined;
  UserProfile: undefined;
  NewShipment: undefined;
  TrackPackage: undefined;
  ShipmentDetails: undefined;
  
  // Add other auth screens here
};

// Welcome screen props type
export type WelcomeScreenProps = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

// Register screen props type
export type RegisterScreenProps = NativeStackScreenProps<AuthStackParamList, 'Register'>;

// Login screen props type
export type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;

// Dashboard screen props type
export type DashboardScreenProps = NativeStackScreenProps<AuthStackParamList, 'Dashboard'>;

// EmailVerificationScreen screen props type
export type EmailVerificationScreenProps = NativeStackScreenProps<AuthStackParamList, 'EmailVerification'>;

export type EmailVerificationScreenRouteProp = RouteProp<AuthStackParamList, 'EmailVerification'>;

// ForgotPasswordScreen screen props type
export type ForgotPasswordScreenProps = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

// ResetPasswordScreen screen props type
export type ResetPasswordScreenProps = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export type EmailResetScreenRouteProp = RouteProp<AuthStackParamList, 'ResetPassword'>;