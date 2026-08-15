import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Star, Clock, Calendar, CheckCircle, ChevronUp, ChevronDown } from 'lucide-react-native';

import { colors } from '@/src/theme/colors';
import { statusColors } from '@/src/theme/colors';
import { ACTIVE_SURVEYS, PAST_SURVEYS, SURVEY_QS, RATING_LABELS, type SurveyItem } from '@/src/data/survey';

function SurveyForm({ survey, onBack }: { survey: SurveyItem; onBack: () => void }) {
  const [step, setStep] = useState(0);
  const [rating, setRating] = useState(0);
  const [mc, setMc] = useState('');
  const [text, setText] = useState('');
  const [done, setDone] = useState(false);
  const q = SURVEY_QS[step];
  const total = SURVEY_QS.length;

  if (done) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-white">
        <View className="flex-row items-center gap-3 border-b border-gray-100 bg-white px-4 pb-3 pt-4">
          <Pressable onPress={onBack} className="h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: colors.surface }}>
            <ArrowLeft size={18} color={colors.primary} />
          </Pressable>
          <Text className="text-base font-bold text-gray-900">Survey Complete</Text>
        </View>
        <View className="flex-1 items-center justify-center px-8 pb-12" style={{ backgroundColor: colors.background }}>
          <View className="mb-5 h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle size={36} color="#22C55E" />
          </View>
          <Text className="mb-2 text-xl font-bold text-gray-900">Thank You!</Text>
          <Text className="mb-8 max-w-[260px] text-center text-sm leading-relaxed text-gray-500">
            Your responses have been submitted and will help us create a better workplace for everyone at CMC Global.
          </Text>
          <Pressable onPress={onBack} className="rounded-2xl px-8 py-3.5" style={{ backgroundColor: colors.primary }}>
            <Text className="text-sm font-bold text-white">Back to Surveys</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <View className="flex-row items-center gap-3 border-b border-gray-100 bg-white px-4 pb-3 pt-4">
        <Pressable onPress={onBack} className="h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: colors.surface }}>
          <ArrowLeft size={18} color={colors.primary} />
        </Pressable>
        <View className="flex-1">
          <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
            {survey.title}
          </Text>
          <Text className="text-[10px] text-gray-400">
            Question {step + 1} of {total}
          </Text>
        </View>
      </View>
      <View className="h-1.5 bg-gray-100">
        <View className="h-full rounded-full" style={{ width: `${((step + 1) / total) * 100}%`, backgroundColor: colors.primary }} />
      </View>

      <ScrollView className="flex-1 px-4 pb-4 pt-6" style={{ backgroundColor: colors.background }}>
        <View className="rounded-2xl bg-white p-5 shadow-sm">
          <Text className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Question {step + 1}</Text>
          <Text className="mb-6 text-base font-bold leading-snug text-gray-900">{q.q}</Text>

          {q.type === 'rating' && (
            <View>
              <View className="mb-4 flex-row justify-center gap-4">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Pressable key={s} onPress={() => setRating(s)} className="items-center gap-1.5">
                    <Star size={34} fill={s <= rating ? '#F59E0B' : 'none'} color={s <= rating ? '#F59E0B' : '#D1D5DB'} />
                    <Text className="text-[10px] font-semibold text-gray-400">{s}</Text>
                  </Pressable>
                ))}
              </View>
              {rating > 0 && (
                <Text className="text-center text-sm font-bold" style={{ color: colors.primary }}>
                  {RATING_LABELS[rating]}
                </Text>
              )}
            </View>
          )}

          {q.type === 'mc' && (
            <View className="gap-2.5">
              {q.opts.map((opt) => (
                <Pressable
                  key={opt}
                  onPress={() => setMc(opt)}
                  className="flex-row items-center gap-3 rounded-xl border-2 p-4"
                  style={mc === opt ? { borderColor: colors.primary, backgroundColor: colors.surface } : { borderColor: colors.border, backgroundColor: '#F8FAFC' }}
                >
                  <View
                    className="h-5 w-5 items-center justify-center rounded-full border-2"
                    style={{ borderColor: mc === opt ? '#2563EB' : '#D1D5DB' }}
                  >
                    {mc === opt && <View className="h-2.5 w-2.5 rounded-full bg-blue-600" />}
                  </View>
                  <Text className={`text-sm ${mc === opt ? 'font-semibold text-blue-800' : 'text-gray-700'}`}>{opt}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {q.type === 'text' && (
            <TextInput
              multiline
              numberOfLines={5}
              value={text}
              onChangeText={setText}
              placeholder="Type your answer here..."
              placeholderTextColor="#9CA3AF"
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-relaxed text-gray-800"
              style={{ textAlignVertical: 'top', minHeight: 120 }}
            />
          )}
        </View>
      </ScrollView>

      <View className="flex-row gap-2 border-t border-gray-100 bg-white px-4 py-3">
        {step > 0 && (
          <Pressable onPress={() => setStep((s) => s - 1)} className="flex-1 items-center rounded-2xl bg-gray-100 py-3.5">
            <Text className="text-sm font-semibold text-gray-600">Previous</Text>
          </Pressable>
        )}
        {step < total - 1 ? (
          <Pressable onPress={() => setStep((s) => s + 1)} className="flex-1 items-center rounded-2xl py-3.5" style={{ backgroundColor: colors.primary }}>
            <Text className="text-sm font-bold text-white">Next</Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => setDone(true)} className="flex-1 items-center rounded-2xl py-3.5" style={{ backgroundColor: '#10B981' }}>
            <Text className="text-sm font-bold text-white">Submit Survey</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

export default function SurveyScreen() {
  const navigation = useNavigation();
  const [selected, setSelected] = useState<SurveyItem | null>(null);
  const [showPast, setShowPast] = useState(false);

  if (selected) return <SurveyForm survey={selected} onBack={() => setSelected(null)} />;

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
          <Text className="text-base font-bold text-gray-900">Internal Surveys</Text>
          <Text className="text-xs text-gray-400">
            {ACTIVE_SURVEYS.length} active · {PAST_SURVEYS.length} completed
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1" style={{ backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="gap-3 px-4 pt-4">
          <Text className="text-xs font-bold uppercase tracking-widest text-gray-500">Active</Text>
          {ACTIVE_SURVEYS.map((s) => {
            const ss = statusColors[s.status];
            return (
              <Pressable key={s.id} onPress={() => setSelected(s)} className="rounded-2xl bg-white p-4 shadow-sm">
                <View className="mb-2 flex-row items-start justify-between gap-2">
                  <Text className="flex-1 text-sm font-bold leading-snug text-gray-900">{s.title}</Text>
                  <Text className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ backgroundColor: ss.bg, color: ss.text }}>
                    {s.status}
                  </Text>
                </View>
                <Text className="mb-3 text-xs text-gray-500">{s.desc}</Text>
                <View className="flex-row items-center gap-3">
                  <View className="flex-row items-center gap-1">
                    <Clock size={11} color="#9CA3AF" />
                    <Text className="text-[10px] text-gray-400">{s.duration}</Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Calendar size={11} color="#9CA3AF" />
                    <Text className="text-[10px] text-gray-400">Due {s.deadline}</Text>
                  </View>
                  <View className="flex-1" />
                  <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
                    {s.status === 'In Progress' ? 'Continue →' : 'Start →'}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View className="mt-4 px-4">
          <Pressable
            onPress={() => setShowPast((v) => !v)}
            className="flex-row items-center justify-between rounded-2xl bg-white p-4 shadow-sm"
          >
            <View>
              <Text className="text-sm font-bold text-gray-900">Past Surveys</Text>
              <Text className="text-xs text-gray-400">{PAST_SURVEYS.length} completed</Text>
            </View>
            {showPast ? <ChevronUp size={18} color="#9CA3AF" /> : <ChevronDown size={18} color="#9CA3AF" />}
          </Pressable>
          {showPast && (
            <View className="mt-2 gap-2">
              {PAST_SURVEYS.map((s) => (
                <View key={s.id} className="flex-row items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle size={15} color="#16A34A" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-800" numberOfLines={1}>
                      {s.title}
                    </Text>
                    <Text className="text-[10px] text-gray-400">Completed · {s.deadline}</Text>
                  </View>
                  <Text className="rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-bold text-green-700">Done</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
