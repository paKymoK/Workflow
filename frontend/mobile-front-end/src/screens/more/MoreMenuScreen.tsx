import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { MoreStackParamList } from '@/src/navigation/types';

const MORE_NAV = [
  { screen: 'Training', label: 'Training Materials & Documents' },
  { screen: 'Policies', label: 'Company Policies' },
  { screen: 'Survey', label: 'Internal Survey' },
  { screen: 'Helpdesk', label: 'IT Helpdesk' },
  { screen: 'Settings', label: 'Settings' },
] as const;

export default function MoreMenuScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
      <ScrollView className="flex-1 px-4 pt-4">
        {MORE_NAV.map((item) => (
          <Pressable
            key={item.screen}
            onPress={() => navigation.navigate(item.screen)}
            className="mb-2 flex-row items-center justify-between rounded-xl bg-white px-4 py-4 shadow-sm"
          >
            <Text className="text-base text-slate-800">{item.label}</Text>
            <ChevronRight size={18} color="#94a3b8" />
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
