import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { ProfileStackParamList } from '@/src/navigation/types';

const PROFILE_NAV = [
  { screen: 'OrgChart', label: 'My Profile & Org Chart' },
  { screen: 'Leave', label: 'Leave Request' },
  { screen: 'Performance', label: 'Performance' },
  { screen: 'Payslip', label: 'Payslip' },
  { screen: 'Schedule', label: 'Work Schedule / Shift' },
  { screen: 'Overtime', label: 'Overtime Registration' },
  { screen: 'Canteen', label: 'Canteen / Meal Booking' },
  { screen: 'Safety', label: 'Safety Regulations' },
] as const;

export default function ProfileMenuScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
      <ScrollView className="flex-1 px-4 pt-4">
        {PROFILE_NAV.map((item) => (
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
