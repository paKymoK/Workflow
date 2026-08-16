import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { ArrowLeft, UserMinus } from 'lucide-react-native';

import { Avatar } from '@/src/components/Avatar';
import { colors } from '@/src/theme/colors';
import { useAuth } from '@/src/auth/AuthContext';
import type { ChatStackParamList } from '@/src/navigation/types';
import { fetchUsers, type UserSummary } from '@/src/api/usersApi';
import {
  useAddConversationMembers,
  useConversations,
  useParticipantNamesMap,
  useRemoveConversationMember,
  useSyncParticipantNames,
} from '@/src/chat/useMessages';

export default function ChatMembersScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ChatStackParamList, 'ChatMembers'>>();
  const { conversationId } = route.params;

  const { user } = useAuth();
  const mySub = user?.sub;

  const { data: conversations = [] } = useConversations();
  const conversation = conversations.find((c) => c.id === conversationId) ?? null;
  // Memoized so `?? []` doesn't hand useMemo/useEffect below a fresh array
  // identity on every render when there's no conversation yet.
  const participantSubs = useMemo(() => conversation?.participantSubs ?? [], [conversation?.participantSubs]);

  useSyncParticipantNames(participantSubs);
  const nameBySub = useParticipantNamesMap();

  const { mutate: addMembers, isPending: adding } = useAddConversationMembers(conversationId);
  const { mutate: removeMember } = useRemoveConversationMember(conversationId);

  const [inviteQuery, setInviteQuery] = useState('');
  const [inviteResults, setInviteResults] = useState<UserSummary[]>([]);

  const existing = useMemo(() => new Set(participantSubs), [participantSubs]);

  useEffect(() => {
    const query = inviteQuery.trim();
    if (!query) {
      setInviteResults([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      fetchUsers(query, 8).then((results) => {
        if (cancelled) return;
        setInviteResults(results.filter((u) => u.sub !== mySub && !existing.has(u.sub)));
      });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [inviteQuery, mySub, existing]);

  function handleInvite(u: UserSummary) {
    addMembers([u.sub], { onSuccess: () => setInviteQuery('') });
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <View className="flex-row items-center gap-3 border-b border-gray-100 bg-white px-4 py-3">
        <Pressable onPress={() => navigation.goBack()} className="-ml-1 h-8 w-8 items-center justify-center">
          <ArrowLeft size={20} color="#374151" />
        </Pressable>
        <Text className="text-sm font-bold text-gray-900">Members ({participantSubs.length})</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={styles.scrollContent}>
        {conversation?.owner && (
          <View className="mb-4">
            <TextInput
              value={inviteQuery}
              onChangeText={setInviteQuery}
              placeholder="Search a colleague to invite..."
              placeholderTextColor="#9CA3AF"
              className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm text-gray-800"
            />
            {inviteResults.length > 0 && (
              <View className="mt-2 overflow-hidden rounded-xl border border-gray-100">
                {inviteResults.map((u) => (
                  <Pressable
                    key={u.sub}
                    onPress={() => handleInvite(u)}
                    disabled={adding}
                    className="flex-row items-center gap-3 border-b border-gray-50 px-3 py-2.5"
                  >
                    <Avatar name={u.name} size="sm" />
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-gray-900">{u.name}</Text>
                      <Text className="text-xs text-gray-400">{u.email}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
            {adding && <ActivityIndicator className="mt-2" color={colors.primary} />}
          </View>
        )}

        <Text className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          Members ({participantSubs.length})
        </Text>
        {participantSubs.map((sub) => (
          <View key={sub} className="flex-row items-center gap-3 border-b border-gray-50 py-3">
            <Avatar name={nameBySub[sub] ?? sub} size="sm" />
            <Text className="flex-1 text-sm font-medium text-gray-800">{nameBySub[sub] ?? sub}</Text>
            {conversation?.owner && sub !== mySub && (
              <Pressable onPress={() => removeMember(sub)} className="h-8 w-8 items-center justify-center">
                <UserMinus size={16} color="#EF4444" />
              </Pressable>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 24,
  },
});
