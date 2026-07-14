import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Download, Search, Eye, ChevronRight, Play } from 'lucide-react-native';

import { colors } from '@/src/theme/colors';
import { TRAINING_CATS, TRAINING_DOCS, getFileIcon, type TrainingDoc } from '@/src/data/training';

function DocViewer({ doc, onBack }: { doc: TrainingDoc; onBack: () => void }) {
  const fi = getFileIcon(doc.fileType);
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <View className="flex-row items-center gap-3 border-b border-gray-100 bg-white px-4 pb-3 pt-4">
        <Pressable onPress={onBack} className="h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: colors.surface }}>
          <ArrowLeft size={18} color={colors.primary} />
        </Pressable>
        <View className="flex-1">
          <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
            {doc.title}
          </Text>
          <Text className="text-[10px] text-gray-400">
            {doc.meta} · {doc.date}
          </Text>
        </View>
        <Pressable className="h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: colors.surface }}>
          <Download size={16} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView className="flex-1" style={{ backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="mx-4 mb-3 mt-4 overflow-hidden rounded-2xl shadow-sm" style={{ backgroundColor: doc.fileType === 'video' ? '#1A2740' : 'white' }}>
          {doc.fileType === 'video' ? (
            <View className="h-52 items-center justify-center px-6">
              <View className="mb-3 h-16 w-16 items-center justify-center rounded-full bg-white/20">
                <Play size={28} color="#fff" style={{ marginLeft: 3 }} />
              </View>
              <Text className="text-center text-sm font-semibold text-white">{doc.title}</Text>
              <Text className="mt-1 text-xs text-white/60">{doc.meta}</Text>
            </View>
          ) : (
            <View className="p-5">
              <View className="mb-5 flex-row items-center gap-3 border-b border-gray-100 pb-4">
                <View className="h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: fi.bg }}>
                  <fi.icon size={22} color={fi.color} />
                </View>
                <View>
                  <Text className="text-sm font-bold text-gray-900">{doc.title}</Text>
                  <Text className="mt-0.5 text-xs text-gray-400">
                    {fi.label} · {doc.meta}
                  </Text>
                </View>
              </View>
              <View className="gap-2.5">
                {[1, 0.8, 1, 0.7, 0, 1, 0.85, 1, 0.6, 0, 1, 0.9].map((w, i) => (
                  <View
                    key={i}
                    className={`h-2.5 rounded-full ${w === 0 ? 'mt-2' : ''}`}
                    style={{ width: w ? `${w * 100}%` : 0, backgroundColor: w ? (i < 4 ? colors.border : colors.surface) : 'transparent' }}
                  />
                ))}
              </View>
            </View>
          )}
        </View>

        <View className="mx-4 mb-3 rounded-2xl bg-white p-4 shadow-sm">
          <Text className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Document Info</Text>
          {[
            ['Category', doc.cat],
            ['Type', fi.label],
            [doc.fileType === 'video' ? 'Duration' : 'File Size', doc.meta],
            ['Uploaded', doc.date],
            ['Uploaded by', 'HR Department'],
          ].map(([k, v], i, arr) => (
            <View key={k} className={`flex-row justify-between py-2 ${i < arr.length - 1 ? 'border-b border-gray-50' : ''}`}>
              <Text className="text-xs text-gray-400">{k}</Text>
              <Text className="text-xs font-semibold text-gray-800">{v}</Text>
            </View>
          ))}
        </View>

        <View className="mx-4">
          <Pressable className="flex-row items-center justify-center gap-2 rounded-2xl py-3.5" style={{ backgroundColor: colors.primary }}>
            <Download size={16} color="#fff" />
            <Text className="text-sm font-bold text-white">Download File</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function TrainingScreen() {
  const navigation = useNavigation();
  const [cat, setCat] = useState('All');
  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState<TrainingDoc | null>(null);

  if (viewing) return <DocViewer doc={viewing} onBack={() => setViewing(null)} />;

  const filtered = TRAINING_DOCS.filter(
    (d) => (cat === 'All' || d.cat === cat) && (!search || d.title.toLowerCase().includes(search.toLowerCase())),
  );
  const recent = TRAINING_DOCS.filter((d) => d.recent);

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
          <Text className="text-base font-bold text-gray-900">Training & Documents</Text>
          <Text className="text-xs text-gray-400">{TRAINING_DOCS.length} materials available</Text>
        </View>
      </View>

      <ScrollView className="flex-1" style={{ backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-4 pb-3 pt-4">
          <View className="flex-row items-center gap-2 rounded-xl bg-white px-3 py-2.5 shadow-sm">
            <Search size={15} color="#9CA3AF" />
            <TextInput
              className="flex-1 text-sm text-gray-700"
              placeholder="Search documents..."
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 pb-3" style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 8, alignItems: 'center' }}>
          {TRAINING_CATS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCat(c)}
              className="rounded-full px-3 py-1.5"
              style={
                cat === c ? { backgroundColor: colors.primary } : { backgroundColor: '#fff', borderWidth: 1.5, borderColor: colors.border }
              }
            >
              <Text className="text-xs font-bold" style={{ color: cat === c ? '#fff' : colors.textMuted }}>
                {c}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {!search && cat === 'All' && (
          <View className="mb-3">
            <View className="mb-2.5 flex-row items-center gap-2 px-4">
              <Eye size={13} color={colors.primary} />
              <Text className="text-xs font-bold text-gray-700">Recently Viewed</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4" style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 10, alignItems: 'center' }}>
              {recent.map((doc) => {
                const fi = getFileIcon(doc.fileType);
                return (
                  <Pressable key={doc.id} onPress={() => setViewing(doc)} className="rounded-2xl bg-white p-3 shadow-sm" style={{ width: 128 }}>
                    <View className="mb-2 h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: fi.bg }}>
                      <fi.icon size={16} color={fi.color} />
                    </View>
                    <Text className="text-[11px] font-semibold leading-tight text-gray-800" numberOfLines={2}>
                      {doc.title}
                    </Text>
                    <Text className="mt-1 text-[9px] font-semibold text-gray-400">{fi.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View className="px-4">
          <Text className="mb-2.5 text-xs font-bold text-gray-700">
            {search || cat !== 'All' ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''}` : 'All Materials'}
          </Text>
          {filtered.length === 0 ? (
            <View className="items-center rounded-2xl bg-white p-8 shadow-sm">
              <Search size={28} color="#E5E7EB" />
              <Text className="mt-2 text-sm font-semibold text-gray-400">No documents found</Text>
              <Text className="mt-1 text-xs text-gray-300">Try a different search or category</Text>
            </View>
          ) : (
            <View className="gap-2.5">
              {filtered.map((doc) => {
                const fi = getFileIcon(doc.fileType);
                return (
                  <Pressable key={doc.id} onPress={() => setViewing(doc)} className="flex-row items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
                    <View className="h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: fi.bg }}>
                      <fi.icon size={20} color={fi.color} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
                        {doc.title}
                      </Text>
                      <View className="mt-1 flex-row items-center gap-2">
                        <Text className="rounded px-1.5 py-0.5 text-[9px] font-bold" style={{ backgroundColor: fi.bg, color: fi.color }}>
                          {fi.label}
                        </Text>
                        <Text className="text-[10px] text-gray-400">{doc.meta}</Text>
                        <Text className="text-gray-200">·</Text>
                        <Text className="text-[10px] text-gray-400">{doc.date}</Text>
                      </View>
                    </View>
                    <ChevronRight size={15} color="#D1D5DB" />
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
