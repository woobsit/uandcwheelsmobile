import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack'; // Use native stack
import { createDrawerNavigator } from '@react-navigation/drawer';
import WelcomeScreen from './screens/WelcomeScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import ResetPasswordScreen from './screens/auth/ResetPasswordScreen';
import LoginScreen from './screens/auth/LoginScreen';
import ForgotPasswordScreen from './screens/auth/ForgetPasswordScreen';
import DashboardScreen from './screens/DashboardScreen';
import EmailVerificationScreen from './screens/auth/EmailVerificationScreen'; // You'll create this
import CustomDrawerContent from './components/molecules/CustomDrawerContent'; // You'll create this
import BookTransportScreen from './screens/BookTransportScreen';
import TripDatesScreen from './screens/TripDatesScreen'; // NEW
import TripDetailsScreen from './screens/TripDetailsScreen'; // Existing, but logic updated

// Create navigators
//const Stack = createStackNavigator<RootStackParamList>();
const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// Logistics Drawer Navigator (for authenticated users)
function DashboardDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={props => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false, // We'll use our custom header in screens
        drawerPosition: 'left',
        drawerType: 'slide', // or 'back', 'front'
        overlayColor: 'rgba(0,0,0,0.5)',
      }}
    >
      <Drawer.Screen name="Dashboard" component={DashboardScreen} />
      {/* Add other logistics screens here */}
      <Drawer.Screen name="BookTransport" component={BookTransportScreen} />
      <Drawer.Screen name="TripDates" component={TripDatesScreen} />
      <Drawer.Screen name="TripDetails" component={TripDetailsScreen} />
      {/* If you have a BookingConfirmation screen, add it here too: */}
      {/* <AuthStack.Screen name="BookingConfirmation" component={BookingConfirmationScreen} /> */}
      {/* --------------------------- */}
      {/* <Drawer.Screen name="Drivers" component={DriversScreen} /> */}
      {/* ... other logistics screens */}
    </Drawer.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
          {/* Auth Screens */}
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />

          <Stack.Screen
            name="EmailVerification"
            component={EmailVerificationScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          {/* Main App (after authentication) */}
          {/* <Stack.Screen name="Home" component={LogisticsDrawer} /> */}

          {/* You can keep this as alternative if needed */}
          <Stack.Screen
            name="Dashboard"
            component={DashboardDrawer}
            options={{ gestureEnabled: false }} // Disable swipe back to auth
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
