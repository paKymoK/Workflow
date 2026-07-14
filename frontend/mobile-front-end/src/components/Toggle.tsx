import { Pressable, View } from 'react-native';

import { colors } from '@/src/theme/colors';

export function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <Pressable
      onPress={onToggle}
      className="justify-center rounded-full p-0.5"
      style={{ width: 44, height: 24, backgroundColor: on ? colors.primary : '#D1D5DB' }}
    >
      <View
        className="h-5 w-5 rounded-full bg-white shadow"
        style={{ transform: [{ translateX: on ? 20 : 0 }] }}
      />
    </Pressable>
  );
}
