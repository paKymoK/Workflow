import type { NavigatorScreenParams } from '@react-navigation/native';

export type ProfileStackParamList = {
  ProfileHome: undefined;
  OrgChart: undefined;
  Leave: undefined;
  Performance: undefined;
  Payslip: undefined;
  Schedule: undefined;
  Overtime: undefined;
  Canteen: undefined;
  Safety: undefined;
};

export type MoreStackParamList = {
  MoreHome: undefined;
  Training: undefined;
  Policies: undefined;
  Survey: undefined;
  Helpdesk: undefined;
  Settings: undefined;
  PdfViewer: { uri: string; title: string };
};

export type ChatStackParamList = {
  ChatList: undefined;
  ChatThread: { conversationId: string };
  ChatThreadReplies: { conversationId: string; parentMessageId: number };
  ChatMembers: { conversationId: string };
};

export type RootTabParamList = {
  Home: undefined;
  News: undefined;
  Chat: NavigatorScreenParams<ChatStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
  More: NavigatorScreenParams<MoreStackParamList>;
};

export type RootStackParamList = {
  Login: undefined;
  Tabs: NavigatorScreenParams<RootTabParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
