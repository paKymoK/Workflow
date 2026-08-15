import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Timer, CheckCircle } from 'lucide-react-native';

import { colors } from '@/src/theme/colors';
import { ProgressBar } from '@/src/components/ProgressBar';
import { StatusBadge } from '@/src/components/StatusBadge';
import { OT_HISTORY } from '@/src/data/overtime';

export default function OvertimeScreen() {
  const navigation = useNavigation();
  const [showForm, setShowForm] = useState(false);
  const [task, setTask] = useState('');
  const [toast, setToast] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(false), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const submit = () => {
    setToast(true);
    setShowForm(false);
    setTask('');
  };

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
          <Text className="text-base font-bold text-gray-900">Overtime Registration</Text>
          <Text className="text-xs text-gray-400">July 2025</Text>
        </View>
        <Pressable
          onPress={() => setShowForm((s) => !s)}
          className="flex-row items-center gap-1.5 rounded-xl px-3 py-2"
          style={{ backgroundColor: colors.primary }}
        >
          <Plus size={13} color="#fff" />
          <Text className="text-xs font-bold text-white">Register OT</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1" style={{ backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="mx-4 mb-3 mt-4 rounded-2xl bg-white p-4 shadow-sm">
          <View className="mb-3 flex-row items-center justify-between">
            <View>
              <Text className="text-[10px] font-semibold text-gray-400">OT Hours This Month</Text>
              <View className="mt-1 flex-row items-end gap-1">
                <Text className="text-2xl font-bold" style={{ color: colors.primary }}>
                  12
                </Text>
                <Text className="mb-0.5 text-sm text-gray-400">/ 40 hours</Text>
              </View>
            </View>
            <View className="h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: colors.surface }}>
              <Timer size={24} color={colors.primary} />
            </View>
          </View>
          <ProgressBar value={12} max={40} color={colors.primary} />
          <Text className="mt-1.5 text-[10px] text-gray-400">28 hours remaining this month</Text>
        </View>

        {toast && (
          <View className="mx-4 mb-3 flex-row items-center gap-2 rounded-xl border border-green-200 bg-green-100 px-4 py-3">
            <CheckCircle size={15} color="#16A34A" />
            <Text className="text-xs font-semibold text-green-700">OT registration submitted for approval!</Text>
          </View>
        )}

        {showForm && (
          <View className="mx-4 mb-3 gap-3 rounded-2xl bg-white p-4 shadow-sm">
            <Text className="text-sm font-bold text-gray-900">Register Overtime</Text>

            <View>
              <Text className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Date</Text>
              <View className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
                <Text className="text-sm text-gray-800">2025-07-10</Text>
              </View>
            </View>

            <View className="flex-row gap-2">
              <View className="flex-1">
                <Text className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Start Time</Text>
                <View className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
                  <Text className="text-sm text-gray-800">16:00</Text>
                </View>
              </View>
              <View className="flex-1">
                <Text className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">End Time</Text>
                <View className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
                  <Text className="text-sm text-gray-800">20:00</Text>
                </View>
              </View>
            </View>

            <View className="flex-row items-center gap-2 rounded-xl px-3 py-2.5" style={{ backgroundColor: colors.surface }}>
              <Timer size={13} color={colors.primary} />
              <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
                Duration: 4 hours
              </Text>
            </View>

            <View>
              <Text className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Task / Reason</Text>
              <TextInput
                multiline
                numberOfLines={2}
                value={task}
                onChangeText={setTask}
                placeholder="Describe the work during OT..."
                placeholderTextColor="#9CA3AF"
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800"
                style={{ textAlignVertical: 'top', minHeight: 56 }}
              />
            </View>

            <View className="flex-row gap-2">
              <Pressable onPress={() => setShowForm(false)} className="flex-1 items-center rounded-xl bg-gray-100 py-3">
                <Text className="text-sm font-semibold text-gray-600">Cancel</Text>
              </Pressable>
              <Pressable onPress={submit} className="flex-1 items-center rounded-xl py-3" style={{ backgroundColor: colors.primary }}>
                <Text className="text-sm font-semibold text-white">Submit</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View className="px-4">
          <Text className="mb-3 text-sm font-bold text-gray-900">Registration History</Text>
          <View className="gap-2.5">
            {OT_HISTORY.map((item, i) => (
              <View key={i} className="rounded-2xl bg-white p-4 shadow-sm">
                <View className="mb-1.5 flex-row items-start justify-between gap-2">
                  <Text className="text-sm font-bold text-gray-900">{item.date}</Text>
                  <StatusBadge status={item.status} />
                </View>
                <Text className="mb-2 text-xs text-gray-600">{item.task}</Text>
                <View className="flex-row items-center gap-3">
                  <Text className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ backgroundColor: colors.surface, color: colors.primary }}>
                    {item.hours}h OT
                  </Text>
                  <Text className="text-[10px] text-gray-400">
                    Approver: <Text className="font-semibold text-gray-600">{item.approver}</Text>
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
