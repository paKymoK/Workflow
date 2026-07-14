import type { ReactNode } from 'react';
import { View, Text, Pressable } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';

import { colors } from '@/src/theme/colors';

export function BackHeader({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack: () => void;
  right?: ReactNode;
}) {
  return (
    <View className="flex-row items-center gap-3 border-b border-gray-100 bg-white px-4 pb-3 pt-4">
      <Pressable
        onPress={onBack}
        className="h-8 w-8 items-center justify-center rounded-full"
        style={{ backgroundColor: colors.surface }}
      >
        <ArrowLeft size={18} color={colors.primary} />
      </Pressable>
      <Text className="flex-1 text-sm font-bold text-gray-900" numberOfLines={1}>
        {title}
      </Text>
      {right}
    </View>
  );
}
