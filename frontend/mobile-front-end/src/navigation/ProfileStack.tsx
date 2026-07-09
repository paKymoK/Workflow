import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { ProfileStackParamList } from './types';
import ProfileMenuScreen from '@/src/screens/profile/ProfileMenuScreen';
import OrgChartScreen from '@/src/screens/profile/OrgChartScreen';
import LeaveScreen from '@/src/screens/profile/LeaveScreen';
import PerformanceScreen from '@/src/screens/profile/PerformanceScreen';
import PayslipScreen from '@/src/screens/profile/PayslipScreen';
import ScheduleScreen from '@/src/screens/profile/ScheduleScreen';
import OvertimeScreen from '@/src/screens/profile/OvertimeScreen';
import CanteenScreen from '@/src/screens/profile/CanteenScreen';
import SafetyScreen from '@/src/screens/profile/SafetyScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="ProfileHome" component={ProfileMenuScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="OrgChart" component={OrgChartScreen} options={{ title: 'My Profile & Org Chart' }} />
      <Stack.Screen name="Leave" component={LeaveScreen} options={{ title: 'Leave Request' }} />
      <Stack.Screen name="Performance" component={PerformanceScreen} options={{ title: 'Performance' }} />
      <Stack.Screen name="Payslip" component={PayslipScreen} options={{ title: 'Payslip' }} />
      <Stack.Screen name="Schedule" component={ScheduleScreen} options={{ title: 'Work Schedule' }} />
      <Stack.Screen name="Overtime" component={OvertimeScreen} options={{ title: 'Overtime Registration' }} />
      <Stack.Screen name="Canteen" component={CanteenScreen} options={{ title: 'Canteen Booking' }} />
      <Stack.Screen name="Safety" component={SafetyScreen} options={{ title: 'Safety Regulations' }} />
    </Stack.Navigator>
  );
}
