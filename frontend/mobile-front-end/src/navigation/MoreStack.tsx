import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { MoreStackParamList } from './types';
import MoreMenuScreen from '@/src/screens/more/MoreMenuScreen';
import TrainingScreen from '@/src/screens/more/TrainingScreen';
import PoliciesScreen from '@/src/screens/more/PoliciesScreen';
import SurveyScreen from '@/src/screens/more/SurveyScreen';
import HelpdeskScreen from '@/src/screens/more/HelpdeskScreen';
import SettingsScreen from '@/src/screens/more/SettingsScreen';

const Stack = createNativeStackNavigator<MoreStackParamList>();

export function MoreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MoreHome" component={MoreMenuScreen} options={{ title: 'More' }} />
      <Stack.Screen name="Training" component={TrainingScreen} options={{ title: 'Training Materials' }} />
      <Stack.Screen name="Policies" component={PoliciesScreen} options={{ title: 'Company Policies' }} />
      <Stack.Screen name="Survey" component={SurveyScreen} options={{ title: 'Internal Survey' }} />
      <Stack.Screen name="Helpdesk" component={HelpdeskScreen} options={{ title: 'IT Helpdesk' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Stack.Navigator>
  );
}
