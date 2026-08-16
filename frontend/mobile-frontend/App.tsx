import './global.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StatusBar, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { queryClient } from '@/src/api/queryClient';
import { AuthProvider, useAuth } from '@/src/auth/AuthContext';
import BiometricLockOverlay from '@/src/auth/BiometricLockOverlay';
import { useChatSocket } from '@/src/chat/useChatSocket';
import { useFcmRegistration } from '@/src/notifications/useFcmRegistration';
import { RootTabs } from '@/src/navigation/RootTabs';
import LoginScreen from '@/src/screens/LoginScreen';
import type { RootStackParamList } from '@/src/navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
  const { isAuthenticated, isLoading, isLocked } = useAuth();
  useChatSocket();
  useFcmRegistration();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#1558A8" />
      </View>
    );
  }

  return (
    <>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Tabs" component={RootTabs} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
      {isAuthenticated && isLocked && <BiometricLockOverlay />}
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <StatusBar barStyle="dark-content" />
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
