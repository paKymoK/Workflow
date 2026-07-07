import { Link } from 'expo-router';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';

const PROFILE_NAV = [
  { href: '/(tabs)/profile/org-chart', label: 'My Profile & Org Chart' },
  { href: '/(tabs)/profile/leave', label: 'Leave Request' },
  { href: '/(tabs)/profile/performance', label: 'Performance' },
  { href: '/(tabs)/profile/payslip', label: 'Payslip' },
  { href: '/(tabs)/profile/schedule', label: 'Work Schedule / Shift' },
  { href: '/(tabs)/profile/overtime', label: 'Overtime Registration' },
  { href: '/(tabs)/profile/canteen', label: 'Canteen / Meal Booking' },
  { href: '/(tabs)/profile/safety', label: 'Safety Regulations' },
] as const;

export default function ProfileMenuScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
      <ScrollView className="flex-1 px-4 pt-4">
        {PROFILE_NAV.map((item) => (
          <Link key={item.href} href={item.href} asChild>
            <Pressable className="mb-2 flex-row items-center justify-between rounded-xl bg-white px-4 py-4 shadow-sm">
              <Text className="text-base text-slate-800">{item.label}</Text>
              <ChevronRight size={18} color="#94a3b8" />
            </Pressable>
          </Link>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
