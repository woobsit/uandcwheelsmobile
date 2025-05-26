import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import WelcomeScreen from './screens/WelcomeScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import LoginScreen from './screens/auth/LoginScreen';
import ServiceSelectionScreen from './screens/auth/ServiceSelectionScreen';
import LogisticsHomeScreen from './screens/LogisticsHomeScreen';
import CustomDrawerContent from './components/molecules/CustomDrawerContent'; // You'll create this
import type { RootStackParamList } from './types/AuthProps';

// Create navigators
const Stack = createStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator();

// Logistics Drawer Navigator (for authenticated users)
function LogisticsDrawer() {
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
      <Drawer.Screen name="LogisticsHome" component={LogisticsHomeScreen} />
      {/* Add other logistics screens here */}
      {/* <Drawer.Screen name="Shipments" component={ShipmentsScreen} /> */}
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
          <Stack.Screen name="ServiceSelection" component={ServiceSelectionScreen} />

          {/* Main App (after authentication) */}
          <Stack.Screen name="Home" component={LogisticsDrawer} />

          {/* You can keep this as alternative if needed */}
          <Stack.Screen
            name="LogisticsHome"
            component={LogisticsDrawer}
            options={{ gestureEnabled: false }} // Disable swipe back to auth
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
