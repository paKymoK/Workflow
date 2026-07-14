import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { ArrowLeft, ChevronUp, ChevronDown, Download } from 'lucide-react-native';

import { colors } from '@/src/theme/colors';
import { PAYSLIP, PAYSLIP_MONTHS, fmtVND } from '@/src/data/payslip';
import { PROFILE } from '@/src/data/profile';

export default function PayslipScreen() {
  const navigation = useNavigation();
  const [month, setMonth] = useState('Jun');
  const [expanded, setExpanded] = useState(false);
  const data = PAYSLIP[month] ?? PAYSLIP.Jun;

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
          <Text className="text-base font-bold text-gray-900">Payslip</Text>
          <Text className="text-xs text-gray-400">
            {PROFILE.name} · {PROFILE.employeeId}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1" style={{ backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 24 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 pb-3 pt-4" style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 8, alignItems: 'center' }}>
          {PAYSLIP_MONTHS.map((m) => (
            <Pressable
              key={m}
              onPress={() => setMonth(m)}
              className="rounded-full px-4 py-2"
              style={
                month === m
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: '#fff', borderWidth: 1.5, borderColor: colors.border }
              }
            >
              <Text className="text-xs font-bold" style={{ color: month === m ? '#fff' : colors.textMuted }}>
                {m} 2025
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={{ marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 20, overflow: 'hidden' }}>
          <LinearGradient
            colors={[colors.primaryDark, colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <Text className="mb-1 text-xs font-semibold text-blue-200">{month} 2025 · Net Take-Home</Text>
          <Text className="mb-4 text-4xl font-bold text-white">{fmtVND(data.net)}</Text>
          <View className="flex-row items-stretch gap-3 border-t border-white/20 pt-3">
            <View className="flex-1">
              <Text className="mb-0.5 text-[10px] text-blue-300">Gross Income</Text>
              <Text className="text-sm font-bold text-white">{fmtVND(data.gross)}</Text>
            </View>
            <View className="w-px bg-white/20" />
            <View className="flex-1">
              <Text className="mb-0.5 text-[10px] text-blue-300">Total Deductions</Text>
              <Text className="text-sm font-bold text-red-300">{fmtVND(-data.ded)}</Text>
            </View>
          </View>
        </View>

        <View className="mx-4 mb-3 overflow-hidden rounded-2xl bg-white shadow-sm">
          <Pressable onPress={() => setExpanded((e) => !e)} className="flex-row items-center justify-between px-4 py-3.5">
            <Text className="text-sm font-bold text-gray-900">Salary Breakdown</Text>
            {expanded ? <ChevronUp size={18} color="#9CA3AF" /> : <ChevronDown size={18} color="#9CA3AF" />}
          </Pressable>
          {expanded && (
            <View className="border-t border-gray-50 px-4 pb-4">
              <Text className="mb-2 mt-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Earnings</Text>
              {data.items
                .filter((i) => !i.ded)
                .map((item, i, arr) => (
                  <View key={item.label} className={`flex-row justify-between py-2 ${i < arr.length - 1 ? 'border-b border-gray-50' : ''}`}>
                    <Text className="text-xs text-gray-600">{item.label}</Text>
                    <Text className="text-xs font-semibold text-gray-800">{fmtVND(item.amount)}</Text>
                  </View>
                ))}
              <View className="mt-1 flex-row justify-between py-2">
                <Text className="text-xs font-bold text-gray-800">Gross Total</Text>
                <Text className="text-xs font-bold text-gray-800">{fmtVND(data.gross)}</Text>
              </View>
              <Text className="mb-2 mt-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Deductions</Text>
              {data.items
                .filter((i) => i.ded)
                .map((item, i, arr) => (
                  <View key={item.label} className={`flex-row justify-between py-2 ${i < arr.length - 1 ? 'border-b border-gray-50' : ''}`}>
                    <Text className="text-xs text-gray-600">{item.label}</Text>
                    <Text className="text-xs font-semibold text-red-500">{fmtVND(item.amount)}</Text>
                  </View>
                ))}
              <View className="mt-1 flex-row justify-between border-t border-gray-100 py-2.5">
                <Text className="text-xs font-bold text-gray-800">Net Take-Home</Text>
                <Text className="text-sm font-bold" style={{ color: colors.primary }}>
                  {fmtVND(data.net)}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View className="mx-4">
          <Pressable
            className="flex-row items-center justify-center gap-2 rounded-2xl border-2 py-3.5"
            style={{ borderColor: colors.primary, backgroundColor: colors.surface }}
          >
            <Download size={16} color={colors.primary} />
            <Text className="text-sm font-bold" style={{ color: colors.primary }}>
              Download PDF
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
