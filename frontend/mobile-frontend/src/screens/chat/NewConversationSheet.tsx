import { useEffect, useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { Hash, X } from 'lucide-react-native';

import { Avatar } from '@/src/components/Avatar';
import { Toggle } from '@/src/components/Toggle';
import { colors } from '@/src/theme/colors';
import { fetchUsers, type UserSummary } from '@/src/api/usersApi';
import { useAuth } from '@/src/auth/AuthContext';
import {
  useBrowsePublicChannels,
  useCreateConversation,
  useJoinChannel,
} from '@/src/chat/useMessages';

type Tab = 'dm' | 'channel' | 'browse';

const TABS: { key: Tab; label: string }[] = [
  { key: 'dm', label: 'Direct Message' },
  { key: 'channel', label: 'New Channel' },
  { key: 'browse', label: 'Browse' },
];

export function NewConversationSheet({
  onClose,
  onOpenConversation,
}: {
  onClose: () => void;
  onOpenConversation: (conversationId: string) => void;
}) {
  const { user } = useAuth();
  const mySub = user?.sub;
  const [tab, setTab] = useState<Tab>('dm');

  const [dmQuery, setDmQuery] = useState('');
  const [dmResults, setDmResults] = useState<UserSummary[]>([]);
  const [dmSearching, setDmSearching] = useState(false);

  const [channelName, setChannelName] = useState('');
  const [channelPrivate, setChannelPrivate] = useState(true);

  const [browseSearch, setBrowseSearch] = useState('');
  const { data: publicChannels = [], isLoading: loadingChannels } = useBrowsePublicChannels(
    browseSearch,
    tab === 'browse',
  );

  const { mutate: createConversation, isPending: creating } = useCreateConversation();
  const { mutate: joinChannelMutate, isPending: joining } = useJoinChannel();

  useEffect(() => {
    const query = dmQuery.trim();
    if (!query) {
      setDmResults([]);
      return;
    }
    let cancelled = false;
    setDmSearching(true);
    const timer = setTimeout(() => {
      fetchUsers(query, 8).then((results) => {
        if (cancelled) return;
        setDmResults(results.filter((u) => u.sub !== mySub));
        setDmSearching(false);
      });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [dmQuery, mySub]);

  function handlePickUser(picked: UserSummary) {
    createConversation(
      { type: 'DIRECT', participantSubs: [picked.sub] },
      { onSuccess: (conversation) => onOpenConversation(conversation.id) },
    );
  }

  function handleCreateChannel() {
    if (!channelName.trim()) return;
    createConversation(
      { type: 'GROUP', name: channelName.trim(), participantSubs: [], privateChannel: channelPrivate },
      { onSuccess: (conversation) => onOpenConversation(conversation.id) },
    );
  }

  function handleJoin(channelId: string) {
    joinChannelMutate(channelId, { onSuccess: () => onOpenConversation(channelId) });
  }

  return (
    <View className="absolute inset-0 z-50 justify-end" style={styles.backdrop}>
      <Pressable className="absolute inset-0" onPress={onClose} />
      <View className="rounded-t-3xl bg-white shadow-2xl" style={styles.sheet}>
        <View className="flex-row items-center justify-between border-b border-gray-100 px-5 py-3.5">
          <Text className="text-base font-bold text-gray-900">New</Text>
          <Pressable onPress={onClose} className="h-8 w-8 items-center justify-center rounded-full bg-gray-100">
            <X size={16} color="#6B7280" />
          </Pressable>
        </View>

        <View className="flex-row gap-2 px-5 py-3">
          {TABS.map((t) => (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              className="rounded-full px-3.5 py-1.5"
              style={{ backgroundColor: tab === t.key ? colors.primary : colors.surface }}
            >
              <Text
                className="text-xs font-bold"
                style={tab === t.key ? styles.tabTextActive : styles.tabTextInactive}
              >
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === 'dm' && (
          <View className="flex-1 px-5">
            <TextInput
              value={dmQuery}
              onChangeText={setDmQuery}
              placeholder="Search a colleague..."
              placeholderTextColor="#9CA3AF"
              className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm text-gray-800"
            />
            <ScrollView className="mt-3 flex-1">
              {dmSearching && <ActivityIndicator className="mt-4" color={colors.primary} />}
              {!dmSearching && dmQuery.trim() && dmResults.length === 0 && (
                <Text className="mt-4 text-center text-xs text-gray-400">No matches</Text>
              )}
              {dmResults.map((u) => (
                <Pressable
                  key={u.sub}
                  onPress={() => handlePickUser(u)}
                  disabled={creating}
                  className="flex-row items-center gap-3 border-b border-gray-50 py-3"
                >
                  <Avatar name={u.name} size="sm" />
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900">{u.name}</Text>
                    <Text className="text-xs text-gray-400">{u.email}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {tab === 'channel' && (
          <View className="flex-1 gap-4 px-5">
            <TextInput
              value={channelName}
              onChangeText={setChannelName}
              placeholder="Channel name"
              placeholderTextColor="#9CA3AF"
              className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm text-gray-800"
            />
            <View className="flex-row items-start justify-between gap-3">
              <Text className="flex-1 text-xs text-gray-500">
                Private (invite-only) — turn off to make it public and joinable by anyone
              </Text>
              <Toggle on={channelPrivate} onToggle={() => setChannelPrivate((v) => !v)} />
            </View>
            <Pressable
              onPress={handleCreateChannel}
              disabled={!channelName.trim() || creating}
              className="items-center rounded-2xl py-3.5"
              style={!channelName.trim() || creating ? styles.createButtonDisabled : styles.createButtonEnabled}
            >
              <Text className="text-sm font-bold text-white">{creating ? 'Creating...' : 'Create Channel'}</Text>
            </Pressable>
          </View>
        )}

        {tab === 'browse' && (
          <View className="flex-1 px-5">
            <TextInput
              value={browseSearch}
              onChangeText={setBrowseSearch}
              placeholder="Search public channels..."
              placeholderTextColor="#9CA3AF"
              className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm text-gray-800"
            />
            <ScrollView className="mt-3 flex-1">
              {loadingChannels && <ActivityIndicator className="mt-4" color={colors.primary} />}
              {!loadingChannels && publicChannels.length === 0 && (
                <Text className="mt-4 text-center text-xs text-gray-400">No public channels to join</Text>
              )}
              {publicChannels.map((channel) => (
                <View key={channel.id} className="flex-row items-center justify-between border-b border-gray-50 py-3">
                  <View className="flex-row items-center gap-2">
                    <Hash size={14} color={colors.primary} />
                    <Text className="text-sm font-semibold text-gray-900">{channel.name}</Text>
                    <Text className="text-xs text-gray-400">({channel.memberCount})</Text>
                  </View>
                  <Pressable
                    onPress={() => handleJoin(channel.id)}
                    disabled={joining}
                    className="rounded-full px-3.5 py-1.5"
                    style={{ backgroundColor: colors.surface }}
                  >
                    <Text className="text-xs font-bold" style={{ color: colors.primary }}>Join</Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(10,24,48,0.5)' },
  sheet: { height: '72%' },
  tabTextActive: { color: '#fff' },
  tabTextInactive: { color: colors.primary },
  createButtonEnabled: { backgroundColor: colors.primary, opacity: 1 },
  createButtonDisabled: { backgroundColor: colors.primary, opacity: 0.5 },
});
