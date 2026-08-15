import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { launchImageLibrary } from 'react-native-image-picker';
import { ArrowLeft, Paperclip, Send, Users as UsersIcon } from 'lucide-react-native';

import { Avatar } from '@/src/components/Avatar';
import { colors } from '@/src/theme/colors';
import { useAuth } from '@/src/auth/AuthContext';
import type { ChatStackParamList } from '@/src/navigation/types';
import type { ChatMessage, MessageAttachment } from '@/src/api/chatTypes';
import { getFileUrl, uploadFile, uploadVideo, waitForVideoReady } from '@/src/api/mediaApi';
import {
  useConversationMessages,
  useConversations,
  useMarkConversationRead,
  useParticipantNamesMap,
  usePresenceMap,
  useSendMessage,
  useSendTyping,
  useSyncParticipantNames,
  useSyncPresence,
  useToggleReaction,
  useTypingUsers,
} from '@/src/chat/useMessages';
import {
  conversationLabel,
  deriveMessageType,
  directPeerSub,
  formatLastSeen,
  formatTime,
  receiptStatus,
  stripHtml,
} from '@/src/chat/chatHelpers';
import { ReactionSheet } from './ReactionSheet';
import { LazyVideoAttachment } from './LazyVideoAttachment';
import { MessageComposerAttachments, type PendingAttachment } from './MessageComposerAttachments';

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export default function ChatThreadScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ChatStackParamList>>();
  const route = useRoute<RouteProp<ChatStackParamList, 'ChatThread'>>();
  const { conversationId } = route.params;

  const { user } = useAuth();
  const mySub = user?.sub;

  const { data: conversations = [] } = useConversations();
  const conversation = conversations.find((c) => c.id === conversationId) ?? null;

  const peerSub = conversation ? directPeerSub(conversation, mySub) : null;
  useSyncParticipantNames(peerSub ? [peerSub] : []);
  const nameBySub = useParticipantNamesMap();
  useSyncPresence(conversation ? conversation.participantSubs.filter((s) => s !== mySub) : []);
  const presenceBySub = usePresenceMap();

  const {
    data: messagePages,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useConversationMessages(conversationId);
  const { mutate: send, isPending: sending } = useSendMessage(conversationId);
  const { mutate: toggleReaction } = useToggleReaction(conversationId);
  const { mutate: markRead } = useMarkConversationRead();
  const sendTyping = useSendTyping(conversationId);
  const typingUsers = useTypingUsers(conversationId);

  const [input, setInput] = useState('');
  const [reactionTarget, setReactionTarget] = useState<ChatMessage | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);

  // Already newest-first per page, oldest page last — exactly the order an inverted
  // FlatList wants (index 0 renders at the bottom = newest).
  const messages = useMemo(() => (messagePages ? messagePages.pages.flat() : []), [messagePages]);

  const label = conversation ? conversationLabel(conversation, mySub, nameBySub) : '';
  const peerStatus = peerSub ? presenceBySub[peerSub] : undefined;
  const presenceLabel = peerSub
    ? peerStatus?.online
      ? 'Online'
      : formatLastSeen(peerStatus?.lastSeenAt ?? null)
    : conversation
      ? `${conversation.participantSubs.length} members`
      : '';

  const typingLabel = useMemo(() => {
    const names = Object.values(typingUsers);
    if (names.length === 0) return null;
    if (names.length === 1) return `${names[0]} is typing…`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing…`;
    return 'Several people are typing…';
  }, [typingUsers]);

  useFocusEffect(
    useCallback(() => {
      if (conversationId) markRead(conversationId);
    }, [conversationId, messages[0]?.id, markRead]),
  );

  function handleChangeInput(text: string) {
    setInput(text);
    if (text.trim()) sendTyping();
  }

  function updatePendingAttachment(key: string, patch: Partial<PendingAttachment>) {
    setPendingAttachments((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  }

  function removePendingAttachment(key: string) {
    setPendingAttachments((prev) => prev.filter((p) => p.key !== key));
  }

  async function handleAttach() {
    const result = await launchImageLibrary({ mediaType: 'mixed', selectionLimit: 0 });
    if (result.didCancel) return;
    if (!result.assets) {
      if (result.errorCode) {
        Alert.alert('Could not attach file', result.errorMessage ?? 'Please try again.');
      }
      return;
    }

    for (const asset of result.assets) {
      if (!asset.uri) continue;
      const key = `${Date.now()}-${Math.random()}`;
      const isVideo = (asset.type ?? '').startsWith('video/');
      const pickedFile = { uri: asset.uri, name: asset.fileName ?? 'upload', type: asset.type ?? (isVideo ? 'video/mp4' : 'image/jpeg') };
      setPendingAttachments((prev) => [
        ...prev,
        { key, name: pickedFile.name, kind: isVideo ? 'video' : 'image', status: 'uploading', previewUri: isVideo ? undefined : asset.uri },
      ]);

      try {
        if (isVideo) {
          const job = await uploadVideo(pickedFile);
          updatePendingAttachment(key, { status: 'processing' });
          const finalStatus = await waitForVideoReady(job.jobId);
          if (finalStatus.status !== 'DONE') {
            throw new Error(finalStatus.errorMessage ?? 'Video processing failed');
          }
          updatePendingAttachment(key, {
            status: 'ready',
            attachment: { type: 'VIDEO', mediaAssetId: job.videoId, url: null, status: 'READY' },
          });
        } else {
          const uploaded = await uploadFile(pickedFile);
          updatePendingAttachment(key, {
            status: 'ready',
            attachment: {
              type: 'IMAGE',
              mediaAssetId: uploaded.id,
              url: getFileUrl(uploaded.id, uploaded.extension),
              status: 'READY',
            },
          });
        }
      } catch {
        updatePendingAttachment(key, { status: 'failed' });
      }
    }
  }

  const hasPendingUploads = pendingAttachments.some((p) => p.status === 'uploading' || p.status === 'processing');
  const readyAttachments = pendingAttachments
    .filter((p) => p.status === 'ready' && p.attachment)
    .map((p) => p.attachment as MessageAttachment);
  const canSend = !hasPendingUploads && (!!input.trim() || readyAttachments.length > 0);

  function handleSend() {
    if (!canSend) return;
    const content = input.trim();
    setInput('');
    setPendingAttachments([]);
    send({
      content,
      messageType: deriveMessageType(!!content, readyAttachments),
      attachments: readyAttachments.length > 0 ? readyAttachments : undefined,
    });
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="flex-row items-center gap-3 border-b border-gray-100 bg-white px-4 py-3">
          <Pressable onPress={() => navigation.goBack()} className="-ml-1 h-8 w-8 items-center justify-center">
            <ArrowLeft size={20} color="#374151" />
          </Pressable>
          <Avatar name={label || '?'} size="sm" />
          <View className="flex-1">
            <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>{label}</Text>
            {!!presenceLabel && (
              <Text className={`text-[10px] font-medium ${peerStatus?.online ? 'text-green-500' : 'text-gray-400'}`}>
                {typingLabel ?? presenceLabel}
              </Text>
            )}
          </View>
          {conversation?.type === 'GROUP' && (
            <Pressable
              onPress={() => navigation.navigate('ChatMembers', { conversationId })}
              className="h-8 w-8 items-center justify-center"
            >
              <UsersIcon size={17} color="#6B7280" />
            </Pressable>
          )}
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={messages}
            inverted
            keyExtractor={(m) => String(m.id)}
            contentContainerStyle={{ padding: 16, gap: 4 }}
            style={{ backgroundColor: colors.background }}
            onEndReachedThreshold={0.4}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) fetchNextPage();
            }}
            ListFooterComponent={isFetchingNextPage ? <ActivityIndicator className="py-2" color={colors.primary} /> : null}
            renderItem={({ item: msg, index }) => {
              const mine = msg.sender.sub === mySub;
              // Array is newest-first; the neighbor toward higher index is older (renders
              // above msg on screen once inverted), the neighbor toward lower index is newer.
              const olderNeighbor = messages[index + 1];
              const newerNeighbor = messages[index - 1];
              const startOfGroup = !olderNeighbor || olderNeighbor.sender.sub !== msg.sender.sub;
              const endOfGroup = !newerNeighbor || newerNeighbor.sender.sub !== msg.sender.sub;
              const receipt = mine ? receiptStatus(msg, conversation) : null;
              const isNewest = index === 0;

              return (
                <View className={`flex-row gap-2 ${mine ? 'justify-end' : 'justify-start'} ${startOfGroup ? 'mt-3' : 'mt-0.5'}`}>
                  {!mine && (endOfGroup ? <Avatar name={msg.sender.name} size="sm" /> : <View style={{ width: 32 }} />)}
                  <Pressable
                    onLongPress={() => setReactionTarget(msg)}
                    style={{ maxWidth: '74%' }}
                  >
                    {startOfGroup && !mine && (
                      <Text className="ml-1 mb-1 text-[10px] text-gray-500">{msg.sender.name}</Text>
                    )}
                    <View
                      className={`rounded-2xl px-4 py-2.5 ${mine ? 'rounded-tr-sm' : 'rounded-tl-sm bg-white shadow-sm'}`}
                      style={mine ? { backgroundColor: colors.primary } : undefined}
                    >
                      {!!msg.content && (
                        <Text className={`text-sm leading-relaxed ${mine ? 'text-white' : 'text-gray-800'}`}>
                          {stripHtml(msg.content)}
                        </Text>
                      )}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <View className={`gap-1.5 ${msg.content ? 'mt-1.5' : ''}`}>
                          {msg.attachments.map((att, i) =>
                            att.type === 'IMAGE' ? (
                              <Image
                                key={i}
                                source={{ uri: att.url ?? undefined }}
                                style={{ height: 160, width: 220, borderRadius: 8 }}
                                resizeMode="cover"
                              />
                            ) : (
                              <LazyVideoAttachment key={i} attachment={att} />
                            ),
                          )}
                        </View>
                      )}
                    </View>
                    {msg.reactions.length > 0 && (
                      <View className={`mt-1 flex-row flex-wrap gap-1 ${mine ? 'justify-end' : 'justify-start'}`}>
                        {msg.reactions.map((r) => {
                          const mineReacted = !!mySub && r.subs.includes(mySub);
                          return (
                            <Pressable
                              key={r.emoji}
                              onPress={() => toggleReaction({ messageId: msg.id, emoji: r.emoji })}
                              className="rounded-full border px-2 py-0.5"
                              style={{
                                borderColor: mineReacted ? colors.primary : colors.border,
                                backgroundColor: mineReacted ? colors.surface : 'transparent',
                              }}
                            >
                              <Text className="text-[11px]" style={{ color: mineReacted ? colors.primary : '#6B7280' }}>
                                {r.emoji} {r.subs.length}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    )}
                    {msg.replyCount > 0 && (
                      <Pressable
                        onPress={() => navigation.navigate('ChatThreadReplies', { conversationId, parentMessageId: msg.id })}
                        className={mine ? 'mr-1 mt-1' : 'ml-1 mt-1'}
                      >
                        <Text className="text-[10px] font-semibold" style={{ color: colors.primary }}>
                          💬 {msg.replyCount} {msg.replyCount === 1 ? 'reply' : 'replies'}
                        </Text>
                      </Pressable>
                    )}
                    <Text className={`mt-1 text-[10px] text-gray-400 ${mine ? 'mr-1 text-right' : 'ml-1'}`}>
                      {formatTime(msg.createdAt)}
                      {receipt && (isNewest ? ` · ${receipt.label}` : '')}
                    </Text>
                  </Pressable>
                </View>
              );
            }}
          />
        )}

        <MessageComposerAttachments items={pendingAttachments} onRemove={removePendingAttachment} />

        <View className="flex-row items-center gap-2 border-t border-gray-100 bg-white px-4 py-3">
          <Pressable onPress={handleAttach} className="h-9 w-9 items-center justify-center">
            <Paperclip size={18} color="#9CA3AF" />
          </Pressable>
          <View className="flex-1 rounded-full bg-gray-100 px-4 py-2.5">
            <TextInput
              className="text-sm text-gray-800"
              placeholder="Type a message..."
              placeholderTextColor="#9CA3AF"
              value={input}
              onChangeText={handleChangeInput}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
          </View>
          <Pressable
            onPress={handleSend}
            disabled={sending || !canSend}
            className="h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.primary, opacity: sending || !canSend ? 0.5 : 1 }}
          >
            <Send size={15} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {reactionTarget && (
        <ReactionSheet
          emojis={REACTION_EMOJIS}
          onPick={(emoji) => {
            toggleReaction({ messageId: reactionTarget.id, emoji });
            setReactionTarget(null);
          }}
          onReply={() => {
            navigation.navigate('ChatThreadReplies', { conversationId, parentMessageId: reactionTarget.id });
            setReactionTarget(null);
          }}
          onClose={() => setReactionTarget(null)}
        />
      )}
    </SafeAreaView>
  );
}
