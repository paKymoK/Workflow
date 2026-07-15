import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {
  User,
  Calendar,
  BarChart2,
  FileText,
  Clock,
  Zap,
  Coffee,
  Shield,
  Camera,
  ChevronRight,
  LogOut,
  type LucideIcon,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { ProfileStackParamList } from '@/src/navigation/types';
import { PROFILE } from '@/src/data/profile';
import { colors } from '@/src/theme/colors';
import { useAuth } from '@/src/auth/AuthContext';

const PROFILE_NAV: { icon: LucideIcon; label: string; screen: keyof ProfileStackParamList; badge?: string }[] = [
  { icon: User, label: 'My Profile & Org Chart', screen: 'OrgChart' },
  { icon: Calendar, label: 'Leave Request', screen: 'Leave', badge: '8 days' },
  { icon: BarChart2, label: 'Performance', screen: 'Performance' },
  { icon: FileText, label: 'Payslip', screen: 'Payslip' },
  { icon: Clock, label: 'Work Schedule / Shift', screen: 'Schedule' },
  { icon: Zap, label: 'Overtime Registration', screen: 'Overtime', badge: 'Open' },
  { icon: Coffee, label: 'Canteen / Meal Booking', screen: 'Canteen' },
  { icon: Shield, label: 'Safety Regulations', screen: 'Safety' },
];

export default function ProfileMenuScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { logout } = useAuth();
  const [showLogout, setShowLogout] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'bottom']}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 20 }}>
          <LinearGradient
            colors={[colors.primaryDark, colors.primary, colors.primaryMid]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.6, y: 1 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <View className="flex-row items-center gap-4">
            <View className="relative">
              <View
                className="h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' }}
              >
                <Text className="text-2xl font-bold text-white">{PROFILE.initials}</Text>
              </View>
              <Pressable className="absolute bottom-0 right-0 h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm">
                <Camera size={11} color={colors.primary} />
              </Pressable>
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-white">{PROFILE.name}</Text>
              <Text className="text-sm text-blue-200">{PROFILE.title}</Text>
              <Text className="mt-0.5 text-xs text-blue-300">
                {PROFILE.line} · {PROFILE.department}
              </Text>
            </View>
          </View>
          <View className="mt-4 flex-row gap-2">
            {[
              { label: 'Employee ID', value: PROFILE.employeeId },
              { label: 'Joined', value: PROFILE.joined },
              { label: 'Shift', value: PROFILE.shift },
            ].map((s) => (
              <View
                key={s.label}
                className="flex-1 items-center rounded-xl px-2 py-2"
                style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
              >
                <Text className="text-[9px] font-medium text-blue-200">{s.label}</Text>
                <Text className="mt-0.5 text-xs font-bold text-white">{s.value}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className="mt-4 gap-2 px-4">
          {PROFILE_NAV.map((item) => (
            <Pressable
              key={item.screen}
              onPress={() => navigation.navigate(item.screen)}
              className="flex-row items-center gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-sm"
            >
              <View
                className="h-9 w-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: colors.surface }}
              >
                <item.icon size={17} color={colors.primary} />
              </View>
              <Text className="flex-1 text-sm font-medium text-gray-800">{item.label}</Text>
              {item.badge && (
                <Text
                  className="rounded-full px-2.5 py-1 text-[10px] font-bold"
                  style={
                    item.badge === 'Open'
                      ? { backgroundColor: '#DCFCE7', color: '#15803D' }
                      : { backgroundColor: '#EFF6FF', color: '#1D4ED8' }
                  }
                >
                  {item.badge}
                </Text>
              )}
              <ChevronRight size={15} color="#D1D5DB" />
            </Pressable>
          ))}

          <Pressable
            onPress={() => setShowLogout(true)}
            className="flex-row items-center gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-sm"
          >
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-red-50">
              <LogOut size={17} color="#EF4444" />
            </View>
            <Text className="flex-1 text-sm font-medium text-red-500">Log Out</Text>
          </Pressable>
        </View>
      </ScrollView>

      {showLogout && (
        <View className="absolute inset-0 justify-end" style={{ backgroundColor: 'rgba(10,24,48,0.5)' }}>
          <Pressable className="absolute inset-0" onPress={() => setShowLogout(false)} />
          <View className="rounded-t-3xl bg-white p-6 shadow-2xl">
            <View className="mb-4 h-12 w-12 items-center justify-center self-center rounded-full bg-red-100">
              <LogOut size={22} color="#EF4444" />
            </View>
            <Text className="mb-1 text-center text-lg font-bold text-gray-900">Log Out?</Text>
            <Text className="mb-6 text-center text-sm leading-relaxed text-gray-500">
              You will need to log back in with your employee ID and password to continue using the app.
            </Text>
            <View className="flex-row gap-3">
              <Pressable onPress={() => setShowLogout(false)} className="flex-1 items-center rounded-2xl bg-gray-100 py-3.5">
                <Text className="text-sm font-semibold text-gray-700">Cancel</Text>
              </Pressable>
              <Pressable onPress={logout} className="flex-1 items-center rounded-2xl bg-red-500 py-3.5">
                <Text className="text-sm font-bold text-white">Log Out</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
