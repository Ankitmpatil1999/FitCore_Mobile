import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StyleSheet, View, Image } from 'react-native';
import { Colors } from '../theme';

import DashboardScreen from '../screens/member/DashboardScreen';
import CheckInScreen from '../screens/member/ScannerProfileScreen';
import WorkoutScreen from '../screens/member/WorkoutScreen';
import DietScreen from '../screens/member/DietScreen';
import MyGymScreen from '../screens/member/MyGymScreen';
import MembershipScreen from '../screens/member/MembershipScreen';
import ProgressScreen from '../screens/member/ProgressScreen';
import ShopScreen from '../screens/member/ShopScreen';
import TrainerChatScreen from '../screens/member/TrainerChatScreen';
import NotificationsScreen from '../screens/member/NotificationsScreen';
import ProfileScreen from '../screens/member/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MemberTabNavigator() {
  const TAB_ICONS: Record<string, any> = {
    Home: require('../assets/Bottom bar/home.png'),
    Workout: require('../assets/Bottom bar/search.png'),
    Diet: require('../assets/Bottom bar/plan.png'),
    Shop: require('../assets/Bottom bar/protien.png'),
    Progress: require('../assets/Bottom bar/bar-graph.png'),
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false, // Remove names under icons
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
        safeAreaInsets: { bottom: 0, top: 0, left: 0, right: 0 }, // Disable automatic safe area padding
        tabBarIcon: ({ focused }) => {
          const iconSource = TAB_ICONS[route.name];
          if (!iconSource) return null;

          const isCenter = route.name === 'Diet';

          return (
            <View style={[
              styles.iconWrapper,
              focused ? styles.iconWrapperActive : styles.iconWrapperInactive
            ]}>
              <Image
                source={iconSource}
                style={[
                  styles.tabIcon,
                  isCenter ? styles.centerTabIcon : styles.normalTabIcon,
                  { opacity: focused ? 1 : 0.65 }
                ]}
              />
            </View>
          );
        },
      })}
    >
      {/* Main 5 visible tabs */}
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Workout" component={WorkoutScreen} />
      <Tab.Screen name="Diet" component={DietScreen} />
      <Tab.Screen name="Shop" component={ShopScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
    </Tab.Navigator>
  );
}

export default function MemberNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MemberTabNavigator} />
      <Stack.Screen name="Check-In" component={CheckInScreen} />
      <Stack.Screen name="My Gym" component={MyGymScreen} />
      <Stack.Screen name="Membership" component={MembershipScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Trainer Chat" component={TrainerChatScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#000000', // Solid black
    borderTopWidth: 0,
    height: 85, // Generous height to accommodate home indicator
    paddingBottom: 15, // Space for home swipe line
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    elevation: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  tabBarItem: {
    height: 55, // Fixed height for vertical centering in the active zone
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5, // Center within the top section of the bar
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapperActive: {
    backgroundColor: '#2C65DE',
  },
  iconWrapperInactive: {
    backgroundColor: 'rgba(44, 101, 222, 0.18)',
  },
  tabIcon: {
    resizeMode: 'contain',
  },
  normalTabIcon: {
    width: 24,
    height: 24,
  },
  centerTabIcon: {
    width: 32,
    height: 32,
  },
});
