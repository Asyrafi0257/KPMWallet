import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import VendorSalesScreen from '../screens/vendor/vendorSalesScreen';
import VendorTransactionScreen from '../screens/vendor/vendorTransactionScreen';
import TabBar from '../components/tabBar';
import VendorItemScreen from '../screens/vendor/vendorItemScreen';
import VendorShiftScreen from '../screens/vendor/vendorShiftScreen';
import VendorProfileScreen from '../screens/vendor/vendorProfileScreen';
import VendorSetShiftScreen from '../screens/vendor/vendorSetShiftScreen';
import VendorEditProfile from '../screens/vendor/vendorEditProfile';
import VendorChangePassword from "../screens/vendor/vendorChangePassword";
import VendorCheckoutScreen from '../screens/vendor/vendorCheckoutScreen';


const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

export type VendorStackParamList = {
    VendorTabs: undefined;
    ShiftDetails: undefined;
    EditProfile: undefined;
    ChangePassword: undefined;
    Checkout: {
        cartItems: Array<{ id: string; name: string; price: number; quantity: number }>;
    };
};

function VendorTabs() {
    return (
        <Tab.Navigator
            tabBar={(props) => <TabBar {...props} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tab.Screen name="Sales" component={VendorSalesScreen} />
            <Tab.Screen name="Transaction" component={VendorTransactionScreen} />
            <Tab.Screen name="Item" component={VendorItemScreen} />
            <Tab.Screen name="Shift" component={VendorShiftScreen} />
            <Tab.Screen name="Profile" component={VendorProfileScreen} />
        </Tab.Navigator>
    );
}

export default function VendorNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            
            <Stack.Screen
                name="VendorTabs"
                component={VendorTabs}
            />

            <Stack.Screen
                name="ShiftDetails"
                component={VendorSetShiftScreen}
            />

            <Stack.Screen 
                name="EditProfile"
                component={VendorEditProfile}
            />

            <Stack.Screen 
                name="ChangePassword"
                component={VendorChangePassword}
            />

            <Stack.Screen
                name="Checkout"
                component={VendorCheckoutScreen}
            />

        </Stack.Navigator>
    );
}
