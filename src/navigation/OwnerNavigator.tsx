import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StyleSheet, View, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../theme';

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

// ── Tab Bar Assets ──
const dashboardIcon = require('../assets/Bottom bar/Dashboard.png');
const memberIcon = require('../assets/Bottom bar/Member.png');
const attendanceIcon = require('../assets/Icons2/qr.png');
const paymentsIcon = require('../assets/Bottom bar/Histroy.png');
const profileIcon = require('../assets/Bottom bar/gym.png');

function OwnerTabNavigator() {
  return (
    <Tab.Navigator
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
      <Tab.Screen
        name="Dashboard"
        component={OwnerDashboard}
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
        name="Members"
        component={MembersScreen}
        options={{
          tabBarLabel: 'Members',
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconWrapper}>
              <Image
                source={memberIcon}
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
        name="Attendance"
        component={OwnerAnalytics}
        options={{
          tabBarLabel: 'Attendance',
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconWrapper}>
              <Image
                source={attendanceIcon}
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
        name="Finance"
        component={PaymentsScreen}
        options={{
          tabBarLabel: 'Finance',
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconWrapper}>
              <Image
                source={paymentsIcon}
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
        component={GymProfileScreen}
        options={{
          tabBarLabel: 'Gym Profile',
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
});
