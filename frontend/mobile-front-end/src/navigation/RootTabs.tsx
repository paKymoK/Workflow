import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Newspaper, MessageCircle, User, Menu } from 'lucide-react-native';

import type { RootTabParamList } from './types';
import HomeScreen from '@/src/screens/HomeScreen';
import NewsScreen from '@/src/screens/NewsScreen';
import { ChatStack } from './ChatStack';
import { ProfileStack } from './ProfileStack';
import { MoreStack } from './MoreStack';

const Tab = createBottomTabNavigator<RootTabParamList>();

export function RootTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: '#2563eb' }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
      />
      <Tab.Screen
        name="News"
        component={NewsScreen}
        options={{ title: 'News', tabBarIcon: ({ color, size }) => <Newspaper color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatStack}
        options={{ title: 'Chat', tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
      />
      <Tab.Screen
        name="More"
        component={MoreStack}
        options={{ title: 'More', tabBarIcon: ({ color, size }) => <Menu color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
}
