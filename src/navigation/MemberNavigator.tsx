import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StyleSheet, View, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../theme';

import DashboardScreen from '../screens/member/DashboardScreen';
import WorkoutScreen from '../screens/member/WorkoutScreen';
import CheckInScreen from '../screens/member/ScannerProfileScreen';
import ProgressScreen from '../screens/member/ProgressScreen';
import ProfileScreen from '../screens/member/ProfileScreen';

// Stack screens
import ExerciseDetailScreen from '../screens/member/ExerciseDetailScreen';
import DietScreen from '../screens/member/DietScreen';
import MyGymScreen from '../screens/member/MyGymScreen';
import MembershipScreen from '../screens/member/MembershipScreen';
import ShopScreen from '../screens/member/ShopScreen';
import TrainerChatScreen from '../screens/member/TrainerChatScreen';
import NotificationsScreen from '../screens/member/NotificationsScreen';
import ClassesScreen from '../screens/member/ClassesScreen';
import CartCheckoutScreen from '../screens/member/CartCheckoutScreen';
import AttendanceHistoryScreen from '../screens/member/AttendanceHistoryScreen';
import HelpSupportScreen from '../screens/member/HelpSupportScreen';
import LegalWebviewScreen from '../screens/member/LegalWebviewScreen';
import DeleteAccountScreen from '../screens/member/DeleteAccountScreen';
import AboutScreen from '../screens/member/AboutScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// ── Tab Bar Assets ──
const homeIcon = require('../assets/Bottom bar/home.png');
const barbellIcon = require('../assets/Icons2/barbell.png');
const proteinCenterIcon = require('../assets/Bottom bar/protien.png');
const progressIcon = require('../assets/Icons2/bar-chart.png');
const meIcon = require('../assets/Icons2/user.png');

function MemberTabNavigator() {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'android' ? 10 : 8);
  const tabBarHeight = 58 + bottomInset;

  return (
    <Tab.Navigator
      initialRouteName="Home"
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
      <Stack.Screen name="Check-In" component={CheckInScreen} />
      <Stack.Screen name="My Gym" component={MyGymScreen} />
      <Stack.Screen name="Membership" component={MembershipScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Diet" component={DietScreen} />
      <Stack.Screen name="Shop" component={ShopScreen} />
      <Stack.Screen name="Trainer Chat" component={TrainerChatScreen} />
      <Stack.Screen name="Trainer" component={TrainerChatScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Classes" component={ClassesScreen} />
      <Stack.Screen name="Book Slot" component={ClassesScreen} />
      <Stack.Screen name="CartCheckout" component={CartCheckoutScreen} />
      <Stack.Screen name="AttendanceHistory" component={AttendanceHistoryScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="LegalWebview" component={LegalWebviewScreen} />
      <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    borderTopColor: 'transparent',
    paddingTop: 6,
    elevation: 8,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
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
