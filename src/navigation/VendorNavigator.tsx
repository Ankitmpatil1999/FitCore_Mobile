import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'android' ? 10 : 8);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: [
          styles.tabBar,
          {
            height: 60 + bottomInset,
            paddingBottom: bottomInset,
          },
        ],
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
    paddingTop: 8,
    elevation: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  tabBarItem: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 2,
  },
  tabBarLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 2,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
  },
});

