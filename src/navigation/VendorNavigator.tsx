import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography } from '../theme';

import VendorDashboard from '../screens/vendor/VendorDashboard';
import VendorProductsScreen from '../screens/vendor/VendorProductsScreen';
import VendorOrdersScreen from '../screens/vendor/VendorOrdersScreen';
import VendorAnalyticsScreen from '../screens/vendor/VendorAnalyticsScreen';
import VendorProfileScreen from '../screens/vendor/VendorProfileScreen';

const Tab = createBottomTabNavigator();

const TAB_CONFIG: Record<string, { icon: string; iconOutline: string }> = {
  Dashboard: { icon: 'stats-chart', iconOutline: 'stats-chart-outline' },
  Products: { icon: 'cube', iconOutline: 'cube-outline' },
  Orders: { icon: 'receipt', iconOutline: 'receipt-outline' },
  Analytics: { icon: 'trending-up', iconOutline: 'trending-up-outline' },
  Settings: { icon: 'settings', iconOutline: 'settings-outline' },
};

export default function VendorNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
        tabBarActiveTintColor: '#6C5CE7',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ focused }) => {
          const cfg = TAB_CONFIG[route.name];
          if (!cfg) return null;
          return (
            <View style={styles.iconWrapper}>
              <Icon
                name={focused ? cfg.icon : cfg.iconOutline}
                size={22}
                color={focused ? '#6C5CE7' : '#94A3B8'}
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={VendorDashboard} />
      <Tab.Screen name="Products" component={VendorProductsScreen} />
      <Tab.Screen name="Orders" component={VendorOrdersScreen} />
      <Tab.Screen name="Analytics" component={VendorAnalyticsScreen} />
      <Tab.Screen name="Settings" component={VendorProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#ECEAFD',
    height: 76,
    paddingBottom: 10,
    paddingTop: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
  },
  tabBarItem: {
    paddingVertical: 2,
  },
  tabBarLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 2,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
  },
});
