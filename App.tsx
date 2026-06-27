import React from 'react';
import { StatusBar, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';

import { Colors } from './src/theme';
import { AppProvider, useAppContext } from './src/context/AppContext';
import LoginScreen from './src/screens/shared/LoginScreen';
import MemberNavigator from './src/navigation/MemberNavigator';
import OwnerNavigator from './src/navigation/OwnerNavigator';
import VendorNavigator from './src/navigation/VendorNavigator';

enableScreens();

// ── Inner component: reads context AFTER AppProvider is mounted ──
function AppInner() {
  const { role, isLoggedIn } = useAppContext();

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.bgBase}
      />
      {!isLoggedIn ? (
        <LoginScreen />
      ) : (
        <NavigationContainer>
          {role === 'owner' ? (
            <OwnerNavigator />
          ) : role === 'vendor' ? (
            <VendorNavigator />
          ) : (
            <MemberNavigator />
          )}
        </NavigationContainer>
      )}
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
