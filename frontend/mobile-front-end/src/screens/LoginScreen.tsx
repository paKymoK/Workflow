import { View, Text, Image, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { ShieldCheck } from 'lucide-react-native';

import { useAuth } from '@/src/auth/AuthContext';

const logo = require('@/assets/images/logo.png');

export default function LoginScreen() {
  const { isAuthenticating, error, login } = useAuth();

  return (
    <LinearGradient
      colors={['#0D3F7A', '#1558A8', '#2176C8']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1 px-8" edges={['top', 'bottom']}>
        <View className="flex-1 items-center justify-center">
          <Image source={logo} style={{ height: 40, width: 180 }} resizeMode="contain" className="mb-3" />
          <Text className="mb-1 text-2xl font-bold text-white">Employee Portal</Text>
          <Text className="text-center text-sm text-white/70">
            Sign in with your company account to continue.
          </Text>
        </View>
        <View className="mb-10 gap-4">
          {error && (
            <View className="rounded-xl border border-red-200/40 bg-red-500/20 px-4 py-3">
              <Text className="text-center text-xs font-medium text-white">{error}</Text>
            </View>
          )}
          <Pressable
            onPress={login}
            disabled={isAuthenticating}
            className="flex-row items-center justify-center gap-2 rounded-full bg-white py-4 shadow-md active:opacity-80"
          >
            {isAuthenticating ? (
              <ActivityIndicator color="#1558A8" />
            ) : (
              <Text className="text-base font-bold" style={{ color: '#1558A8' }}>
                Log in with Company Account
              </Text>
            )}
          </Pressable>
          <View className="flex-row items-center justify-center gap-1.5">
            <ShieldCheck size={13} color="rgba(255,255,255,0.6)" />
            <Text className="text-center text-[11px] text-white/60">
              You'll be securely redirected to your company sign-in page
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
