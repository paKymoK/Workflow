import { Link, Stack } from 'expo-router';
import { View, Text } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View className="flex-1 items-center justify-center gap-3 bg-white px-6">
        <Text className="text-lg font-semibold">This screen doesn't exist.</Text>
        <Link href="/(tabs)/home" className="text-blue-600">
          Go to home screen
        </Link>
      </View>
    </>
  );
}
