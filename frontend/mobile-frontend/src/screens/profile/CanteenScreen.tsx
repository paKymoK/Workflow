import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, AlertTriangle, Utensils, CheckCircle } from 'lucide-react-native';

import { colors } from '@/src/theme/colors';
import { CANTEEN_DAYS, TODAYS_MENU } from '@/src/data/canteen';

type MealKey = 'b' | 'l' | 'd';
type DayBooking = Record<MealKey, boolean>;

const MEAL_COLUMNS: { key: MealKey; label: string }[] = [
  { key: 'b', label: 'Brkfst' },
  { key: 'l', label: 'Lunch' },
  { key: 'd', label: 'Dinner' },
];

export default function CanteenScreen() {
  const navigation = useNavigation();
  const [bookings, setBookings] = useState<Record<string, DayBooking>>(
    Object.fromEntries(CANTEEN_DAYS.map((d) => [d, { b: false, l: true, d: false }])),
  );
  const [confirmed, setConfirmed] = useState(false);

  const toggle = (day: string, meal: MealKey) => {
    setBookings((prev) => ({ ...prev, [day]: { ...prev[day], [meal]: !prev[day][meal] } }));
    setConfirmed(false);
  };

  const total = Object.values(bookings).reduce((acc, v) => acc + Number(v.b) + Number(v.l) + Number(v.d), 0);

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
          <Text className="text-base font-bold text-gray-900">Canteen Booking</Text>
          <Text className="text-xs text-gray-400">Week of Jul 7, 2025</Text>
        </View>
      </View>

      <ScrollView className="flex-1" style={{ backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="mx-4 mb-3 mt-4 flex-row items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
          <AlertTriangle size={14} color="#F59E0B" style={{ marginTop: 2 }} />
          <Text className="flex-1 text-xs font-medium leading-snug text-amber-700">
            Book meals by <Text className="font-bold">8:00 PM the day before</Text>. Late bookings subject to availability.
          </Text>
        </View>

        <View className="mx-4 mb-3 rounded-2xl bg-white p-4 shadow-sm">
          <View className="mb-3 flex-row items-center gap-2">
            <Utensils size={14} color={colors.primary} />
            <Text className="text-sm font-bold text-gray-900">Today's Menu · Mon Jul 7</Text>
          </View>
          {TODAYS_MENU.map((item, i, arr) => (
            <View key={item.meal} className={`rounded-xl px-3 py-2.5 ${i < arr.length - 1 ? 'mb-2' : ''}`} style={{ backgroundColor: '#F8FAFC' }}>
              <Text className="text-[10px] font-semibold text-gray-400">{item.meal}</Text>
              <Text className="mt-0.5 text-xs text-gray-700">{item.menu}</Text>
            </View>
          ))}
        </View>

        <View className="mx-4 mb-3 overflow-hidden rounded-2xl bg-white shadow-sm">
          <View className="flex-row items-center border-b border-gray-50 px-4 py-2.5">
            <Text className="flex-1 text-[10px] font-bold uppercase tracking-wide text-gray-400">Day</Text>
            {MEAL_COLUMNS.map((col) => (
              <Text key={col.key} className="w-14 text-center text-[10px] font-bold text-gray-400">
                {col.label}
              </Text>
            ))}
          </View>
          {CANTEEN_DAYS.map((day, i, arr) => (
            <View key={day} className={`flex-row items-center px-4 py-3 ${i < arr.length - 1 ? 'border-b border-gray-50' : ''}`}>
              <Text className="flex-1 text-xs font-semibold text-gray-800">{day.split(' ').slice(0, 2).join(' ')}</Text>
              {MEAL_COLUMNS.map((col) => {
                const active = bookings[day][col.key];
                return (
                  <View key={col.key} className="w-14 items-center">
                    <Pressable
                      onPress={() => toggle(day, col.key)}
                      className="h-8 w-8 items-center justify-center rounded-full"
                      style={{ borderWidth: 2, backgroundColor: active ? colors.primary : '#fff', borderColor: active ? colors.primary : '#D1D5DB' }}
                    >
                      {active && <CheckCircle size={14} color="#fff" />}
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {confirmed && (
          <View className="mx-4 mb-3 flex-row items-center gap-2 rounded-xl border border-green-200 bg-green-100 px-4 py-3">
            <CheckCircle size={15} color="#16A34A" />
            <Text className="text-xs font-semibold text-green-700">
              {total} meal{total !== 1 ? 's' : ''} confirmed for this week!
            </Text>
          </View>
        )}

        <View className="mx-4">
          <Pressable onPress={() => setConfirmed(true)} className="items-center rounded-2xl py-4" style={{ backgroundColor: colors.primary }}>
            <Text className="text-sm font-bold text-white">
              Confirm Booking ({total} meal{total !== 1 ? 's' : ''})
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
