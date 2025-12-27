import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';

// Screens
import WelcomeScreen from './screens/WelcomeScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import ResetPasswordScreen from './screens/auth/ResetPasswordScreen';
import LoginScreen from './screens/auth/LoginScreen';
import ForgotPasswordScreen from './screens/auth/ForgetPasswordScreen';
import DashboardScreen from './screens/DashboardScreen';
import EmailVerificationScreen from './screens/auth/EmailVerificationScreen';
import CustomDrawerContent from './components/molecules/CustomDrawerContent';
import BookTransportScreen from './screens/BookTransportScreen';
import TripDatesScreen from './screens/TripDatesScreen';
import TripBusesScreen from './screens/TripBusesScreen';
import PassengerDetailsAndSeatSelectionScreen from './screens/PassengerDetailsAndSeatSelectionScreen';
import PaymentScreen from './screens/PaymentScreen';
import BookingConfirmationScreen from './screens/BookingConfirmationScreen';

import { AuthProvider, useAuth } from './hooks/useAuth';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

/**
 * 1. SIDEBAR NAVIGATOR
 * This ONLY wraps the Dashboard. 
 * Because BookTransport is NOT in here, it won't have a sidebar.
 */
function DashboardDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={props => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerPosition: 'left',
      }}
    >
      <Drawer.Screen name="DashboardHome" component={DashboardScreen} />

    </Drawer.Navigator>
  );
}

/**
 * 2. ROOT NAVIGATOR
 */
function RootNavigator() {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A2540' }}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {/* 🚀 Remove initialRouteName here */}
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        
        {!isLoggedIn ? (
          /* --- SECTION A: GUEST/AUTH --- */
          <Stack.Group>
            {/* The first screen here (Welcome) becomes the default for Guests */}
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
            <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
          </Stack.Group>
        ) : (
          /* --- SECTION B: LOGGED IN --- */
          <Stack.Group>
            {/* The first screen here (Dashboard) becomes the default for Logged-In users */}
            <Stack.Screen name="Dashboard" component={DashboardDrawer} />
            
          </Stack.Group>
        )}

        {/* --- SECTION C: GLOBAL SCREENS --- */}
        <Stack.Screen name="BookTransport" component={BookTransportScreen} />
        <Stack.Screen name="TripDates" component={TripDatesScreen} />
        <Stack.Screen name="TripBuses" component={TripBusesScreen} />
        <Stack.Screen 
          name="PassengerDetailsAndSeatSelection" 
          component={PassengerDetailsAndSeatSelectionScreen} 
        />
        <Stack.Screen name="Payment" component={PaymentScreen} />
        <Stack.Screen name="BookingConfirmation" component={BookingConfirmationScreen} />
        

      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <RootNavigator />
      </SafeAreaProvider>
    </AuthProvider>
  );
}