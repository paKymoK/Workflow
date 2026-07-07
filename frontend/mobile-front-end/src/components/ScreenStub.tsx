import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function ScreenStub({ title, description }: { title: string; description: string }) {
  return (
    <SafeAreaView className="flex-1 bg-slate-50 px-4 pt-4" edges={['bottom']}>
      <Text className="text-xl font-bold text-slate-900">{title}</Text>
      <Text className="mt-1 text-slate-500">{description}</Text>
    </SafeAreaView>
  );
}
