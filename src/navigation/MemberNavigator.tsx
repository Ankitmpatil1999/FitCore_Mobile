import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StyleSheet, View, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../theme';

import DashboardScreen from '../screens/member/DashboardScreen';
import WorkoutScreen from '../screens/member/WorkoutScreen';
import CheckInScreen from '../screens/member/ScannerProfileScreen';
import ProgressScreen from '../screens/member/ProgressScreen';
import ProfileScreen from '../screens/member/ProfileScreen';

// Stack screens
import ExerciseDetailScreen from '../screens/member/ExerciseDetailScreen';
import ActiveWorkoutScreen from '../screens/member/ActiveWorkoutScreen';
import DietScreen from '../screens/member/DietScreen';
import MyGymScreen from '../screens/member/MyGymScreen';
import MembershipScreen from '../screens/member/MembershipScreen';
import ShopScreen from '../screens/member/ShopScreen';
import TrainerChatScreen from '../screens/member/TrainerChatScreen';
import NotificationsScreen from '../screens/member/NotificationsScreen';
import ClassesScreen from '../screens/member/ClassesScreen';
import CartCheckoutScreen from '../screens/member/CartCheckoutScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// ── Tab Bar Assets ──
const homeIcon = require('../assets/Bottom bar/home.png');
const barbellIcon = require('../assets/Icons2/barbell.png');
const proteinCenterIcon = require('../assets/Bottom bar/protien.png');
const progressIcon = require('../assets/Icons2/bar-chart.png');
const meIcon = require('../assets/Icons2/user.png');

function MemberTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
        tabBarActiveTintColor: '#6C5CE7',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      {/* 1. Home Tab */}
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconWrapper}>
              <Image
                source={homeIcon}
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

      {/* 2. Workout Tab */}
      <Tab.Screen
        name="Workout"
        component={WorkoutScreen}
        options={{
          tabBarLabel: 'Workout',
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconWrapper}>
              <Image
                source={barbellIcon}
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

      {/* 3. Center Floating Store & Supplements Tab */}
      <Tab.Screen
        name="StoreTab"
        component={ShopScreen}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: ({ focused }) => (
            <View style={styles.centerPlusButton}>
              <Image
                source={proteinCenterIcon}
                style={{ width: 24, height: 24, tintColor: '#FFFFFF' }}
                resizeMode="contain"
              />
            </View>
          ),
        }}
      />


      {/* 4. Progress Tab */}
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          tabBarLabel: 'Progress',
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconWrapper}>
              <Image
                source={progressIcon}
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

      {/* 5. Me Tab */}
      <Tab.Screen
        name="Me"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Me',
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconWrapper}>
              <Image
                source={meIcon}
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

export default function MemberNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MemberTabNavigator} />
      <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
      <Stack.Screen name="ActiveWorkout" component={ActiveWorkoutScreen} />
      <Stack.Screen name="Check-In" component={CheckInScreen} />
      <Stack.Screen name="My Gym" component={MyGymScreen} />
      <Stack.Screen name="Membership" component={MembershipScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Diet" component={DietScreen} />
      <Stack.Screen name="Shop" component={ShopScreen} />
      <Stack.Screen name="Trainer Chat" component={TrainerChatScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Classes" component={ClassesScreen} />
      <Stack.Screen name="Book Slot" component={ClassesScreen} />
      <Stack.Screen name="CartCheckout" component={CartCheckoutScreen} />
    </Stack.Navigator>
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
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  tabBarItem: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBarLabel: {
    fontSize: 10,
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
  centerPlusButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6C5CE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    elevation: 6,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
});
