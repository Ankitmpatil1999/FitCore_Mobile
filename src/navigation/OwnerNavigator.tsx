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
import OwnerWorkoutPlansScreen from '../screens/owner/OwnerWorkoutPlansScreen';
import NotificationsScreen from '../screens/member/NotificationsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function OwnerTabNavigator() {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'android' ? 10 : 8);
  const tabBarHeight = 58 + bottomInset;

  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: [
          styles.tabBar,
          {
            height: tabBarHeight,
            paddingBottom: bottomInset,
          },
        ],
        tabBarItemStyle: styles.tabBarItem,
        tabBarActiveTintColor: '#6C5CE7',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={OwnerDashboard}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconWrapper}>
              <AppIcon
                name="home"
                size={22}
                color={focused ? '#6C5CE7' : '#94A3B8'}
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
            <View style={styles.iconWrapper}>
              <AppIcon
                name="members"
                size={22}
                color={focused ? '#6C5CE7' : '#94A3B8'}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Packages"
        component={MembershipPlansScreen}
        options={{
          tabBarLabel: 'Packages',
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconWrapper}>
              <AppIcon
                name="plan"
                size={22}
                color={focused ? '#6C5CE7' : '#94A3B8'}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Reports"
        component={OwnerAnalytics}
        options={{
          tabBarLabel: 'Reports',
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconWrapper}>
              <AppIcon
                name="chart"
                size={22}
                color={focused ? '#6C5CE7' : '#94A3B8'}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="More"
        component={GymProfileScreen}
        options={{
          tabBarLabel: 'More',
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconWrapper}>
              <AppIcon
                name="gym"
                size={22}
                color={focused ? '#6C5CE7' : '#94A3B8'}
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
      <Stack.Screen name="GymProfile" component={GymProfileScreen} />
      <Stack.Screen name="WorkoutPlans" component={OwnerWorkoutPlansScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#ECEAFD',
    paddingTop: 8,
    elevation: 10,
    shadowColor: '#6C5CE7',
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
