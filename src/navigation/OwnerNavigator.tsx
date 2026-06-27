import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StyleSheet, View, Image } from 'react-native';
import { LightColors } from '../theme';

import OwnerDashboard from '../screens/owner/OwnerDashboard';
import MembersScreen from '../screens/owner/MembersScreen';
import TrainersScreen from '../screens/owner/TrainersScreen';
import PaymentsScreen from '../screens/owner/PaymentsScreen';
import ProductStoreScreen from '../screens/owner/ProductStoreScreen';
import OwnerAnalytics from '../screens/owner/OwnerAnalytics';
import MembershipPlansScreen from '../screens/owner/MembershipPlansScreen';
import GymProfileScreen from '../screens/owner/GymProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function OwnerTabNavigator() {
  const TAB_ICONS: Record<string, any> = {
    Dashboard: require('../assets/Bottom bar/Dashboard.png'),
    Members: require('../assets/Bottom bar/Member.png'),
    Trainers: require('../assets/Bottom bar/Trainer.png'),
    Payments: require('../assets/Bottom bar/Histroy.png'),
    Profile: require('../assets/Bottom bar/gym.png'),
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
        safeAreaInsets: { bottom: 0, top: 0, left: 0, right: 0 },
        tabBarIcon: ({ focused }) => {
          const iconSource = TAB_ICONS[route.name];
          if (!iconSource) return null;

          return (
            <View style={[
              styles.iconWrapper,
              focused ? styles.iconWrapperActive : styles.iconWrapperInactive
            ]}>
              <Image
                source={iconSource}
                style={[
                  styles.tabIcon,
                  { opacity: focused ? 1 : 0.65 }
                ]}
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={OwnerDashboard} />
      <Tab.Screen name="Members" component={MembersScreen} />
      <Tab.Screen name="Trainers" component={TrainersScreen} />
      <Tab.Screen name="Payments" component={PaymentsScreen} />
      <Tab.Screen name="Profile" component={GymProfileScreen} />
    </Tab.Navigator>
  );
}

export default function OwnerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={OwnerTabNavigator} />
      <Stack.Screen name="Plans" component={MembershipPlansScreen} />
      <Stack.Screen name="Shop" component={ProductStoreScreen} />
      <Stack.Screen name="Analytics" component={OwnerAnalytics} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#000000',
    borderTopWidth: 0,
    height: 85,
    paddingBottom: 15,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 10,
  },
  tabBarItem: {
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
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
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
});
