import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, ChevronDown, Calendar, Paperclip, CheckCircle, User } from 'lucide-react-native';

import { colors } from '@/src/theme/colors';
import { ProgressBar } from '@/src/components/ProgressBar';
import { StatusBadge } from '@/src/components/StatusBadge';
import { LEAVE_BALANCES, LEAVE_HISTORY } from '@/src/data/profile';

const LEAVE_TYPES = ['Annual Leave', 'Sick Leave', 'Personal Leave', 'Unpaid Leave', 'Maternity Leave'];

export default function LeaveScreen() {
  const navigation = useNavigation();
  const [showForm, setShowForm] = useState(false);
  const [leaveType, setLeaveType] = useState(LEAVE_TYPES[0]);
  const [reason, setReason] = useState('');
  const [toast, setToast] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(false), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const submit = () => {
    setToast(true);
    setShowForm(false);
    setReason('');
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
          <Text className="text-base font-bold text-gray-900">Leave Request</Text>
          <Text className="text-xs text-gray-400">Annual Year 2025</Text>
        </View>
        <Pressable
          onPress={() => setShowForm((s) => !s)}
          className="flex-row items-center gap-1.5 rounded-xl px-3 py-2"
          style={{ backgroundColor: colors.primary }}
        >
          <Plus size={13} color="#fff" />
          <Text className="text-xs font-bold text-white">New Request</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1" style={{ backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="mb-3 flex-row gap-2 px-4 pt-4">
          {LEAVE_BALANCES.map((b) => (
            <View key={b.label} className="flex-1 items-center rounded-2xl bg-white p-3 shadow-sm">
              <Text className="mb-1 text-[10px] font-semibold text-gray-400">{b.label}</Text>
              <Text className="text-xl font-bold" style={{ color: b.color }}>
                {b.rem ?? b.used}
              </Text>
              <Text className="mt-0.5 text-[9px] text-gray-400">{b.total ? `of ${b.total} days` : 'day(s) used'}</Text>
              {b.total !== null && b.rem !== null && (
                <View className="mt-2 w-full">
                  <ProgressBar value={b.rem} max={b.total} color={b.color} />
                </View>
              )}
            </View>
          ))}
        </View>

        {toast && (
          <View className="mx-4 mb-3 flex-row items-center gap-2 rounded-xl border border-green-200 bg-green-100 px-4 py-3">
            <CheckCircle size={15} color="#16A34A" />
            <Text className="text-xs font-semibold text-green-700">Leave request submitted for approval!</Text>
          </View>
        )}

        {showForm && (
          <View className="mx-4 mb-3 gap-3 rounded-2xl bg-white p-4 shadow-sm">
            <Text className="text-sm font-bold text-gray-900">New Leave Request</Text>

            <View>
              <Text className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Leave Type</Text>
              <Pressable
                onPress={() => setLeaveType((t) => LEAVE_TYPES[(LEAVE_TYPES.indexOf(t) + 1) % LEAVE_TYPES.length])}
                className="flex-row items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
              >
                <Text className="text-sm font-medium text-gray-800">{leaveType}</Text>
                <ChevronDown size={14} color="#9CA3AF" />
              </Pressable>
            </View>

            <View className="flex-row gap-2">
              <View className="flex-1">
                <Text className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Start Date</Text>
                <View className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
                  <Text className="text-sm text-gray-800">2025-07-15</Text>
                </View>
              </View>
              <View className="flex-1">
                <Text className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">End Date</Text>
                <View className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
                  <Text className="text-sm text-gray-800">2025-07-17</Text>
                </View>
              </View>
            </View>

            <View className="flex-row items-center gap-2 rounded-xl px-3 py-2.5" style={{ backgroundColor: colors.surface }}>
              <Calendar size={13} color={colors.primary} />
              <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
                Duration: 3 working days
              </Text>
            </View>

            <View>
              <Text className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Reason</Text>
              <TextInput
                multiline
                numberOfLines={2}
                value={reason}
                onChangeText={setReason}
                placeholder="Brief reason for leave..."
                placeholderTextColor="#9CA3AF"
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800"
                style={{ textAlignVertical: 'top', minHeight: 56 }}
              />
            </View>

            <View className="flex-row items-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-3">
              <Paperclip size={14} color="#9CA3AF" />
              <Text className="text-xs text-gray-400">Attach supporting document (optional)</Text>
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
          <Text className="mb-3 text-sm font-bold text-gray-900">Request History</Text>
          <View className="gap-2.5">
            {LEAVE_HISTORY.map((item) => (
              <View key={item.id} className="rounded-2xl bg-white p-4 shadow-sm">
                <View className="mb-1.5 flex-row items-start justify-between gap-2">
                  <View>
                    <Text className="text-sm font-bold text-gray-900">{item.type}</Text>
                    <Text className="mt-0.5 text-xs text-gray-500">
                      {item.range} · {item.days} day{item.days > 1 ? 's' : ''}
                    </Text>
                  </View>
                  <StatusBadge status={item.status} />
                </View>
                <View className="mt-1 flex-row items-center gap-1.5">
                  <User size={10} color="#9CA3AF" />
                  <Text className="text-[10px] text-gray-400">
                    Approver: <Text className="font-semibold text-gray-600">{item.approver}</Text>
                  </Text>
                  <Text className="mx-1 text-gray-300">·</Text>
                  <Text className="text-[10px] text-gray-400">{item.id}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
