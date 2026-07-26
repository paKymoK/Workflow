import { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Download, Search, ChevronRight, Play, Layers, FileText, CheckCircle, Sparkles } from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Video from 'react-native-video';

import { colors } from '@/src/theme/colors';
import { fetchTrainingMaterials, completeTrainingMaterial, type TrainingMaterial, type TrainingFormat } from '@/src/api/trainingApi';
import { getVideoStreamUrl } from '@/src/api/mediaApi';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatBytes(bytes: number | null): string {
  if (bytes == null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFormatMeta(format: TrainingFormat) {
  if (format === 'VIDEO') return { icon: Play, color: '#EF4444', bg: '#FEF2F2', label: 'VIDEO' };
  if (format === 'SLIDES') return { icon: Layers, color: '#8B5CF6', bg: '#F5F3FF', label: 'SLIDES' };
  return { icon: FileText, color: '#1558A8', bg: '#EEF3FA', label: 'PDF' };
}

function MaterialDetail({ material, onBack }: { material: TrainingMaterial; onBack: () => void }) {
  const queryClient = useQueryClient();
  const fm = getFormatMeta(material.format);
  const meta = material.format === 'VIDEO' ? (material.duration ?? '—') : formatBytes(material.fileSize);

  const completeMutation = useMutation({
    mutationFn: () => completeTrainingMaterial(material.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['training-materials'] }),
    onError: () => Alert.alert('Could not record completion', 'Please try again.'),
  });

  const openFile = () => {
    if (material.fileUrl) Linking.openURL(material.fileUrl).catch(() => Alert.alert('Could not open file'));
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <View className="flex-row items-center gap-3 border-b border-gray-100 bg-white px-4 pb-3 pt-4">
        <Pressable onPress={onBack} className="h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: colors.surface }}>
          <ArrowLeft size={18} color={colors.primary} />
        </Pressable>
        <View className="flex-1">
          <Text className="text-sm font-bold leading-tight text-gray-900" numberOfLines={1}>
            {material.title}
          </Text>
          <Text className="text-[10px] text-gray-400">
            {meta} · {formatDate(material.createdAt)}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1" style={{ backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 24 }}>
        {material.format === 'VIDEO' && material.videoId ? (
          <View className="mx-4 mb-3 mt-4 overflow-hidden rounded-2xl bg-black shadow-sm">
            <Video
              source={{ uri: getVideoStreamUrl(material.videoId) }}
              style={{ height: 208, width: '100%' }}
              controls
              resizeMode="contain"
              paused={false}
            />
          </View>
        ) : (
          <View className="mx-4 mb-3 mt-4">
            <Pressable onPress={openFile} className="flex-row items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
              <View className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: fm.bg }}>
                <Download size={17} color={fm.color} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-800">{material.fileName ?? 'Open file'}</Text>
                <Text className="text-[10px] text-gray-400">Tap to open</Text>
              </View>
            </Pressable>
          </View>
        )}

        <View className="mx-4 mb-3 rounded-2xl bg-white p-4 shadow-sm">
          <Text className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Material Info</Text>
          {[
            ['Category', material.category],
            ['Format', fm.label],
            [material.format === 'VIDEO' ? 'Duration' : 'File Size', meta],
            ['Uploaded', formatDate(material.createdAt)],
          ].map(([k, v], i, arr) => (
            <View key={k} className={`flex-row justify-between py-2 ${i < arr.length - 1 ? 'border-b border-gray-50' : ''}`}>
              <Text className="text-xs text-gray-400">{k}</Text>
              <Text className="text-xs font-semibold text-gray-800">{v}</Text>
            </View>
          ))}
        </View>

        <View className="mx-4">
          {material.completedByMe ? (
            <View className="flex-row items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-4">
              <CheckCircle size={20} color="#16A34A" />
              <View>
                <Text className="text-sm font-bold text-green-700">Completed</Text>
                <Text className="text-xs text-green-600">You've completed this training</Text>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={() => completeMutation.mutate()}
              disabled={completeMutation.isPending}
              className="flex-row items-center justify-center gap-2 rounded-2xl py-4"
              style={{ backgroundColor: colors.primary, opacity: completeMutation.isPending ? 0.6 : 1 }}
            >
              {completeMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <CheckCircle size={17} color="#fff" />
                  <Text className="text-sm font-bold text-white">Mark as Complete</Text>
                </>
              )}
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function TrainingScreen() {
  const navigation = useNavigation();
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ['training-materials'],
    queryFn: () => fetchTrainingMaterials(),
  });

  const categories = useMemo(() => ['All', ...Array.from(new Set(materials.map((m) => m.category)))], [materials]);

  const filtered = materials.filter(
    (m) => (category === 'All' || m.category === category) && (!search || m.title.toLowerCase().includes(search.toLowerCase())),
  );

  const recentlyAdded = useMemo(
    () => [...materials].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 5),
    [materials],
  );

  const selectedMaterial = selectedId != null ? (materials.find((m) => m.id === selectedId) ?? null) : null;
  if (selectedMaterial) return <MaterialDetail material={selectedMaterial} onBack={() => setSelectedId(null)} />;

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
          <Text className="text-xs text-gray-400">{materials.length} materials available</Text>
        </View>
      </View>

      <ScrollView className="flex-1" style={{ backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-4 pb-3 pt-4">
          <View className="flex-row items-center gap-2 rounded-xl bg-white px-3 py-2.5 shadow-sm">
            <Search size={15} color="#9CA3AF" />
            <TextInput
              className="flex-1 text-sm text-gray-700"
              placeholder="Search training materials..."
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 pb-3" style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 8, alignItems: 'center' }}>
          {categories.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCategory(c)}
              className="rounded-full px-3 py-1.5"
              style={
                category === c ? { backgroundColor: colors.primary } : { backgroundColor: '#fff', borderWidth: 1.5, borderColor: colors.border }
              }
            >
              <Text className="text-xs font-bold" style={{ color: category === c ? '#fff' : colors.textMuted }}>
                {c}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {isLoading ? (
          <View className="items-center py-10">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <>
            {!search && category === 'All' && recentlyAdded.length > 0 && (
              <View className="mb-3">
                <View className="mb-2.5 flex-row items-center gap-2 px-4">
                  <Sparkles size={13} color={colors.primary} />
                  <Text className="text-xs font-bold text-gray-700">Recently Added</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4" style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 10, alignItems: 'center' }}>
                  {recentlyAdded.map((material) => {
                    const fm = getFormatMeta(material.format);
                    return (
                      <Pressable key={material.id} onPress={() => setSelectedId(material.id)} className="rounded-2xl bg-white p-3 shadow-sm" style={{ width: 128 }}>
                        <View className="mb-2 h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: fm.bg }}>
                          <fm.icon size={16} color={fm.color} />
                        </View>
                        <Text className="text-[11px] font-semibold leading-tight text-gray-800" numberOfLines={2}>
                          {material.title}
                        </Text>
                        <Text className="mt-1 text-[9px] font-semibold text-gray-400">{fm.label}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            <View className="px-4">
              <Text className="mb-2.5 text-xs font-bold text-gray-700">
                {search || category !== 'All' ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''}` : 'All Materials'}
              </Text>
              {filtered.length === 0 ? (
                <View className="items-center rounded-2xl bg-white p-8 shadow-sm">
                  <Search size={28} color="#E5E7EB" />
                  <Text className="mt-2 text-sm font-semibold text-gray-400">No materials found</Text>
                  <Text className="mt-1 text-xs text-gray-300">Try a different search or category</Text>
                </View>
              ) : (
                <View className="gap-2.5">
                  {filtered.map((material) => {
                    const fm = getFormatMeta(material.format);
                    const meta = material.format === 'VIDEO' ? (material.duration ?? '—') : formatBytes(material.fileSize);
                    return (
                      <Pressable key={material.id} onPress={() => setSelectedId(material.id)} className="flex-row items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
                        <View className="h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: fm.bg }}>
                          <fm.icon size={20} color={fm.color} />
                        </View>
                        <View className="flex-1">
                          <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
                            {material.title}
                          </Text>
                          <View className="mt-1 flex-row items-center gap-2">
                            <Text className="rounded px-1.5 py-0.5 text-[9px] font-bold" style={{ backgroundColor: fm.bg, color: fm.color }}>
                              {fm.label}
                            </Text>
                            <Text className="text-[10px] text-gray-400">{meta}</Text>
                            <Text className="text-gray-200">·</Text>
                            <Text className="text-[10px] text-gray-400">{formatDate(material.createdAt)}</Text>
                            {material.completedByMe && <CheckCircle size={11} color="#16A34A" />}
                          </View>
                        </View>
                        <ChevronRight size={15} color="#D1D5DB" />
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
