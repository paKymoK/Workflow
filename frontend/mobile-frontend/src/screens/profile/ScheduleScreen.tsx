import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronLeft, ChevronRight, Clock, Package, User, Building } from 'lucide-react-native';

import { colors } from '@/src/theme/colors';
import { SHIFTS, WEEK_DAYS_LABELS, WEEK_DATES_NUMS, WEEK_SCHEDULE } from '@/src/data/schedule';

export default function ScheduleScreen() {
  const navigation = useNavigation();
  const [selected, setSelected] = useState<number | null>(0);
  const [view, setView] = useState<'week' | 'month'>('week');

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
        <View className="flex-1">
          <Text className="text-base font-bold text-gray-900">Work Schedule</Text>
          <Text className="text-xs text-gray-400">July 2025 · Line B</Text>
        </View>
        <View className="flex-row overflow-hidden rounded-xl border border-gray-200">
          {(['week', 'month'] as const).map((v) => (
            <Pressable
              key={v}
              onPress={() => setView(v)}
              className="px-3 py-1.5"
              style={view === v ? styles.viewToggleActive : styles.viewToggleInactive}
            >
              <Text className="text-xs font-semibold capitalize" style={view === v ? styles.viewToggleTextActive : styles.viewToggleTextInactive}>
                {v}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView className="flex-1" style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scheduleScrollContent}>
        <View className="flex-row items-center justify-between px-4 pb-3 pt-4">
          <Pressable className="h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm">
            <ChevronLeft size={17} color="#4B5563" />
          </Pressable>
          <Text className="text-sm font-bold text-gray-900">Jul 7 – Jul 13, 2025</Text>
          <Pressable className="h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm">
            <ChevronRight size={17} color="#4B5563" />
          </Pressable>
        </View>

        <View className="mb-4 gap-2 px-4">
          {WEEK_DAYS_LABELS.map((day, i) => {
            const shift = WEEK_SCHEDULE[i];
            const info = SHIFTS[shift];
            const isToday = i === 0;
            const isSel = selected === i;
            return (
              <Pressable
                key={day}
                onPress={() => setSelected(isSel ? null : i)}
                className="flex-row items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm"
                style={isSel ? styles.dayRowSelected : styles.dayRowUnselected}
              >
                <View className="w-10 items-center">
                  <Text className="text-[10px] font-semibold text-gray-400">{day}</Text>
                  <Text className="text-lg font-bold" style={isToday ? styles.dayNumberToday : styles.dayNumberNormal}>
                    {WEEK_DATES_NUMS[i]}
                  </Text>
                  {isToday && <View className="mt-0.5 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colors.primary }} />}
                </View>
                <View className="flex-1">
                  <Text className="self-start rounded-full px-3 py-1 text-xs font-bold" style={{ backgroundColor: info.bg, color: info.text }}>
                    {info.label}
                  </Text>
                  {shift !== 'off' && <Text className="mt-1 text-[10px] text-gray-400">Line B · Supervisor: Pham Van Hung</Text>}
                </View>
                <Text className="text-[11px] text-gray-400">{info.time}</Text>
              </Pressable>
            );
          })}
        </View>

        {selected !== null && WEEK_SCHEDULE[selected] !== 'off' && (
          <View className="mx-4 mb-4 rounded-2xl bg-white p-4 shadow-sm" style={styles.shiftDetailCard}>
            <Text className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Shift Details — Jul {WEEK_DATES_NUMS[selected]}
            </Text>
            {[
              { icon: Clock, label: 'Start / End', value: '06:00 AM – 03:00 PM' },
              { icon: Package, label: 'Assignment', value: 'Line B — Production Floor 2' },
              { icon: User, label: 'Supervisor', value: 'Pham Van Hung' },
              { icon: Building, label: 'Department', value: 'Production Department' },
            ].map(({ icon: Icon, label, value }, i, arr) => (
              <View key={label} className={`flex-row items-center gap-3 py-2 ${i < arr.length - 1 ? 'border-b border-gray-50' : ''}`}>
                <Icon size={13} color={colors.primary} />
                <Text className="w-20 text-[10px] text-gray-400">{label}</Text>
                <Text className="flex-1 text-xs font-semibold text-gray-800">{value}</Text>
              </View>
            ))}
          </View>
        )}

        <View className="mx-4">
          <Pressable
            className="items-center rounded-2xl border-2 py-3.5"
            style={{ borderColor: colors.primary, backgroundColor: colors.surface }}
          >
            <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
              Request Shift Swap
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  viewToggleActive: {
    backgroundColor: colors.primary,
  },
  viewToggleInactive: {
    backgroundColor: '#fff',
  },
  viewToggleTextActive: {
    color: '#fff',
  },
  viewToggleTextInactive: {
    color: colors.textMuted,
  },
  scheduleScrollContent: {
    paddingBottom: 24,
  },
  dayRowSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  dayRowUnselected: {
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dayNumberToday: {
    color: colors.primary,
  },
  dayNumberNormal: {
    color: '#1F2937',
  },
  shiftDetailCard: {
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
  },
});
