// Placeholder data — swap for real API calls (chat-service) once that endpoint exists.

export type Conversation = {
  id: string;
  name: string;
  group: boolean;
  last: string;
  time: string;
  unread: number;
};

export const CONVERSATIONS: Conversation[] = [
  { id: '1', name: 'Line A Team', group: true, last: 'Pham Van Hung: Tomorrow shift starts at 6:00 AM', time: '10:32', unread: 5 },
  { id: '2', name: 'HR Announcements', group: true, last: 'OT registration form is now open. Submit by...', time: '09:15', unread: 2 },
  { id: '3', name: 'Dao Thi Thu', group: false, last: 'Thanks for the quality report!', time: 'Yesterday', unread: 0 },
  { id: '4', name: 'Quality Control', group: true, last: 'Le Thi Mai: Defect rate this week is 1.8%', time: 'Yesterday', unread: 0 },
  { id: '5', name: 'Nguyen Van Minh', group: false, last: 'See you at the meeting tomorrow', time: 'Mon', unread: 0 },
  { id: '6', name: 'Safety Committee', group: true, last: 'New PPE guidelines have been attached', time: 'Mon', unread: 1 },
];

export type ChatMsg = { id: number; sender: string; self: boolean; text: string; time: string };

export const SAMPLE_MSGS: ChatMsg[] = [
  { id: 1, sender: 'Pham Van Hung', self: false, text: "Good morning team! Today's production target is 1,200 units. Let's go!", time: '06:02' },
  { id: 2, sender: 'Tran Van Duc', self: false, text: 'Understood. Line A is ready to start.', time: '06:05' },
  { id: 3, sender: 'Me', self: true, text: 'Line B is ready as well. All machines have been checked.', time: '06:07' },
  { id: 4, sender: 'Pham Van Hung', self: false, text: 'Great! Remember, shift ends at 3 PM today. OT registration closes this Friday!', time: '06:10' },
  { id: 5, sender: 'Me', self: true, text: 'Noted. I already submitted my OT request yesterday.', time: '06:12' },
  { id: 6, sender: 'Dao Thi Thu', self: false, text: 'Everyone please review the quality checklist before starting. New version uploaded last night.', time: '06:15' },
];
