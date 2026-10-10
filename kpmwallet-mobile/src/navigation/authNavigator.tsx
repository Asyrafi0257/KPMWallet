import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import RoleSelectScreen from '../screens/auth/RoleSelectScreen';
import FirstTimeEmailScreen from '../screens/auth/FirstTimeEmailScreen';
import CreatePasswordScreen from '../screens/auth/CreatePasswordScreen';

export type AuthStackParamList = {
  RoleSelect: undefined;

  FirstTimeEmail: {
    role: 'School' | 'Parent' | 'Student' | 'Vendor';
    nric: string;
  };

  CreatePassword: {
    nric: string;
    email: string;
    role: 'School' | 'Parent' | 'Student' | 'Vendor';
  };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="RoleSelect"
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: '#FFFFFF',
        },
      }}
    >
      <Stack.Screen
        name="RoleSelect"
        component={RoleSelectScreen}
      />

      <Stack.Screen
        name="FirstTimeEmail"
        component={FirstTimeEmailScreen}
      />

      <Stack.Screen
        name="CreatePassword"
        component={CreatePasswordScreen}
      />
    </Stack.Navigator>
  );
}

