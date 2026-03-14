/**
 * Sentinel Mobile — Child Device Streaming App
 *
 * IMPORTANT: BackgroundLocationTask MUST be imported before any component renders.
 * expo-task-manager requires tasks to be defined at the module level, not inside
 * components or async initializers.
 */
import 'react-native-get-random-values'; // UUID polyfill — must be first
import './src/tasks/BackgroundLocationTask'; // Register background task — must be before NavigationContainer

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import LoginScreen from './src/screens/LoginScreen';
import StreamingScreen from './src/screens/StreamingScreen';

type RootStackParamList = {
  Login: undefined;
  Streaming: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerStyle: { backgroundColor: '#0f172a' },
            headerTintColor: '#f1f5f9',
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: '#0f172a' },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Streaming"
            component={StreamingScreen}
            options={{
              title: 'Sentinel',
              headerBackVisible: false, // Prevent going back to login
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
