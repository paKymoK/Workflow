import { Text } from 'react-native';

import { statusColors } from '@/src/theme/colors';

export function StatusBadge({ status }: { status: string }) {
  const { bg, text } = statusColors[status] ?? { bg: '#F3F4F6', text: '#6B7280' };
  return (
    <Text
      className="overflow-hidden rounded-full px-2.5 py-1 text-[10px] font-bold"
      style={{ backgroundColor: bg, color: text }}
    >
      {status}
    </Text>
  );
}
