import { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  Search,
  FileText,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Download,
} from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { colors } from '@/src/theme/colors';
import { fetchDocuments, acknowledgeDocument, type DocumentPost } from '@/src/api/documentsApi';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function DocumentDetail({ doc, onBack }: { doc: DocumentPost; onBack: () => void }) {
  const queryClient = useQueryClient();

  const ackMutation = useMutation({
    mutationFn: () => acknowledgeDocument(doc.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
    onError: () => Alert.alert('Could not record acknowledgment', 'Please try again.'),
  });

  const openFile = () => {
    if (doc.fileUrl) Linking.openURL(doc.fileUrl).catch(() => Alert.alert('Could not open file'));
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <View className="flex-row items-center gap-3 border-b border-gray-100 bg-white px-4 pb-3 pt-4">
        <Pressable onPress={onBack} className="h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: colors.surface }}>
          <ArrowLeft size={18} color={colors.primary} />
        </Pressable>
        <View className="flex-1">
          <Text className="text-sm font-bold leading-tight text-gray-900">{doc.title}</Text>
          <Text className="text-[10px] text-gray-400">Last updated: {formatDate(doc.modifiedAt ?? doc.createdAt)}</Text>
        </View>
      </View>

      <ScrollView className="flex-1" style={{ backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 24 }}>
        {doc.fileUrl && (
          <View className="mx-4 mb-3 mt-4">
            <Pressable
              onPress={openFile}
              className="flex-row items-center gap-3 rounded-2xl bg-white p-4 shadow-sm"
            >
              <View className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: colors.surface }}>
                <Download size={17} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-800">{doc.fileName ?? 'Open document'}</Text>
                <Text className="text-[10px] text-gray-400">Tap to open</Text>
              </View>
            </Pressable>
          </View>
        )}

        {doc.content && (
          <View className="mx-4 mb-3 mt-4 rounded-2xl bg-white p-5 shadow-sm">
            {doc.content.split('\n').map((line, i) =>
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
        )}

        <View className="mx-4">
          {doc.acknowledgedByMe ? (
            <View className="flex-row items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-4">
              <CheckCircle size={20} color="#16A34A" />
              <View>
                <Text className="text-sm font-bold text-green-700">Acknowledged</Text>
                <Text className="text-xs text-green-600">You've confirmed you've read this policy</Text>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={() => ackMutation.mutate()}
              disabled={ackMutation.isPending}
              className="flex-row items-center justify-center gap-2 rounded-2xl py-4"
              style={{ backgroundColor: colors.primary, opacity: ackMutation.isPending ? 0.6 : 1 }}
            >
              {ackMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <CheckCircle size={17} color="#fff" />
                  <Text className="text-sm font-bold text-white">I Have Read This Policy</Text>
                </>
              )}
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
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => fetchDocuments(),
  });

  const selectedDoc = selectedId != null ? (documents.find((d) => d.id === selectedId) ?? null) : null;

  const categories = useMemo(() => {
    const byCategory = new Map<string, DocumentPost[]>();
    for (const doc of documents) {
      const list = byCategory.get(doc.category) ?? [];
      list.push(doc);
      byCategory.set(doc.category, list);
    }
    return Array.from(byCategory.entries()).map(([title, docs]) => ({ id: title, title, docs }));
  }, [documents]);

  if (selectedDoc) return <DocumentDetail doc={selectedDoc} onBack={() => setSelectedId(null)} />;

  const filtered = categories
    .map((cat) => ({
      ...cat,
      docs: cat.docs.filter((d) => !search || d.title.toLowerCase().includes(search.toLowerCase())),
    }))
    .filter((cat) => cat.docs.length > 0);

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
          <Text className="text-base font-bold text-gray-900">Documents & Policies</Text>
          <Text className="text-xs text-gray-400">CMC Global</Text>
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

        {isLoading ? (
          <View className="items-center py-10">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : filtered.length === 0 ? (
          <View className="items-center px-8 py-10">
            <Text className="text-sm text-gray-400">No documents found.</Text>
          </View>
        ) : (
          <View className="gap-2 px-4">
            {filtered.map((cat, idx) => {
              const isExpanded = expanded === cat.id || (expanded === null && idx === 0);
              return (
                <View key={cat.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                  <Pressable
                    onPress={() => setExpanded(isExpanded ? '' : cat.id)}
                    className="flex-row items-center gap-3 px-4 py-3.5"
                  >
                    <View className="h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: colors.surface }}>
                      <FileText size={15} color={colors.primary} />
                    </View>
                    <Text className="flex-1 text-sm font-bold text-gray-900">{cat.title}</Text>
                    <Text className="mr-1 text-[10px] text-gray-400">{cat.docs.length}</Text>
                    {isExpanded ? <ChevronUp size={16} color="#9CA3AF" /> : <ChevronDown size={16} color="#9CA3AF" />}
                  </Pressable>
                  {isExpanded && (
                    <View className="border-t border-gray-50">
                      {cat.docs.map((doc, i, arr) => (
                        <Pressable
                          key={doc.id}
                          onPress={() => setSelectedId(doc.id)}
                          className={`flex-row items-start gap-3 px-4 py-3 ${i < arr.length - 1 ? 'border-b border-gray-50' : ''}`}
                        >
                          <View
                            className="mt-2.5 h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: doc.acknowledgedByMe ? '#16A34A' : colors.primary }}
                          />
                          <View className="flex-1">
                            <Text className="text-sm font-medium text-gray-800">{doc.title}</Text>
                            <Text className="mt-0.5 text-[10px] text-gray-400">
                              Updated: {formatDate(doc.modifiedAt ?? doc.createdAt)}
                            </Text>
                          </View>
                          <ChevronRight size={14} color="#D1D5DB" style={{ marginTop: 4 }} />
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
