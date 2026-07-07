import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: 'Profile' }} />
      <Stack.Screen name="org-chart" options={{ title: 'My Profile & Org Chart' }} />
      <Stack.Screen name="leave" options={{ title: 'Leave Request' }} />
      <Stack.Screen name="performance" options={{ title: 'Performance' }} />
      <Stack.Screen name="payslip" options={{ title: 'Payslip' }} />
      <Stack.Screen name="schedule" options={{ title: 'Work Schedule' }} />
      <Stack.Screen name="overtime" options={{ title: 'Overtime Registration' }} />
      <Stack.Screen name="canteen" options={{ title: 'Canteen Booking' }} />
      <Stack.Screen name="safety" options={{ title: 'Safety Regulations' }} />
    </Stack>
  );
}
