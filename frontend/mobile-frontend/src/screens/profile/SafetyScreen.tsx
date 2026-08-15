import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { ArrowLeft, Phone, ChevronUp, ChevronDown } from 'lucide-react-native';

import { colors } from '@/src/theme/colors';
import { SAFETY_TOPICS, EMERGENCY_CONTACTS } from '@/src/data/safety';

export default function SafetyScreen() {
  const navigation = useNavigation();
  const [expanded, setExpanded] = useState<string | null>(null);

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
          <Text className="text-base font-bold text-gray-900">Safety Regulations</Text>
          <Text className="text-xs text-gray-400">CMC Global Factory</Text>
        </View>
      </View>

      <ScrollView className="flex-1" style={{ backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ marginHorizontal: 16, marginTop: 16, marginBottom: 12, borderRadius: 16, padding: 16, overflow: 'hidden' }}>
          <LinearGradient
            colors={['#991B1B', '#EF4444']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <View className="mb-3 flex-row items-center gap-2">
            <View className="h-7 w-7 items-center justify-center rounded-full bg-white/20">
              <Phone size={13} color="#fff" />
            </View>
            <Text className="text-sm font-bold text-white">Emergency Contacts</Text>
          </View>
          <View className="flex-row flex-wrap gap-y-2">
            {EMERGENCY_CONTACTS.map((c) => (
              <View key={c.label} style={{ width: '50%' }}>
                <Text className="text-[9px] text-red-200">{c.label}</Text>
                <Text className="text-xs font-bold text-white">{c.number}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className="gap-2 px-4">
          {SAFETY_TOPICS.map((topic) => (
            <View key={topic.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <Pressable
                onPress={() => setExpanded(expanded === topic.id ? null : topic.id)}
                className="flex-row items-center gap-3 px-4 py-3.5"
              >
                <View className="h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: topic.bg }}>
                  <topic.icon size={17} color={topic.color} />
                </View>
                <Text className="flex-1 text-sm font-semibold text-gray-900">{topic.title}</Text>
                {expanded === topic.id ? <ChevronUp size={16} color="#9CA3AF" /> : <ChevronDown size={16} color="#9CA3AF" />}
              </Pressable>
              {expanded === topic.id && (
                <View className="border-t border-gray-50 px-4 pb-4">
                  <View className="mt-3 gap-2">
                    {topic.content.map((line, i) => (
                      <View key={i} className="flex-row items-start gap-2">
                        <View className="mt-1.5 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: topic.color }} />
                        <Text className="flex-1 text-xs leading-relaxed text-gray-600">{line}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
