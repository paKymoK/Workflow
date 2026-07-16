import { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Search, UserPlus } from 'lucide-react-native';

import { Avatar } from '@/src/components/Avatar';
import { colors } from '@/src/theme/colors';
import { useAuth } from '@/src/auth/AuthContext';
import type { ChatStackParamList } from '@/src/navigation/types';
import type { ConversationSummary } from '@/src/api/chatTypes';
import {
  useConversations,
  useParticipantAvatarsMap,
  useParticipantNamesMap,
  usePresenceMap,
  useSyncParticipantNames,
  useSyncPresence,
} from '@/src/chat/useMessages';
import { conversationLabel, directPeerSub, lastMessagePreview } from '@/src/chat/chatHelpers';
import { NewConversationSheet } from './NewConversationSheet';

function UnreadBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <View className="h-5 w-5 items-center justify-center rounded-full" style={{ backgroundColor: colors.primary }}>
      <Text className="text-[10px] font-bold text-white">{count > 9 ? '9+' : count}</Text>
    </View>
  );
}

function ConversationRow({
  conversation,
  mySub,
  nameBySub,
  presenceBySub,
  onOpen,
}: {
  conversation: ConversationSummary;
  mySub?: string;
  nameBySub: Record<string, string>;
  presenceBySub: ReturnType<typeof usePresenceMap>;
  onOpen: (id: string) => void;
}) {
  const peerSub = directPeerSub(conversation, mySub);
  const peerOnline = peerSub ? (presenceBySub[peerSub]?.online ?? false) : false;
  const label = conversationLabel(conversation, mySub, nameBySub);

  return (
    <Pressable onPress={() => onOpen(conversation.id)} className="flex-row items-center gap-3 border-b border-gray-50 py-3.5">
      <View className="relative">
        <Avatar name={label} />
        {peerSub && (
          <View
            className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white"
            style={{ backgroundColor: peerOnline ? '#4ADE80' : '#D1D5DB' }}
          />
        )}
      </View>
      <View className="flex-1">
        <View className="mb-0.5 flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
            {label}
          </Text>
        </View>
        <View className="flex-row items-center justify-between gap-2">
          <Text className="flex-1 text-xs text-gray-500" numberOfLines={1}>
            {lastMessagePreview(conversation.lastMessage)}
          </Text>
          <UnreadBadge count={conversation.unreadCount} />
        </View>
      </View>
    </Pressable>
  );
}

export default function ChatListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ChatStackParamList>>();
  const { user } = useAuth();
  const mySub = user?.sub;

  const [search, setSearch] = useState('');
  const [newOpen, setNewOpen] = useState(false);

  const { data: conversations = [], isLoading } = useConversations();

  const directPeerSubs = useMemo(
    () =>
      Array.from(
        new Set(
          conversations.map((c) => directPeerSub(c, mySub)).filter((sub): sub is string => sub !== null),
        ),
      ),
    [conversations, mySub],
  );
  useSyncParticipantNames(directPeerSubs);
  const nameBySub = useParticipantNamesMap();
  useParticipantAvatarsMap();

  const allParticipantSubs = useMemo(
    () => Array.from(new Set(conversations.flatMap((c) => c.participantSubs).filter((sub) => sub !== mySub))),
    [conversations, mySub],
  );
  useSyncPresence(allParticipantSubs);
  const presenceBySub = usePresenceMap();

  const query = search.trim().toLowerCase();
  const matches = (c: ConversationSummary) =>
    !query || conversationLabel(c, mySub, nameBySub).toLowerCase().includes(query);
  const channelConversations = conversations.filter((c) => c.type === 'GROUP' && matches(c));
  const directConversations = conversations.filter((c) => c.type === 'DIRECT' && matches(c));

  function openConversation(id: string) {
    setNewOpen(false);
    navigation.navigate('ChatThread', { conversationId: id });
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 pb-3 pt-4">
        <View>
          <Text className="text-lg font-bold text-gray-900">Messages</Text>
          <Text className="text-xs text-gray-400">{conversations.length} conversations</Text>
        </View>
        <Pressable
          onPress={() => setNewOpen(true)}
          className="h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.surface }}
        >
          <UserPlus size={17} color={colors.primary} />
        </Pressable>
      </View>

      <View className="mx-4 mb-3 flex-row items-center gap-2 rounded-xl bg-white px-3 py-2.5 shadow-sm">
        <Search size={15} color="#9CA3AF" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          className="flex-1 text-sm text-gray-700"
          placeholder="Search people, channels..."
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <ScrollView className="flex-1 px-4">
        {isLoading ? (
          <Text className="mt-8 text-center text-xs text-gray-400">Loading...</Text>
        ) : conversations.length === 0 ? (
          <Text className="mt-8 text-center text-xs text-gray-400">No conversations yet</Text>
        ) : channelConversations.length === 0 && directConversations.length === 0 ? (
          <Text className="mt-8 text-center text-xs text-gray-400">No matches for “{search.trim()}”</Text>
        ) : (
          <>
            {channelConversations.length > 0 && (
              <>
                <Text className="pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Channels</Text>
                {channelConversations.map((c) => (
                  <ConversationRow
                    key={c.id}
                    conversation={c}
                    mySub={mySub}
                    nameBySub={nameBySub}
                    presenceBySub={presenceBySub}
                    onOpen={openConversation}
                  />
                ))}
              </>
            )}
            {directConversations.length > 0 && (
              <>
                <Text className="pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Direct Messages</Text>
                {directConversations.map((c) => (
                  <ConversationRow
                    key={c.id}
                    conversation={c}
                    mySub={mySub}
                    nameBySub={nameBySub}
                    presenceBySub={presenceBySub}
                    onOpen={openConversation}
                  />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

      {newOpen && (
        <NewConversationSheet onClose={() => setNewOpen(false)} onOpenConversation={openConversation} />
      )}
    </SafeAreaView>
  );
}
