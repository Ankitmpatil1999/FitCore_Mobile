import React from 'react';
import { StatusBar, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';

import { Colors } from './src/theme';
import { AppProvider, useAppContext } from './src/context/AppContext';
import SplashScreen from './src/screens/shared/SplashScreen';
import OnboardingScreen from './src/screens/shared/OnboardingScreen';
import LoginScreen from './src/screens/shared/LoginScreen';
import MemberNavigator from './src/navigation/MemberNavigator';
import OwnerNavigator from './src/navigation/OwnerNavigator';
import VendorNavigator from './src/navigation/VendorNavigator';
import TrainerNavigator from './src/navigation/TrainerNavigator';

enableScreens();

// ── Inner component: reads context AFTER AppProvider is mounted ──
function AppInner() {
  const {
    role,
    isLoggedIn,
    isAppReady,
    hasSeenOnboarding,
    completeOnboarding,
    setAppReady,
  } = useAppContext();

  // Step 1: Splash Screen
  if (!isAppReady) {
    return <SplashScreen onFinish={setAppReady} />;
  }

  // Step 2: Onboarding (only shown once, first launch)
  if (!hasSeenOnboarding) {
    return <OnboardingScreen onFinish={completeOnboarding} />;
  }

  // Step 3: Login / Signup
  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  // Step 4: Main App (role-based navigation)
  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F7F7FD"
      />
      <NavigationContainer>
        {role === 'owner' ? (
          <OwnerNavigator />
        ) : role === 'vendor' ? (
          <VendorNavigator />
        ) : role === 'trainer' ? (
          <TrainerNavigator />
        ) : (
          <MemberNavigator />
        )}
      </NavigationContainer>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <AppInner />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bgBase,
  },
});
