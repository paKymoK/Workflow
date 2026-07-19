import { View, Text, Image } from 'react-native';

const AVATAR_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4'];

const SIZES = {
  sm: { box: 32, text: 12 },
  md: { box: 40, text: 14 },
  lg: { box: 64, text: 20 },
};

export function Avatar({
  name,
  size = 'md',
  uri,
}: {
  name: string;
  size?: keyof typeof SIZES;
  uri?: string | null;
}) {
  const { box, text } = SIZES[size];

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: box, height: box, borderRadius: box / 2 }}
      />
    );
  }

  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const color = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

  return (
    <View
      className="items-center justify-center rounded-full"
      style={{ width: box, height: box, backgroundColor: color }}
    >
      <Text className="font-bold text-white" style={{ fontSize: text }}>
        {initials}
      </Text>
    </View>
  );
}
