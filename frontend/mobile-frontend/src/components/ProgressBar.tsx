import { View } from 'react-native';

export function ProgressBar({
  value,
  max = 100,
  color = '#1558A8',
  trackColor = 'rgba(0,0,0,0.08)',
}: {
  value: number;
  max?: number;
  color?: string;
  trackColor?: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <View className="h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: trackColor }}>
      <View className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
    </View>
  );
}
