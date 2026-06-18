import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text } from 'react-native';
import { LightColors, Typography } from '../theme';

import OwnerDashboard from '../screens/owner/OwnerDashboard';
import MembersScreen from '../screens/owner/MembersScreen';
import TrainersScreen from '../screens/owner/TrainersScreen';
import PaymentsScreen from '../screens/owner/PaymentsScreen';
import ProductStoreScreen from '../screens/owner/ProductStoreScreen';
import OwnerAnalytics from '../screens/owner/OwnerAnalytics';
import MembershipPlansScreen from '../screens/owner/MembershipPlansScreen';
import GymProfileScreen from '../screens/owner/GymProfileScreen';

const Tab = createBottomTabNavigator();

export default function OwnerNavigator() {
  const TAB_ICONS: Record<string, string> = {
    Dashboard: '📊',
    Members: '👥',
    Trainers: '🏋️',
    Plans: '🏷️',
    Payments: '💰',
    Shop: '🛒',
    Analytics: '📈',
    Profile: '🏢',
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#8B5CF6',
        tabBarInactiveTintColor: LightColors.textMuted,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ focused }) => (
          <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>
            {TAB_ICONS[route.name] ?? '📋'}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={OwnerDashboard} />
      <Tab.Screen name="Members" component={MembersScreen} />
      <Tab.Screen name="Trainers" component={TrainersScreen} />
      <Tab.Screen name="Plans" component={MembershipPlansScreen} />
      <Tab.Screen name="Payments" component={PaymentsScreen} />
      <Tab.Screen name="Shop" component={ProductStoreScreen} />
      <Tab.Screen name="Analytics" component={OwnerAnalytics} />
      <Tab.Screen name="Profile" component={GymProfileScreen} />
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
    fontSize: 8,
    fontWeight: Typography.fontWeightSemiBold,
  },
  tabIcon: {
    fontSize: 18,
    opacity: 0.5,
  },
  tabIconFocused: {
    opacity: 1,
    fontSize: 20,
  },
});
