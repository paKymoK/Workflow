import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, UserPlus, Phone, Video, Paperclip, Send, ArrowLeft } from 'lucide-react-native';

import { Avatar } from '@/src/components/Avatar';
import { colors } from '@/src/theme/colors';
import { CONVERSATIONS, SAMPLE_MSGS, type ChatMsg } from '@/src/data/chat';

function UnreadBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <View className="h-5 w-5 items-center justify-center rounded-full" style={{ backgroundColor: colors.primary }}>
      <Text className="text-[10px] font-bold text-white">{count > 9 ? '9+' : count}</Text>
    </View>
  );
}

function ChatView({ name, onBack }: { name: string; onBack: () => void }) {
  const [msgs, setMsgs] = useState<ChatMsg[]>(SAMPLE_MSGS);
  const [input, setInput] = useState('');

  const send = () => {
    if (!input.trim()) return;
    const now = new Date();
    setMsgs((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: 'Me',
        self: true,
        text: input,
        time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
      },
    ]);
    setInput('');
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View className="flex-row items-center gap-3 border-b border-gray-100 bg-white px-4 py-3">
        <Pressable onPress={onBack} className="-ml-1 h-8 w-8 items-center justify-center">
          <ArrowLeft size={20} color="#374151" />
        </Pressable>
        <Avatar name={name} size="sm" />
        <View className="flex-1">
          <Text className="text-sm font-bold text-gray-900">{name}</Text>
          <Text className="text-[10px] font-medium text-green-500">28 members · Active now</Text>
        </View>
        <Pressable className="h-8 w-8 items-center justify-center">
          <Phone size={17} color="#6B7280" />
        </Pressable>
        <Pressable className="h-8 w-8 items-center justify-center">
          <Video size={17} color="#6B7280" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-4 py-3" style={{ backgroundColor: colors.background }} contentContainerStyle={{ gap: 16 }}>
        <View className="items-center">
          <Text className="rounded-full bg-white/80 px-3 py-1 text-[10px] text-gray-400">Today · Monday, July 7</Text>
        </View>
        {msgs.map((msg) => (
          <View key={msg.id} className={`flex-row gap-2 ${msg.self ? 'justify-end' : 'justify-start'}`}>
            {!msg.self && <Avatar name={msg.sender} size="sm" />}
            <View style={{ maxWidth: '74%' }}>
              {!msg.self && <Text className="ml-1 mb-1 text-[10px] text-gray-500">{msg.sender}</Text>}
              <View
                className={`rounded-2xl px-4 py-2.5 ${msg.self ? 'rounded-tr-sm' : 'rounded-tl-sm bg-white shadow-sm'}`}
                style={msg.self ? { backgroundColor: colors.primary } : undefined}
              >
                <Text className={`text-sm leading-relaxed ${msg.self ? 'text-white' : 'text-gray-800'}`}>{msg.text}</Text>
              </View>
              <Text className={`mt-1 text-[10px] text-gray-400 ${msg.self ? 'mr-1 text-right' : 'ml-1'}`}>{msg.time}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View className="flex-row items-center gap-2 border-t border-gray-100 bg-white px-4 py-3">
        <Pressable className="h-8 w-8 items-center justify-center">
          <Paperclip size={18} color="#9CA3AF" />
        </Pressable>
        <View className="flex-1 rounded-full bg-gray-100 px-4 py-2.5">
          <TextInput
            className="text-sm text-gray-800"
            placeholder="Type a message..."
            placeholderTextColor="#9CA3AF"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={send}
          />
        </View>
        <Pressable onPress={send} className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: colors.primary }}>
          <Send size={15} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default function ChatScreen() {
  const [active, setActive] = useState<string | null>(null);
  const chat = CONVERSATIONS.find((c) => c.id === active);

  if (active && chat) {
    return <ChatView name={chat.name} onBack={() => setActive(null)} />;
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 pb-3 pt-4">
        <View>
          <Text className="text-lg font-bold text-gray-900">Messages</Text>
          <Text className="text-xs text-gray-400">{CONVERSATIONS.length} conversations</Text>
        </View>
        <Pressable className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: colors.surface }}>
          <UserPlus size={17} color={colors.primary} />
        </Pressable>
      </View>

      <View className="mx-4 mb-3 flex-row items-center gap-2 rounded-xl bg-white px-3 py-2.5 shadow-sm">
        <Search size={15} color="#9CA3AF" />
        <TextInput className="flex-1 text-sm text-gray-700" placeholder="Search conversations..." placeholderTextColor="#9CA3AF" />
      </View>

      <ScrollView className="flex-1 px-4">
        {CONVERSATIONS.map((conv, i) => (
          <Pressable
            key={conv.id}
            onPress={() => setActive(conv.id)}
            className={`flex-row items-center gap-3 py-3.5 ${i < CONVERSATIONS.length - 1 ? 'border-b border-gray-50' : ''}`}
          >
            <View className="relative">
              <Avatar name={conv.name} />
              {!conv.group && <View className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-400" />}
            </View>
            <View className="flex-1">
              <View className="mb-0.5 flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-gray-900">{conv.name}</Text>
                <Text className="text-[10px] text-gray-400">{conv.time}</Text>
              </View>
              <View className="flex-row items-center justify-between gap-2">
                <Text className="flex-1 text-xs text-gray-500" numberOfLines={1}>
                  {conv.last}
                </Text>
                <UnreadBadge count={conv.unread} />
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
