import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {
  ArrowLeft,
  Pencil,
  Lock,
  Globe,
  ChevronDown,
  Bell,
  Mail,
  Newspaper,
  MessageSquare,
  Calendar,
  Info,
  Shield,
  LogOut,
  ChevronRight,
} from 'lucide-react-native';

import { colors } from '@/src/theme/colors';
import { Toggle } from '@/src/components/Toggle';
import { useAuth } from '@/src/auth/AuthContext';
import { PROFILE } from '@/src/data/profile';

const logo = require('@/assets/images/logo.png');
const LANGUAGES = ['English', 'Vietnamese'];

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { logout } = useAuth();
  const [lang, setLang] = useState('English');
  const [pushNotifs, setPushNotifs] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(false);
  const [newsNotifs, setNewsNotifs] = useState(true);
  const [chatNotifs, setChatNotifs] = useState(true);
  const [leaveNotifs, setLeaveNotifs] = useState(true);
  const [showLogout, setShowLogout] = useState(false);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <View className="flex-row items-center gap-3 border-b border-gray-100 bg-white px-4 pb-3 pt-4">
        <Pressable
          onPress={() => navigation.goBack()}
          className="h-8 w-8 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.surface }}
        >
          <ArrowLeft size={18} color={colors.primary} />
        </Pressable>
        <Text className="text-base font-bold text-gray-900">Settings</Text>
      </View>

      <ScrollView className="flex-1" style={{ backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="gap-5 px-4 pt-4">
          <View>
            <Text className="mb-2 px-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Account</Text>
            <View className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <View className="flex-row items-center gap-3 border-b border-gray-50 px-4 py-4">
                <LinearGradient
                  colors={[colors.primary, colors.primaryLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ height: 48, width: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text className="font-bold text-white">{PROFILE.initials}</Text>
                </LinearGradient>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-gray-900">{PROFILE.name}</Text>
                  <Text className="text-xs text-gray-400">
                    QC Supervisor · {PROFILE.employeeId}
                  </Text>
                </View>
                <Pressable className="flex-row items-center gap-1">
                  <Pencil size={12} color={colors.primary} />
                  <Text className="text-xs font-bold" style={{ color: colors.primary }}>
                    Edit
                  </Text>
                </Pressable>
              </View>
              <Pressable className="flex-row items-center gap-3 px-4 py-3.5">
                <View className="h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: colors.surface }}>
                  <Lock size={15} color={colors.primary} />
                </View>
                <Text className="flex-1 text-sm font-medium text-gray-800">Change Password</Text>
                <ChevronRight size={15} color="#D1D5DB" />
              </Pressable>
            </View>
          </View>

          <View>
            <Text className="mb-2 px-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Preferences</Text>
            <View className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <View className="flex-row items-center gap-3 border-b border-gray-50 px-4 py-3.5">
                <View className="h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: colors.surface }}>
                  <Globe size={15} color={colors.primary} />
                </View>
                <Text className="flex-1 text-sm font-medium text-gray-800">Language</Text>
                <Pressable
                  onPress={() => setLang((l) => LANGUAGES[(LANGUAGES.indexOf(l) + 1) % LANGUAGES.length])}
                  className="flex-row items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5"
                >
                  <Text className="text-xs font-semibold text-gray-600">{lang}</Text>
                  <ChevronDown size={11} color="#9CA3AF" />
                </Pressable>
              </View>
              <View className="flex-row items-center gap-3 border-b border-gray-50 px-4 py-3.5">
                <View className="h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: colors.surface }}>
                  <Bell size={15} color={colors.primary} />
                </View>
                <Text className="flex-1 text-sm font-medium text-gray-800">Push Notifications</Text>
                <Toggle on={pushNotifs} onToggle={() => setPushNotifs((v) => !v)} />
              </View>
              <View className="flex-row items-center gap-3 px-4 py-3.5">
                <View className="h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: colors.surface }}>
                  <Mail size={15} color={colors.primary} />
                </View>
                <Text className="flex-1 text-sm font-medium text-gray-800">Email Notifications</Text>
                <Toggle on={emailNotifs} onToggle={() => setEmailNotifs((v) => !v)} />
              </View>
            </View>
          </View>

          {pushNotifs && (
            <View>
              <Text className="mb-2 px-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Notification Categories</Text>
              <View className="overflow-hidden rounded-2xl bg-white shadow-sm">
                {[
                  { label: 'News & Announcements', Icon: Newspaper, val: newsNotifs, set: setNewsNotifs },
                  { label: 'Chat Messages', Icon: MessageSquare, val: chatNotifs, set: setChatNotifs },
                  { label: 'Leave Approval Updates', Icon: Calendar, val: leaveNotifs, set: setLeaveNotifs },
                ].map(({ label, Icon, val, set }, i, arr) => (
                  <View key={label} className={`flex-row items-center gap-3 px-4 py-3.5 ${i < arr.length - 1 ? 'border-b border-gray-50' : ''}`}>
                    <View className="h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: colors.surface }}>
                      <Icon size={15} color={colors.primary} />
                    </View>
                    <Text className="flex-1 text-sm font-medium text-gray-800">{label}</Text>
                    <Toggle on={val} onToggle={() => set((v) => !v)} />
                  </View>
                ))}
              </View>
            </View>
          )}

          <View>
            <Text className="mb-2 px-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">App</Text>
            <View className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <View className="flex-row items-center gap-3 border-b border-gray-50 px-4 py-3.5">
                <View className="h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: colors.surface }}>
                  <Info size={15} color={colors.primary} />
                </View>
                <Text className="flex-1 text-sm font-medium text-gray-800">App Version</Text>
                <Text className="text-xs font-semibold text-gray-400">v2.1.0</Text>
              </View>
              <Pressable className="flex-row items-center gap-3 px-4 py-3.5">
                <View className="h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: colors.surface }}>
                  <Shield size={15} color={colors.primary} />
                </View>
                <Text className="flex-1 text-sm font-medium text-gray-800">Terms & Privacy Policy</Text>
                <ChevronRight size={15} color="#D1D5DB" />
              </Pressable>
            </View>
          </View>

          <Pressable onPress={() => setShowLogout(true)} className="flex-row items-center gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-sm">
            <View className="h-8 w-8 items-center justify-center rounded-lg bg-red-50">
              <LogOut size={15} color="#EF4444" />
            </View>
            <Text className="flex-1 text-sm font-medium text-red-500">Log Out</Text>
          </Pressable>

          <View className="items-center pb-4">
            <Image source={logo} style={{ height: 28, width: 100, opacity: 0.3 }} resizeMode="contain" />
            <Text className="mt-1.5 text-[10px] text-gray-300">© 2025 CMC Global. All rights reserved.</Text>
          </View>
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
