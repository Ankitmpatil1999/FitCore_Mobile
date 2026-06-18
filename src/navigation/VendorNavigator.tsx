import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text } from 'react-native';
import { LightColors, Typography } from '../theme';

import VendorDashboard from '../screens/vendor/VendorDashboard';
import VendorProductsScreen from '../screens/vendor/VendorProductsScreen';
import VendorOrdersScreen from '../screens/vendor/VendorOrdersScreen';
import VendorProfileScreen from '../screens/vendor/VendorProfileScreen';

const Tab = createBottomTabNavigator();

export default function VendorNavigator() {
  const TAB_ICONS: Record<string, string> = {
    Dashboard: '📊',
    Products: '📦',
    Orders: '📝',
    Settings: '⚙️',
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#7C3AED',
        tabBarInactiveTintColor: LightColors.textMuted,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ focused }) => (
          <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>
            {TAB_ICONS[route.name] ?? '📋'}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={VendorDashboard} />
      <Tab.Screen name="Products" component={VendorProductsScreen} />
      <Tab.Screen name="Orders" component={VendorOrdersScreen} />
      <Tab.Screen name="Settings" component={VendorProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    height: 64,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabBarLabel: {
    fontSize: 9,
    fontWeight: Typography.fontWeightBold,
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.5,
  },
  tabIconFocused: {
    opacity: 1,
    fontSize: 22,
  },
});
