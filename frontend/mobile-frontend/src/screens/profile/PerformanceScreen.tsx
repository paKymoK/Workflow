import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { LineChart } from 'react-native-gifted-charts';
import { ArrowLeft, Award, TrendingUp, Target, CheckCircle, User, Star } from 'lucide-react-native';

import { colors } from '@/src/theme/colors';
import { RadarChart } from '@/src/components/RadarChart';
import { PERF_TREND, RADAR_DATA, PERF_KPIS, GOALS } from '@/src/data/performance';

const PERIODS = ['Q1 2025', 'Q2 2025', 'Q3 2025'];

export default function PerformanceScreen() {
  const navigation = useNavigation();
  const [period, setPeriod] = useState('Q2 2025');

  const goalsDone = GOALS.filter((g) => g.done).length;

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
          <Text className="text-base font-bold text-gray-900">Performance</Text>
          <Text className="text-xs text-gray-400">Evaluation & KPIs</Text>
        </View>
        <Award size={18} color={colors.primary} />
      </View>

      <ScrollView className="flex-1" style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scrollContent}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 pb-3 pt-4" style={styles.periodScroll} contentContainerStyle={styles.periodScrollContent}>
          {PERIODS.map((p) => (
            <Pressable
              key={p}
              onPress={() => setPeriod(p)}
              className="rounded-full px-4 py-2"
              style={period === p ? styles.periodPillActive : styles.periodPillInactive}
            >
              <Text className="text-xs font-bold" style={period === p ? styles.periodTextActive : styles.periodTextInactive}>
                {p}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.gradientCard}>
          <LinearGradient
            colors={[colors.primaryDark, colors.primary, colors.primaryMid]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientFill}
          />
          <View className="flex-row items-center gap-5 px-5 pb-4 pt-5">
            <View className="items-center">
              <View className="h-20 w-20 items-center justify-center rounded-full border-4 border-white/30 bg-white/15">
                <Text className="text-4xl font-black text-white">A</Text>
              </View>
              <Text className="mt-2 text-[10px] font-semibold tracking-wide text-blue-200">GRADE</Text>
            </View>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-white">
                4.2 <Text className="text-base font-medium text-blue-300">/ 5.0</Text>
              </Text>
              <Text className="mt-0.5 text-sm font-semibold text-blue-100">Excellent Performance</Text>
              <View className="mt-2 flex-row items-center gap-1.5">
                <TrendingUp size={13} color="#86EFAC" />
                <Text className="text-xs font-semibold text-green-300">+6 pts vs last quarter</Text>
              </View>
              <Text className="mt-1.5 text-[10px] text-blue-300">Top 12% of production team</Text>
            </View>
          </View>
          <View className="px-5 pb-4">
            <View className="mb-1.5 flex-row justify-between">
              <Text className="text-[10px] text-blue-300">Score</Text>
              <Text className="text-[10px] text-blue-300">84 / 100</Text>
            </View>
            <View className="h-2 w-full overflow-hidden rounded-full bg-white/20">
              <View className="h-full rounded-full bg-white/80" style={styles.scoreBarFill} />
            </View>
          </View>
        </View>

        <View className="mb-3 px-4">
          <Text className="mb-2.5 text-sm font-bold text-gray-900">KPI Breakdown</Text>
          <View className="flex-row flex-wrap justify-between gap-y-2.5">
            {PERF_KPIS.map((kpi) => {
              const aboveTarget = kpi.up ? kpi.value >= kpi.target : kpi.value <= kpi.target;
              const pct = Math.min(100, (kpi.up ? kpi.value / kpi.target : kpi.target / kpi.value) * 100);
              return (
                <View key={kpi.label} className="rounded-2xl bg-white p-4 shadow-sm" style={styles.kpiCard}>
                  <View className="mb-2 flex-row items-center justify-between">
                    <Text className="flex-1 text-[10px] font-semibold leading-tight text-gray-400">{kpi.label}</Text>
                    <Text
                      className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                      style={aboveTarget ? styles.kpiBadgeAbove : styles.kpiBadgeBelow}
                    >
                      {aboveTarget ? '✓' : '!'}
                    </Text>
                  </View>
                  <Text className="text-2xl font-black" style={{ color: kpi.color }}>
                    {kpi.value}
                    <Text className="text-xs font-semibold text-gray-400">{kpi.unit}</Text>
                  </Text>
                  <Text className="mt-0.5 text-[10px] text-gray-400">
                    Target: {kpi.target}
                    {kpi.unit}
                  </Text>
                  <View className="mt-2 h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: kpi.bg }}>
                    <View className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: kpi.color }} />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View className="mx-4 mb-3 rounded-2xl bg-white p-4 shadow-sm">
          <Text className="mb-1 text-sm font-bold text-gray-900">Score Trend</Text>
          <Text className="mb-3 text-[10px] text-gray-400">Feb – Jul 2025</Text>
          <LineChart
            data={PERF_TREND.map((d) => ({ value: d.score, label: d.month }))}
            height={110}
            color={colors.primary}
            thickness={2.5}
            curved
            dataPointsColor={colors.primary}
            dataPointsRadius={4}
            yAxisTextStyle={styles.chartAxisLabel}
            xAxisLabelTextStyle={styles.chartAxisLabel}
            xAxisColor="#F0F0F0"
            yAxisColor="#F0F0F0"
            rulesColor="#F0F0F0"
            maxValue={100}
            noOfSections={4}
            initialSpacing={12}
            endSpacing={12}
            hideDataPoints={false}
          />
        </View>

        <View className="mx-4 mb-3 items-center rounded-2xl bg-white p-4 shadow-sm">
          <Text className="mb-1 self-start text-sm font-bold text-gray-900">Competency Radar</Text>
          <Text className="mb-2 self-start text-[10px] text-gray-400">Performance across all dimensions</Text>
          <RadarChart data={RADAR_DATA} size={200} />
        </View>

        <View className="mx-4 mb-3 rounded-2xl bg-white p-4 shadow-sm">
          <View className="mb-3 flex-row items-center gap-2">
            <Target size={15} color={colors.primary} />
            <Text className="text-sm font-bold text-gray-900">Q2 Goals</Text>
            <Text className="ml-auto rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
              {goalsDone}/{GOALS.length} done
            </Text>
          </View>
          <View className="gap-2.5">
            {GOALS.map((g, i) => (
              <View key={i} className="flex-row items-start gap-3">
                <View
                  className="mt-0.5 h-5 w-5 items-center justify-center rounded-full"
                  style={g.done ? styles.goalIconDone : styles.goalIconPending}
                >
                  {g.done ? <CheckCircle size={13} color="#16A34A" /> : <View className="h-2 w-2 rounded-full bg-gray-300" />}
                </View>
                <Text
                  className={`flex-1 text-xs leading-snug ${g.done ? 'text-gray-600 line-through' : 'font-medium text-gray-800'}`}
                >
                  {g.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View className="mx-4 rounded-2xl bg-white p-4 shadow-sm">
          <View className="mb-3 flex-row items-center gap-2">
            <User size={14} color={colors.primary} />
            <Text className="text-sm font-bold text-gray-900">Manager Review</Text>
          </View>
          <View className="flex-row items-start gap-3">
            <View className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: colors.primary }}>
              <Text className="text-xs font-bold text-white">PH</Text>
            </View>
            <View className="flex-1">
              <View className="mb-1 flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-gray-900">Pham Van Hung</Text>
                <Text className="text-[10px] text-gray-400">Jun 30, 2025</Text>
              </View>
              <Text className="mb-2 text-[10px] text-gray-400">Production Manager</Text>
              <View className="rounded-xl px-3 py-3" style={styles.reviewQuoteBox}>
                <Text className="text-xs leading-relaxed text-gray-700">
                  &ldquo;Lan consistently exceeds expectations in quality control. Her defect rate is the lowest on Line B this
                  quarter. I&apos;d like to see her take on more mentoring responsibilities in Q3 to develop the newer
                  operators.&rdquo;
                </Text>
              </View>
              <View className="mt-2 flex-row items-center gap-3">
                <Text className="text-[10px] text-gray-400">Overall rating:</Text>
                <View className="flex-row gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={11} fill={s <= 4 ? '#F59E0B' : 'none'} color={s <= 4 ? '#F59E0B' : '#D1D5DB'} />
                  ))}
                </View>
                <Text className="text-[10px] font-bold text-amber-600">4.0 / 5.0</Text>
              </View>
            </View>
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
  periodScroll: {
    flexGrow: 0,
  },
  periodScrollContent: {
    gap: 8,
    alignItems: 'center',
  },
  periodPillActive: {
    backgroundColor: colors.primary,
  },
  periodPillInactive: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  periodTextActive: {
    color: '#fff',
  },
  periodTextInactive: {
    color: colors.textMuted,
  },
  gradientCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scoreBarFill: {
    width: '84%',
  },
  kpiCard: {
    width: '48%',
  },
  kpiBadgeAbove: {
    backgroundColor: '#DCFCE7',
    color: '#15803D',
  },
  kpiBadgeBelow: {
    backgroundColor: '#FEF3C7',
    color: '#B45309',
  },
  chartAxisLabel: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  goalIconDone: {
    backgroundColor: '#DCFCE7',
  },
  goalIconPending: {
    backgroundColor: '#F3F4F6',
  },
  reviewQuoteBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
});
