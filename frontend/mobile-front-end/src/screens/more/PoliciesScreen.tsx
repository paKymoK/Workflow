import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Search, FileText, ChevronUp, ChevronDown, ChevronRight, CheckCircle } from 'lucide-react-native';

import { colors } from '@/src/theme/colors';
import { POLICY_CATS, type PolicyItem } from '@/src/data/policies';

function PolicyDetail({ policy, onBack }: { policy: PolicyItem; onBack: () => void }) {
  const [acked, setAcked] = useState(false);
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <View className="flex-row items-center gap-3 border-b border-gray-100 bg-white px-4 pb-3 pt-4">
        <Pressable onPress={onBack} className="h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: colors.surface }}>
          <ArrowLeft size={18} color={colors.primary} />
        </Pressable>
        <View className="flex-1">
          <Text className="text-sm font-bold leading-tight text-gray-900">{policy.title}</Text>
          <Text className="text-[10px] text-gray-400">Last updated: {policy.updated}</Text>
        </View>
      </View>

      <ScrollView className="flex-1" style={{ backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="mx-4 mb-3 mt-4 rounded-2xl bg-white p-5 shadow-sm">
          {policy.content.split('\n').map((line, i) =>
            line ? (
              <Text
                key={i}
                className={`mb-2 leading-relaxed ${/^\d\./.test(line) ? 'pl-3 text-sm text-gray-600' : 'text-sm font-semibold text-gray-800'}`}
              >
                {line}
              </Text>
            ) : (
              <View key={i} className="h-2" />
            ),
          )}
        </View>
        <View className="mx-4">
          {acked ? (
            <View className="flex-row items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-4">
              <CheckCircle size={20} color="#16A34A" />
              <View>
                <Text className="text-sm font-bold text-green-700">Acknowledged</Text>
                <Text className="text-xs text-green-600">
                  Recorded{' '}
                  {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={() => setAcked(true)}
              className="flex-row items-center justify-center gap-2 rounded-2xl py-4"
              style={{ backgroundColor: colors.primary }}
            >
              <CheckCircle size={17} color="#fff" />
              <Text className="text-sm font-bold text-white">I Have Read This Policy</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function PoliciesScreen() {
  const navigation = useNavigation();
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>('hr');
  const [selected, setSelected] = useState<PolicyItem | null>(null);

  if (selected) return <PolicyDetail policy={selected} onBack={() => setSelected(null)} />;

  const filtered = POLICY_CATS.map((cat) => ({
    ...cat,
    policies: cat.policies.filter((p) => !search || p.title.toLowerCase().includes(search.toLowerCase())),
  })).filter((cat) => cat.policies.length > 0);

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
          <Text className="text-base font-bold text-gray-900">Company Policies</Text>
          <Text className="text-xs text-gray-400">CMC Global 2025</Text>
        </View>
      </View>

      <ScrollView className="flex-1" style={{ backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-4 pb-3 pt-4">
          <View className="flex-row items-center gap-2 rounded-xl bg-white px-3 py-2.5 shadow-sm">
            <Search size={15} color="#9CA3AF" />
            <TextInput
              className="flex-1 text-sm text-gray-700"
              placeholder="Search policies..."
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        <View className="gap-2 px-4">
          {filtered.map((cat) => (
            <View key={cat.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <Pressable
                onPress={() => setExpanded(expanded === cat.id ? null : cat.id)}
                className="flex-row items-center gap-3 px-4 py-3.5"
              >
                <View className="h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: colors.surface }}>
                  <FileText size={15} color={colors.primary} />
                </View>
                <Text className="flex-1 text-sm font-bold text-gray-900">{cat.title}</Text>
                <Text className="mr-1 text-[10px] text-gray-400">{cat.policies.length}</Text>
                {expanded === cat.id ? <ChevronUp size={16} color="#9CA3AF" /> : <ChevronDown size={16} color="#9CA3AF" />}
              </Pressable>
              {expanded === cat.id && (
                <View className="border-t border-gray-50">
                  {cat.policies.map((policy, i, arr) => (
                    <Pressable
                      key={policy.id}
                      onPress={() => setSelected(policy)}
                      className={`flex-row items-start gap-3 px-4 py-3 ${i < arr.length - 1 ? 'border-b border-gray-50' : ''}`}
                    >
                      <View className="mt-2.5 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colors.primary }} />
                      <View className="flex-1">
                        <Text className="text-sm font-medium text-gray-800">{policy.title}</Text>
                        <Text className="mt-0.5 text-[10px] text-gray-400">Updated: {policy.updated}</Text>
                      </View>
                      <ChevronRight size={14} color="#D1D5DB" style={{ marginTop: 4 }} />
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
