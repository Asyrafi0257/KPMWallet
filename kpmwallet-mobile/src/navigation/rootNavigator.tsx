import React from 'react';
import { NavigationContainer, type NavigatorScreenParams } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AuthNavigator from './authNavigator';
import VendorNavigator from './vendorNavigator';
import StudentNavigator from './studentNavigator';
import navigationRef from './navigationRef';
import type { AuthStackParamList } from './authNavigator';

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList> | undefined;
  Vendor: undefined;
  Parent: undefined;
  Student: undefined;
  School: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="Auth"
          component={AuthNavigator}
        />

        <Stack.Screen
          name="Vendor"
          component={VendorNavigator}
        />

        <Stack.Screen
          name="Student"
          component={StudentNavigator}
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}
