import { Pressable, StyleSheet, View } from 'react-native';

import { colors } from '@/src/theme/colors';

export function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <Pressable
      onPress={onToggle}
      className="justify-center rounded-full p-0.5"
      style={on ? styles.trackOn : styles.trackOff}
    >
      <View
        className="h-5 w-5 rounded-full bg-white shadow"
        style={{ transform: [{ translateX: on ? 20 : 0 }] }}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  trackOn: {
    width: 44,
    height: 24,
    backgroundColor: colors.primary,
  },
  trackOff: {
    width: 44,
    height: 24,
    backgroundColor: '#D1D5DB',
  },
});
