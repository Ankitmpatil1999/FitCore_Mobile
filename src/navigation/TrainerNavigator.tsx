import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StyleSheet, View, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme';

import TrainerDashboard from '../screens/trainer/TrainerDashboard';
import TrainerClientsScreen from '../screens/trainer/TrainerClientsScreen';
import ClientDetailsScreen from '../screens/trainer/ClientDetailsScreen';
import AssignWorkoutScreen from '../screens/trainer/AssignWorkoutPlanScreen';
import AssignDietScreen from '../screens/trainer/AssignDietPlanScreen';
import TrainerChatScreen from '../screens/trainer/TrainerChatScreen';
import ScheduleSessionsScreen from '../screens/trainer/ScheduleSessionsScreen';
import TrainerProfileScreen from '../screens/trainer/TrainerProfileScreen';
import TrainerAttendanceScreen from '../screens/trainer/TrainerAttendanceScreen';
import TrainerReviewsScreen from '../screens/trainer/TrainerReviewsScreen';
import TrainerLeaveRequestScreen from '../screens/trainer/TrainerLeaveRequestScreen';
import NotificationsScreen from '../screens/member/NotificationsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const dashboardIcon = require('../assets/Bottom bar/Dashboard.png');
const clientsIcon = require('../assets/Bottom bar/Member.png');
const plansIcon = require('../assets/Bottom bar/plan.png');
const profileIcon = require('../assets/Bottom bar/gym.png');

function TrainerTabNavigator() {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'android' ? 10 : 8);
  const tabBarHeight = 58 + bottomInset;

  return (
    <Tab.Navigator
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
        component={TrainerDashboard}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconWrapper}>
              <Image
                source={dashboardIcon}
                style={[
                  styles.tabIcon,
                  { tintColor: focused ? '#6C5CE7' : '#94A3B8' },
                ]}
                resizeMode="contain"
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Clients"
        component={TrainerClientsScreen}
        options={{
          tabBarLabel: 'Clients',
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconWrapper}>
              <Image
                source={clientsIcon}
                style={[
                  styles.tabIcon,
                  { tintColor: focused ? '#6C5CE7' : '#94A3B8' },
                ]}
                resizeMode="contain"
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Plans"
        component={AssignWorkoutScreen}
        options={{
          tabBarLabel: 'Workout Plan',
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconWrapper}>
              <Image
                source={plansIcon}
                style={[
                  styles.tabIcon,
                  { tintColor: focused ? '#6C5CE7' : '#94A3B8' },
                ]}
                resizeMode="contain"
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={TrainerProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconWrapper}>
              <Image
                source={profileIcon}
                style={[
                  styles.tabIcon,
                  { tintColor: focused ? '#6C5CE7' : '#94A3B8' },
                ]}
                resizeMode="contain"
              />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function TrainerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TrainerTabNavigator} />
      <Stack.Screen name="ClientDetails" component={ClientDetailsScreen} />
      <Stack.Screen name="AssignWorkout" component={AssignWorkoutScreen} />
      <Stack.Screen name="AssignDiet" component={AssignDietScreen} />
      <Stack.Screen name="ScheduleSessions" component={ScheduleSessionsScreen} />
      <Stack.Screen name="TrainerChat" component={TrainerChatScreen} />
      <Stack.Screen name="TrainerAttendance" component={TrainerAttendanceScreen} />
      <Stack.Screen name="TrainerReviews" component={TrainerReviewsScreen} />
      <Stack.Screen name="TrainerLeaveRequest" component={TrainerLeaveRequestScreen} />
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
  tabIcon: {
    width: 22,
    height: 22,
  },
});

