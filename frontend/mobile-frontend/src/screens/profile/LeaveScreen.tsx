import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, ChevronDown, Calendar, Paperclip, CheckCircle, User } from 'lucide-react-native';

import { colors } from '@/src/theme/colors';
import { ProgressBar } from '@/src/components/ProgressBar';
import { StatusBadge } from '@/src/components/StatusBadge';
import { SimpleDatePicker } from '@/src/components/SimpleDatePicker';
import { useAuth } from '@/src/auth/AuthContext';
import {
  fetchLeaveBalances,
  fetchMyLeaveRequests,
  createLeaveRequest,
  type LeaveType,
} from '@/src/api/leaveApi';

const LEAVE_TYPE_OPTIONS: { label: string; value: LeaveType }[] = [
  { label: 'Annual Leave', value: 'ANNUAL' },
  { label: 'Sick Leave', value: 'SICK' },
  { label: 'Personal Leave', value: 'PERSONAL' },
  { label: 'Unpaid Leave', value: 'UNPAID' },
  { label: 'Maternity Leave', value: 'MATERNITY' },
];

const BALANCE_COLORS: Record<LeaveType, string> = {
  ANNUAL: '#1558A8',
  SICK: '#10B981',
  PERSONAL: '#F59E0B',
  UNPAID: '#8B5CF6',
  MATERNITY: '#EC4899',
};

function statusLabel(statusName: string | undefined): 'Approved' | 'Pending' | 'Rejected' {
  if (statusName === 'Leave Approved') return 'Approved';
  if (statusName === 'Rejected') return 'Rejected';
  return 'Pending';
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(start: string, end: string): number {
  const ms = new Date(end + 'T00:00:00').getTime() - new Date(start + 'T00:00:00').getTime();
  return Math.max(1, Math.round(ms / 86400000) + 1);
}

export default function LeaveScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const sub = user?.sub;
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [leaveTypeIndex, setLeaveTypeIndex] = useState(0);
  const [startDate, setStartDate] = useState(todayIso());
  const [endDate, setEndDate] = useState(todayIso());
  const [reason, setReason] = useState('');
  const [toast, setToast] = useState(false);

  const leaveType = LEAVE_TYPE_OPTIONS[leaveTypeIndex];
  const days = useMemo(() => daysBetween(startDate, endDate), [startDate, endDate]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(false), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const { data: balances = [] } = useQuery({
    queryKey: ['leave-balances', sub],
    queryFn: () => fetchLeaveBalances(sub!),
    enabled: !!sub,
  });

  const { data: history = [] } = useQuery({
    queryKey: ['leave-requests', sub],
    queryFn: fetchMyLeaveRequests,
    enabled: !!sub,
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      createLeaveRequest({
        leaveType: leaveType.value,
        startDate,
        endDate,
        days,
        reason: reason || undefined,
      }),
    onSuccess: () => {
      setToast(true);
      setShowForm(false);
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['leave-requests', sub] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances', sub] });
    },
  });

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
          <Text className="text-xs text-gray-400">Annual Year {new Date().getFullYear()}</Text>
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

      <ScrollView className="flex-1" style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scrollContent}>
        <View className="mb-3 flex-row gap-2 px-4 pt-4">
          {balances.map((b) => {
            const color = BALANCE_COLORS[b.leaveType];
            const remaining = b.totalDays - b.usedDays;
            const label = LEAVE_TYPE_OPTIONS.find((t) => t.value === b.leaveType)?.label.replace(' Leave', '') ?? b.leaveType;
            return (
              <View key={b.leaveType} className="flex-1 items-center rounded-2xl bg-white p-3 shadow-sm">
                <Text className="mb-1 text-[10px] font-semibold text-gray-400">{label}</Text>
                <Text className="text-xl font-bold" style={{ color }}>
                  {b.totalDays > 0 ? remaining : b.usedDays}
                </Text>
                <Text className="mt-0.5 text-[9px] text-gray-400">
                  {b.totalDays > 0 ? `of ${b.totalDays} days` : 'day(s) used'}
                </Text>
                {b.totalDays > 0 && (
                  <View className="mt-2 w-full">
                    <ProgressBar value={remaining} max={b.totalDays} color={color} />
                  </View>
                )}
              </View>
            );
          })}
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
                onPress={() => setLeaveTypeIndex((i) => (i + 1) % LEAVE_TYPE_OPTIONS.length)}
                className="flex-row items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
              >
                <Text className="text-sm font-medium text-gray-800">{leaveType.label}</Text>
                <ChevronDown size={14} color="#9CA3AF" />
              </Pressable>
            </View>

            <View className="flex-row gap-2">
              <View className="flex-1">
                <Text className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Start Date</Text>
                <SimpleDatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(d) => {
                    setStartDate(d);
                    if (d > endDate) setEndDate(d);
                  }}
                />
              </View>
              <View className="flex-1">
                <Text className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">End Date</Text>
                <SimpleDatePicker label="End Date" value={endDate} minDate={startDate} onChange={setEndDate} />
              </View>
            </View>

            <View className="flex-row items-center gap-2 rounded-xl px-3 py-2.5" style={{ backgroundColor: colors.surface }}>
              <Calendar size={13} color={colors.primary} />
              <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
                Duration: {days} working day{days > 1 ? 's' : ''}
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
                style={styles.reasonInput}
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
              <Pressable
                onPress={() => submitMutation.mutate()}
                disabled={submitMutation.isPending}
                className="flex-1 items-center rounded-xl py-3"
                style={submitMutation.isPending ? styles.submitButtonPending : styles.submitButtonActive}
              >
                <Text className="text-sm font-semibold text-white">
                  {submitMutation.isPending ? 'Submitting...' : 'Submit'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        <View className="px-4">
          <Text className="mb-3 text-sm font-bold text-gray-900">Request History</Text>
          <View className="gap-2.5">
            {history.map((item) => {
              const latestApproval = item.approvals?.[item.approvals.length - 1];
              const label = LEAVE_TYPE_OPTIONS.find((t) => t.value === item.detail?.leaveType)?.label ?? item.detail?.leaveType;
              return (
                <View key={item.id} className="rounded-2xl bg-white p-4 shadow-sm">
                  <View className="mb-1.5 flex-row items-start justify-between gap-2">
                    <View>
                      <Text className="text-sm font-bold text-gray-900">{label}</Text>
                      <Text className="mt-0.5 text-xs text-gray-500">
                        {item.detail?.startDate} – {item.detail?.endDate} · {item.detail?.days} day{(item.detail?.days ?? 0) > 1 ? 's' : ''}
                      </Text>
                    </View>
                    <StatusBadge status={statusLabel(item.status?.name)} />
                  </View>
                  {latestApproval && (
                    <View className="mt-1 flex-row items-center gap-1.5">
                      <User size={10} color="#9CA3AF" />
                      <Text className="text-[10px] text-gray-400">
                        Approver: <Text className="font-semibold text-gray-600">{latestApproval.approvedBy?.name}</Text>
                      </Text>
                      <Text className="mx-1 text-gray-300">·</Text>
                      <Text className="text-[10px] text-gray-400">#{item.id}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 24,
  },
  reasonInput: {
    textAlignVertical: 'top',
    minHeight: 56,
  },
  submitButtonPending: {
    backgroundColor: colors.primary,
    opacity: 0.6,
  },
  submitButtonActive: {
    backgroundColor: colors.primary,
    opacity: 1,
  },
});
