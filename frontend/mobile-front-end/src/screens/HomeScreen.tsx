import { useEffect, useState, type ReactNode } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Search, Bell, TrendingUp, CheckCircle, Star, Clock, Calendar, type LucideIcon } from 'lucide-react-native';

import { ProgressBar } from '@/src/components/ProgressBar';
import { HOME_SLIDES, QUICK_LINKS, HOME_WIDGETS, ANNOUNCEMENTS } from '@/src/data/home';
import type { RootTabParamList } from '@/src/navigation/types';

const logo = require('@/assets/images/logo.png');

export default function HomeScreen() {
  const [slide, setSlide] = useState(0);
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % HOME_SLIDES.length), 4200);
    return () => clearInterval(t);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="flex-row items-center justify-between px-4 pb-3 pt-2">
          <View>
            <Text className="text-xs text-gray-500">Good morning,</Text>
            <Text className="text-base font-bold text-gray-900">Nguyen Thi Lan 👋</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Pressable className="h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
              <Search size={17} color="#6b7280" />
            </Pressable>
            <View>
              <Pressable className="h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
                <Bell size={17} color="#6b7280" />
              </Pressable>
              <View className="absolute -right-1 -top-1 h-4 w-4 items-center justify-center rounded-full bg-red-500">
                <Text className="text-[9px] font-bold text-white">3</Text>
              </View>
            </View>
          </View>
        </View>

        <View className="mx-4 h-36 overflow-hidden rounded-2xl shadow-md">
          {HOME_SLIDES.map((s, i) => (
            <LinearGradient
              key={s.tag}
              colors={[...s.colors]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                opacity: i === slide ? 1 : 0,
                paddingHorizontal: 20,
                justifyContent: 'center',
              }}
            >
              <Image source={logo} style={{ height: 24, width: 112 }} resizeMode="contain" className="mb-2 opacity-90" />
              <Text className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/60">{s.tag}</Text>
              <Text className="max-w-[260px] text-sm font-semibold leading-snug text-white">{s.body}</Text>
            </LinearGradient>
          ))}
          <View className="absolute bottom-3 right-4 flex-row gap-1.5">
            {HOME_SLIDES.map((_, i) => (
              <Pressable
                key={i}
                onPress={() => setSlide(i)}
                className={`h-1.5 rounded-full ${i === slide ? 'w-5 bg-white' : 'w-1.5 bg-white/40'}`}
              />
            ))}
          </View>
        </View>

        <View className="mx-4 mt-3 flex-row flex-wrap justify-between gap-y-3">
          <WidgetCard icon={Calendar} iconBg="#EEF3FA" iconColor="#1558A8" label="Leave Balance">
            <Text className="text-2xl font-bold text-gray-900">
              {HOME_WIDGETS.leave.used} <Text className="text-sm font-medium text-gray-400">days</Text>
            </Text>
            <Text className="mb-2 mt-0.5 text-[10px] text-gray-400">
              of {HOME_WIDGETS.leave.total} days remaining
            </Text>
            <ProgressBar value={HOME_WIDGETS.leave.used} max={HOME_WIDGETS.leave.total} color="#1558A8" />
          </WidgetCard>

          <WidgetCard icon={Clock} iconBg="#EEF3FA" iconColor="#2176C8" label="Hours / OT">
            <Text className="text-2xl font-bold text-gray-900">
              {HOME_WIDGETS.hours.worked} <Text className="text-sm font-medium text-gray-400">h</Text>
            </Text>
            <Text className="mb-2 mt-0.5 text-[10px] text-gray-400">
              +{HOME_WIDGETS.hours.overtime}h overtime this month
            </Text>
            <ProgressBar value={HOME_WIDGETS.hours.worked} max={HOME_WIDGETS.hours.target} color="#4BA3E6" />
          </WidgetCard>

          <WidgetCard icon={TrendingUp} iconBg="#F0FDF4" iconColor="#16a34a" label="Production KPI">
            <Text className="text-2xl font-bold text-gray-900">
              {HOME_WIDGETS.production.kpi} <Text className="text-sm font-medium text-gray-400">%</Text>
            </Text>
            <View className="mt-0.5 flex-row items-center gap-1">
              <CheckCircle size={9} color="#16a34a" />
              <Text className="text-[10px] text-green-600">Daily output on target</Text>
            </View>
            <View className="mt-1.5 flex-row items-center gap-1">
              <Text className="text-[10px] text-gray-400">Defect rate:</Text>
              <Text className="text-[10px] font-bold text-amber-600">{HOME_WIDGETS.production.defectRate}%</Text>
            </View>
          </WidgetCard>

          <WidgetCard icon={Star} iconBg="#F5F3FF" iconColor="#7c3aed" label="My Performance">
            <Text className="text-2xl font-bold text-gray-900">{HOME_WIDGETS.performance.rating}</Text>
            <Text className="mt-0.5 text-[10px] text-gray-400">Rating this quarter</Text>
            <View className="mt-1.5 flex-row items-center gap-1">
              <Text className="text-[10px] text-gray-400">Attendance:</Text>
              <Text className="text-[10px] font-bold text-green-600">{HOME_WIDGETS.performance.attendance}%</Text>
            </View>
          </WidgetCard>
        </View>

        <View className="mx-4 mt-4">
          <View className="mb-2.5 flex-row items-center justify-between">
            <Text className="text-sm font-bold text-gray-900">Announcements</Text>
            <Pressable>
              <Text className="text-xs font-semibold" style={{ color: '#1558A8' }}>
                View all
              </Text>
            </Pressable>
          </View>
          <View className="gap-2">
            {ANNOUNCEMENTS.map((item, i) => (
              <View
                key={i}
                className={`flex-row items-start gap-3 rounded-xl border px-4 py-3 ${
                  item.urgent ? 'border-red-100 bg-red-50' : 'border-blue-100 bg-blue-50'
                }`}
              >
                <Text className="mt-0.5 text-sm">{item.emoji}</Text>
                <Text
                  className={`flex-1 text-xs font-medium leading-snug ${
                    item.urgent ? 'text-red-700' : 'text-blue-800'
                  }`}
                >
                  {item.text}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View className="mx-4 mt-4">
          <Text className="mb-3 text-sm font-bold text-gray-900">Quick Links</Text>
          <View className="flex-row flex-wrap justify-between gap-y-3">
            {QUICK_LINKS.map((link) => (
              <Pressable
                key={link.label}
                onPress={() => (navigation as any).navigate(link.tab, { screen: link.screen })}
                className="items-center gap-2 rounded-2xl bg-white py-4 shadow-sm"
                style={{ width: '31%' }}
              >
                <View className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: '#EEF3FA' }}>
                  <link.icon size={20} color="#1558A8" />
                </View>
                <Text className="text-center text-[10px] leading-tight text-gray-600">{link.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function WidgetCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  children,
}: {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <View className="rounded-2xl bg-white p-4 shadow-sm" style={{ width: '48%' }}>
      <View className="mb-3 flex-row items-center gap-2">
        <View className="h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: iconBg }}>
          <Icon size={15} color={iconColor} />
        </View>
        <Text className="text-[11px] font-semibold text-gray-500">{label}</Text>
      </View>
      {children}
    </View>
  );
}
