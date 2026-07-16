import { useState } from 'react';
import { View, Text, FlatList, Pressable, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Send } from 'lucide-react-native';

import { Avatar } from '@/src/components/Avatar';
import { colors } from '@/src/theme/colors';
import type { ChatStackParamList } from '@/src/navigation/types';
import { useConversationMessages, useSendMessage, useThreadReplies } from '@/src/chat/useMessages';
import { formatTime, stripHtml } from '@/src/chat/chatHelpers';

export default function ChatThreadRepliesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ChatStackParamList>>();
  const route = useRoute<RouteProp<ChatStackParamList, 'ChatThreadReplies'>>();
  const { conversationId, parentMessageId } = route.params;

  const { data: replies = [], isLoading } = useThreadReplies(conversationId, parentMessageId);
  const { mutate: send, isPending: sending } = useSendMessage(conversationId);
  const { data: messagePages } = useConversationMessages(conversationId);
  const parentMessage = messagePages?.pages.flat().find((m) => m.id === parentMessageId) ?? null;

  const [input, setInput] = useState('');

  function handleSend() {
    const content = input.trim();
    if (!content) return;
    setInput('');
    send({ content, messageType: 'TEXT', parentMessageId });
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="flex-row items-center gap-3 border-b border-gray-100 bg-white px-4 py-3">
          <Pressable onPress={() => navigation.goBack()} className="-ml-1 h-8 w-8 items-center justify-center">
            <ArrowLeft size={20} color="#374151" />
          </Pressable>
          <Text className="text-sm font-bold text-gray-900">Thread</Text>
        </View>

        {parentMessage && (
          <View className="border-b border-gray-100 bg-white px-4 py-3">
            <View className="mb-1 flex-row items-baseline gap-1.5">
              <Text className="text-xs font-semibold text-gray-900">{parentMessage.sender.name}</Text>
              <Text className="text-[10px] text-gray-400">{formatTime(parentMessage.createdAt)}</Text>
            </View>
            {!!parentMessage.content && <Text className="text-sm text-gray-700">{stripHtml(parentMessage.content)}</Text>}
          </View>
        )}

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={replies}
            keyExtractor={(m) => String(m.id)}
            contentContainerStyle={{ padding: 16, gap: 12 }}
            style={{ backgroundColor: colors.background }}
            renderItem={({ item: reply }) => (
              <View className="flex-row gap-2">
                <Avatar name={reply.sender.name} size="sm" />
                <View className="min-w-0 flex-1">
                  <View className="flex-row items-baseline gap-1.5">
                    <Text className="text-xs font-semibold text-gray-900">{reply.sender.name}</Text>
                    <Text className="text-[10px] text-gray-400">{formatTime(reply.createdAt)}</Text>
                  </View>
                  {!!reply.content && <Text className="text-sm text-gray-700">{stripHtml(reply.content)}</Text>}
                </View>
              </View>
            )}
          />
        )}

        <View className="flex-row items-center gap-2 border-t border-gray-100 bg-white px-4 py-3">
          <View className="flex-1 rounded-full bg-gray-100 px-4 py-2.5">
            <TextInput
              className="text-sm text-gray-800"
              placeholder="Reply in thread..."
              placeholderTextColor="#9CA3AF"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
          </View>
          <Pressable
            onPress={handleSend}
            disabled={sending || !input.trim()}
            className="h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.primary, opacity: sending || !input.trim() ? 0.5 : 1 }}
          >
            <Send size={15} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
