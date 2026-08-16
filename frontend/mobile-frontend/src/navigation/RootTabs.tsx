import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Newspaper, MessageCircle, User, Menu } from 'lucide-react-native';

import type { RootTabParamList } from './types';
import HomeScreen from '@/src/screens/HomeScreen';
import NewsScreen from '@/src/screens/NewsScreen';
import { ChatStack } from './ChatStack';
import { ProfileStack } from './ProfileStack';
import { MoreStack } from './MoreStack';

const Tab = createBottomTabNavigator<RootTabParamList>();

type TabIconProps = { color: string; size: number };

// Defined at module scope (not inline in options) so React Navigation sees a
// stable component identity across renders instead of remounting the icon.
function HomeTabIcon({ color, size }: TabIconProps) {
  return <Home color={color} size={size} />;
}
function NewsTabIcon({ color, size }: TabIconProps) {
  return <Newspaper color={color} size={size} />;
}
function ChatTabIcon({ color, size }: TabIconProps) {
  return <MessageCircle color={color} size={size} />;
}
function ProfileTabIcon({ color, size }: TabIconProps) {
  return <User color={color} size={size} />;
}
function MoreTabIcon({ color, size }: TabIconProps) {
  return <Menu color={color} size={size} />;
}

export function RootTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: '#2563eb' }}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home', tabBarIcon: HomeTabIcon }} />
      <Tab.Screen name="News" component={NewsScreen} options={{ title: 'News', tabBarIcon: NewsTabIcon }} />
      <Tab.Screen name="Chat" component={ChatStack} options={{ title: 'Chat', tabBarIcon: ChatTabIcon }} />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{ title: 'Profile', tabBarIcon: ProfileTabIcon }}
      />
      <Tab.Screen name="More" component={MoreStack} options={{ title: 'More', tabBarIcon: MoreTabIcon }} />
    </Tab.Navigator>
  );
}
