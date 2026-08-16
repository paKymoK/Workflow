import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Video from 'react-native-video';
import { PlayCircle } from 'lucide-react-native';

import { colors } from '@/src/theme/colors';
import { getVideoStreamUrl } from '@/src/api/mediaApi';
import type { MessageAttachment } from '@/src/api/chatTypes';

/**
 * A chat thread can show many video messages in one scrollback — mounting a native player
 * for every one on render would multiply that cost for videos nobody is actually watching.
 * Only mount <Video> once tapped, mirroring web's LazyVideoAttachment.
 */
export function LazyVideoAttachment({ attachment }: { attachment: MessageAttachment }) {
  const [playing, setPlaying] = useState(false);

  if (attachment.status === 'PROCESSING') {
    return (
      <View className="h-28 w-56 items-center justify-center rounded-lg" style={{ backgroundColor: colors.surface }}>
        <Text className="text-[10px] text-gray-400">Processing video...</Text>
      </View>
    );
  }

  if (attachment.status === 'FAILED') {
    return (
      <View className="h-28 w-56 items-center justify-center rounded-lg" style={{ backgroundColor: colors.surface }}>
        <Text className="text-[10px] text-red-500">Video failed to process</Text>
      </View>
    );
  }

  if (!playing) {
    return (
      <Pressable
        onPress={() => setPlaying(true)}
        className="h-28 w-56 items-center justify-center rounded-lg"
        style={{ backgroundColor: colors.surface }}
      >
        <PlayCircle size={32} color={colors.primary} />
      </Pressable>
    );
  }

  return (
    <Video
      source={{ uri: getVideoStreamUrl(attachment.mediaAssetId) }}
      style={styles.video}
      controls
      resizeMode="contain"
      paused={false}
    />
  );
}

const styles = StyleSheet.create({
  video: { height: 112, width: 224, borderRadius: 8, backgroundColor: '#000' },
});
