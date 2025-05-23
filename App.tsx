import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomeScreen from './screens/WelcomeScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import LoginScreen from './screens/auth/LoginScreen';
import ServiceSelectionScreen from './screens/auth/ServiceSelectionScreen';
import LogisticsHomeScreen from './screens/LogisticsHomeScreen';
import HomeScreen from './screens/LogisticsHomeScreen';
import type { RootStackParamList } from './types/AuthProps';

// type RootStackParamList = {
//   Welcome: undefined;
//   Login: undefined;
//   Home: undefined;
//   Register: undefined;
//   ForgotPassword: undefined;
//   ServiceSelection: undefined;
// };

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Welcome" // This makes WelcomeScreen first
          screenOptions={{ headerShown: false }} // Hides header for all screens
        >
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="ServiceSelection" component={ServiceSelectionScreen} />
          <Stack.Screen name="LogisticsHome" component={LogisticsHomeScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
