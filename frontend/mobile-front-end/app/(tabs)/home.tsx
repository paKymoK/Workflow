import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <ScrollView className="flex-1 px-4 pt-2" contentContainerStyle={{ paddingBottom: 24 }}>
        <Text className="text-2xl font-bold text-slate-900">Home</Text>
        <Text className="mt-1 text-slate-500">Greeting, KPI widgets, announcements go here.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
