import { View, Text, Pressable } from 'react-native';
import { MessageCircle } from 'lucide-react-native';

import { colors } from '@/src/theme/colors';

export function ReactionSheet({
  emojis,
  onPick,
  onReply,
  onClose,
}: {
  emojis: string[];
  onPick: (emoji: string) => void;
  onReply: () => void;
  onClose: () => void;
}) {
  return (
    <View className="absolute inset-0 z-50 justify-end" style={{ backgroundColor: 'rgba(10,24,48,0.5)' }}>
      <Pressable className="absolute inset-0" onPress={onClose} />
      <View className="rounded-t-3xl bg-white p-5 shadow-2xl">
        <View className="mb-5 flex-row justify-around">
          {emojis.map((emoji) => (
            <Pressable key={emoji} onPress={() => onPick(emoji)} className="h-11 w-11 items-center justify-center">
              <Text className="text-2xl">{emoji}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={onReply} className="flex-row items-center gap-3 rounded-2xl bg-gray-50 px-4 py-3.5">
          <MessageCircle size={17} color={colors.primary} />
          <Text className="text-sm font-semibold text-gray-800">Reply in Thread</Text>
        </Pressable>
      </View>
    </View>
  );
}
