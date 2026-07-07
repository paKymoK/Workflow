import { Tabs } from 'expo-router';
import { Home, Newspaper, MessageCircle, User, Menu } from 'lucide-react-native';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#2563eb' }}>
      <Tabs.Screen
        name="home"
        options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="news"
        options={{ title: 'News', tabBarIcon: ({ color, size }) => <Newspaper color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="chat"
        options={{ title: 'Chat', tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: 'More', tabBarIcon: ({ color, size }) => <Menu color={color} size={size} /> }}
      />
    </Tabs>
  );
}
