import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppIcon from '../components/common/AppIcon';

import OwnerDashboard from '../screens/owner/OwnerDashboard';
import MembersScreen from '../screens/owner/MembersScreen';
import PaymentsScreen from '../screens/owner/PaymentsScreen';
import TrainersScreen from '../screens/owner/TrainersScreen';
import ProductStoreScreen from '../screens/owner/ProductStoreScreen';
import OwnerAnalytics from '../screens/owner/OwnerAnalytics';
import MembershipPlansScreen from '../screens/owner/MembershipPlansScreen';
import GymProfileScreen from '../screens/owner/GymProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function OwnerTabNavigator() {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom > 0 ? insets.bottom : 8;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: [
          styles.tabBar,
          {
            height: Platform.OS === 'android' ? 68 + bottomInset : 64 + bottomInset,
            paddingBottom: bottomInset + 4,
          },
        ],
        tabBarItemStyle: styles.tabBarItem,
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={OwnerDashboard}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
              <AppIcon
                name="dashboard"
                size={22}
                color={focused ? '#4F46E5' : '#94A3B8'}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Members"
        component={MembersScreen}
        options={{
          tabBarLabel: 'Members',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
              <AppIcon
                name="members"
                size={22}
                color={focused ? '#4F46E5' : '#94A3B8'}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Attendance"
        component={OwnerAnalytics}
        options={{
          tabBarLabel: 'Attendance',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
              <AppIcon
                name="attendance"
                size={22}
                color={focused ? '#4F46E5' : '#94A3B8'}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Finance"
        component={PaymentsScreen}
        options={{
          tabBarLabel: 'Finance',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
              <AppIcon
                name="finance"
                size={22}
                color={focused ? '#4F46E5' : '#94A3B8'}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={GymProfileScreen}
        options={{
          tabBarLabel: 'Gym Profile',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
              <AppIcon
                name="gym"
                size={22}
                color={focused ? '#4F46E5' : '#94A3B8'}
              />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function OwnerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={OwnerTabNavigator} />
      <Stack.Screen name="Members" component={MembersScreen} />
      <Stack.Screen name="Finance" component={PaymentsScreen} />
      <Stack.Screen name="Trainers" component={TrainersScreen} />
      <Stack.Screen name="Plans" component={MembershipPlansScreen} />
      <Stack.Screen name="Shop" component={ProductStoreScreen} />
      <Stack.Screen name="Analytics" component={OwnerAnalytics} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    elevation: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  tabBarItem: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 2,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 38,
    height: 32,
    borderRadius: 16,
  },
  iconWrapperActive: {
    backgroundColor: 'rgba(79, 70, 229, 0.10)',
  },
});
