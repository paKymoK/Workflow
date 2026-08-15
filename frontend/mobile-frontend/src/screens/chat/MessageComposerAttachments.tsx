import { View, Image, Pressable, ActivityIndicator, Text } from 'react-native';
import { Image as ImageIcon, Video as VideoIcon, X } from 'lucide-react-native';

import type { MessageAttachment } from '@/src/api/chatTypes';

export interface PendingAttachment {
  key: string;
  name: string;
  kind: 'image' | 'video';
  status: 'uploading' | 'processing' | 'ready' | 'failed';
  attachment?: MessageAttachment;
  previewUri?: string;
}

export function MessageComposerAttachments({
  items,
  onRemove,
}: {
  items: PendingAttachment[];
  onRemove: (key: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <View className="flex-row flex-wrap gap-2 px-4 pt-2">
      {items.map((item) => (
        <View key={item.key} className="relative h-14 w-14 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
          {item.previewUri ? (
            <Image source={{ uri: item.previewUri }} style={{ height: 56, width: 56 }} resizeMode="cover" />
          ) : item.kind === 'video' ? (
            <VideoIcon size={18} color="#9CA3AF" />
          ) : (
            <ImageIcon size={18} color="#9CA3AF" />
          )}

          {(item.status === 'uploading' || item.status === 'processing') && (
            <View className="absolute inset-0 items-center justify-center bg-black/50">
              <ActivityIndicator size="small" color="#fff" />
            </View>
          )}

          {item.status === 'failed' && (
            <View className="absolute inset-0 items-center justify-center bg-black/60">
              <Text className="text-[9px] text-red-400">Failed</Text>
            </View>
          )}

          <Pressable
            onPress={() => onRemove(item.key)}
            className="absolute -right-1 -top-1 h-4 w-4 items-center justify-center rounded-full bg-white shadow"
          >
            <X size={10} color="#374151" />
          </Pressable>
        </View>
      ))}
    </View>
  );
}
