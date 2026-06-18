import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text } from 'react-native';
import { LightColors, Typography } from '../theme';

import DashboardScreen from '../screens/member/DashboardScreen';
import CheckInScreen from '../screens/member/ScannerProfileScreen';
import WorkoutScreen from '../screens/member/WorkoutScreen';
import DietScreen from '../screens/member/DietScreen';
import MyGymScreen from '../screens/member/MyGymScreen';
import MembershipScreen from '../screens/member/MembershipScreen';
import ProgressScreen from '../screens/member/ProgressScreen';
import ShopScreen from '../screens/member/ShopScreen';
import ProfileScreen from '../screens/member/ProfileScreen';
import TrainerChatScreen from '../screens/member/TrainerChatScreen';
import NotificationsScreen from '../screens/member/NotificationsScreen';

const Tab = createBottomTabNavigator();

export default function MemberNavigator() {
  const TAB_ICONS: Record<string, string> = {
    Home: '🏠',
    Workout: '💪',
    Diet: '🥗',
    'Check-In': '🪪',
    'My Gym': '🏢',
    Membership: '🏷️',
    Progress: '📈',
    Shop: '🛒',
    'Trainer Chat': '💬',
    Notifications: '🔔',
    Profile: '👤',
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#0EA5E9',
        tabBarInactiveTintColor: LightColors.textMuted,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ focused }) => (
          <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>
            {TAB_ICONS[route.name] ?? '●'}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Workout" component={WorkoutScreen} />
      <Tab.Screen name="Diet" component={DietScreen} />
      <Tab.Screen name="Check-In" component={CheckInScreen} />
      <Tab.Screen name="My Gym" component={MyGymScreen} />
      <Tab.Screen name="Membership" component={MembershipScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Shop" component={ShopScreen} />
      <Tab.Screen name="Trainer Chat" component={TrainerChatScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
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
