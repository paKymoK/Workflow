import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpen, FileText, ClipboardList, Headphones, Settings, ChevronRight, type LucideIcon } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { MoreStackParamList } from '@/src/navigation/types';
import { colors } from '@/src/theme/colors';

const logo = require('@/assets/images/logo.png');

const MORE_NAV: { icon: LucideIcon; label: string; screen: keyof MoreStackParamList }[] = [
  { icon: BookOpen, label: 'Training Materials & Documents', screen: 'Training' },
  { icon: FileText, label: 'Company Policies', screen: 'Policies' },
  { icon: ClipboardList, label: 'Internal Survey', screen: 'Survey' },
  { icon: Headphones, label: 'IT Helpdesk / Support Ticket', screen: 'Helpdesk' },
  { icon: Settings, label: 'Settings', screen: 'Settings' },
];

export default function MoreMenuScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'bottom']}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-4 pb-3 pt-4">
          <Text className="text-lg font-bold text-gray-900">More</Text>
          <Text className="text-xs text-gray-400">Resources & settings</Text>
        </View>

        <View className="gap-2 px-4">
          {MORE_NAV.map((item) => (
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
              <ChevronRight size={15} color="#D1D5DB" />
            </Pressable>
          ))}
        </View>

        <View className="items-center pb-4 pt-6">
          <Image source={logo} style={{ height: 32, width: 120, opacity: 0.4 }} resizeMode="contain" />
          <Text className="mt-2 text-xs text-gray-400">CMC Global Employee Portal v2.1.0</Text>
          <Text className="mt-1 text-[10px] text-gray-300">© 2025 CMC Global. All rights reserved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
