import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { ChatStackParamList } from './types';
import ChatListScreen from '@/src/screens/chat/ChatListScreen';
import ChatThreadScreen from '@/src/screens/chat/ChatThreadScreen';
import ChatThreadRepliesScreen from '@/src/screens/chat/ChatThreadRepliesScreen';
import ChatMembersScreen from '@/src/screens/chat/ChatMembersScreen';

const Stack = createNativeStackNavigator<ChatStackParamList>();

export function ChatStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ChatList" component={ChatListScreen} options={{ title: 'Messages' }} />
      <Stack.Screen name="ChatThread" component={ChatThreadScreen} options={{ title: 'Chat' }} />
      <Stack.Screen name="ChatThreadReplies" component={ChatThreadRepliesScreen} options={{ title: 'Thread' }} />
      <Stack.Screen name="ChatMembers" component={ChatMembersScreen} options={{ title: 'Members' }} />
    </Stack.Navigator>
  );
}
