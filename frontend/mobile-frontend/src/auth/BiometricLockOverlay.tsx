import { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { ShieldCheck } from 'lucide-react-native';

import { useAuth } from './AuthContext';

const logo = require('@/assets/images/logo.png');

// Shown as an overlay above the navigator (not a full unmount back to LoginScreen)
// when the session re-locks after a meaningful stretch in the background, so
// in-app navigation/scroll state survives a routine unlock.
export default function BiometricLockOverlay() {
  const { unlock } = useAuth();
  const [isUnlocking, setIsUnlocking] = useState(false);

  const attemptUnlock = async () => {
    setIsUnlocking(true);
    try {
      await unlock();
    } finally {
      setIsUnlocking(false);
    }
  };

  // Auto-prompt once on mount so most users never have to tap "Unlock".
  useEffect(() => {
    attemptUnlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <LinearGradient
      colors={['#0D3F7A', '#1558A8', '#2176C8']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
    >
      <SafeAreaView className="flex-1 px-8" edges={['top', 'bottom']}>
        <View className="flex-1 items-center justify-center">
          <Image source={logo} style={styles.logo} resizeMode="contain" className="mb-3" />
          <ShieldCheck size={32} color="rgba(255,255,255,0.85)" style={styles.shieldIcon} />
          <Text className="mb-1 text-2xl font-bold text-white">Session Locked</Text>
          <Text className="text-center text-sm text-white/70">
            Unlock with Face ID / fingerprint to continue.
          </Text>
        </View>
        <View className="mb-10 gap-4">
          <Pressable
            onPress={attemptUnlock}
            disabled={isUnlocking}
            className="flex-row items-center justify-center gap-2 rounded-full bg-white py-4 shadow-md active:opacity-80"
          >
            {isUnlocking ? (
              <ActivityIndicator color="#1558A8" />
            ) : (
              <Text className="text-base font-bold" style={styles.buttonText}>
                Unlock
              </Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  logo: { height: 40, width: 180 },
  shieldIcon: { marginBottom: 12 },
  buttonText: { color: '#1558A8' },
});
