import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut } from 'lucide-react-native';

import { useAuth } from '@/src/auth/AuthContext';

export default function SettingsScreen() {
  const { logout } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-slate-50 px-4 pt-4" edges={['bottom']}>
      <Text className="text-xl font-bold text-slate-900">Settings</Text>
      <Text className="mt-1 text-slate-500">App settings go here.</Text>

      <Pressable
        onPress={logout}
        className="mt-6 flex-row items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 py-3.5"
      >
        <LogOut size={16} color="#dc2626" />
        <Text className="font-semibold text-red-600">Log out</Text>
      </Pressable>
    </SafeAreaView>
  );
}
