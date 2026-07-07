import { Link } from 'expo-router';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';

const MORE_NAV = [
  { href: '/(tabs)/more/training', label: 'Training Materials & Documents' },
  { href: '/(tabs)/more/policies', label: 'Company Policies' },
  { href: '/(tabs)/more/survey', label: 'Internal Survey' },
  { href: '/(tabs)/more/helpdesk', label: 'IT Helpdesk' },
  { href: '/(tabs)/more/settings', label: 'Settings' },
] as const;

export default function MoreMenuScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
      <ScrollView className="flex-1 px-4 pt-4">
        {MORE_NAV.map((item) => (
          <Link key={item.href} href={item.href} asChild>
            <Pressable className="mb-2 flex-row items-center justify-between rounded-xl bg-white px-4 py-4 shadow-sm">
              <Text className="text-base text-slate-800">{item.label}</Text>
              <ChevronRight size={18} color="#94a3b8" />
            </Pressable>
          </Link>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
