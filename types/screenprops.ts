// types/screenprops.ts
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BusTrip } from './bustrip'; // Import BusTrip
import { CreateBookingPayload } from './booking'; // Import the booking payload


type RegisterScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'Register' // Screen name in your navigator
>;

export interface RegisterScreenProps {
  navigation: RegisterScreenNavigationProp;
}


// Define your authentication stack parameters
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  EmailVerification: { email: string };
  ForgotPassword: undefined;
  ResetPassword: { email: string };
  Dashboard: undefined;
  BookTransport: undefined;

  // --- NEW/UPDATED BOOKING FLOW SCREENS ---
  TripDates: {
    departureLocationName: string;
    departureLocationState: string;
    arrivalLocationName: string;
    arrivalLocationState: string;
  };
    TripBuses: {
    departureLocationName: string;
    departureLocationState: string;
    arrivalLocationName: string;
    arrivalLocationState: string;
    departureDate: string;
  };
    SeatSelection: {
    busTripId: string;
    
  };
  TripDetails: {
    departureLocationName: string;
    departureLocationState: string;
    arrivalLocationName: string;
    arrivalLocationState: string;
    departureDate: string; // Add this for filtering specific buses
    selectedTripId?: number;
  };
  // ----------------------------------------
// --- NEW SCREENS FOR BOOKING FLOW ---
  PassengerDetailsAndSeatSelection: {
     busTripId: string;
  };
  Payment: {
    bookingPayload: CreateBookingPayload; // The full payload to send to the backend
  };
  BookingConfirmation: {
    bookingReference: string;
    bookingId: number;
  };
  // ------------------------------------


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
//export type RegisterScreenProps = NativeStackScreenProps<AuthStackParamList, 'Register'>;

// Login screen props type
export type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;

// Dashboard screen props type
export type DashboardScreenProps = NativeStackScreenProps<AuthStackParamList, 'Dashboard'>;

// EmailVerificationScreen screen props type
export type EmailVerificationScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'EmailVerification'
>;

export type EmailVerificationScreenRouteProp = RouteProp<AuthStackParamList, 'EmailVerification'>;

// TripDetailsScreen screen props type (UPDATED)
export type TripDetailsScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'TripDetails'
>;

// BookTransport screen props type
export type BookTransportScreenProps = NativeStackScreenProps<AuthStackParamList, 'BookTransport'>;

// NEW: TripDatesScreen props type
export type TripDatesScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'TripDates'
>;

export type TripBusesScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'TripBuses'
>;

// ForgotPasswordScreen screen props type
export type ForgotPasswordScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'ForgotPassword'
>;

// Booking details props type (kept commented out as in your original)
// export type BookingDetailsScreenProps = NativeStackScreenProps<
//   AuthStackParamList,
//   'BookingDetails'
// >;

// export type BookingDetailsScreenRouteProp = RouteProp<AuthStackParamList, 'BookingDetails'>;

// ResetPasswordScreen screen props type
export type ResetPasswordScreenProps = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export type EmailResetScreenRouteProp = RouteProp<AuthStackParamList, 'ResetPassword'>;

export type PassengerDetailsAndSeatSelectionScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'PassengerDetailsAndSeatSelection'
>;
export type PaymentScreenProps = NativeStackScreenProps<AuthStackParamList, 'Payment'>;

export type BookingConfirmationScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'BookingConfirmation'
>;
