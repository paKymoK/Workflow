import { Stack } from 'expo-router';

export default function MoreLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: 'More' }} />
      <Stack.Screen name="training" options={{ title: 'Training Materials' }} />
      <Stack.Screen name="policies" options={{ title: 'Company Policies' }} />
      <Stack.Screen name="survey" options={{ title: 'Internal Survey' }} />
      <Stack.Screen name="helpdesk" options={{ title: 'IT Helpdesk' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
    </Stack>
  );
}
