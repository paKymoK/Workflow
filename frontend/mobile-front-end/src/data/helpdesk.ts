import { Laptop, Monitor, Wifi, Lock, HelpCircle, type LucideIcon } from 'lucide-react-native';

// Placeholder data — swap for real API calls (workflow-service) once that endpoint exists.

export type TicketPriority = 'Low' | 'Medium' | 'High';
export type TicketStatus = 'Open' | 'In Progress' | 'Resolved';
export type TicketThread = { sender: string; self: boolean; text: string; time: string };
export type TicketData = {
  id: string;
  category: string;
  catIcon: LucideIcon;
  desc: string;
  priority: TicketPriority;
  status: TicketStatus;
  date: string;
  thread: TicketThread[];
};

export const TICKET_CATS: { label: string; icon: LucideIcon }[] = [
  { label: 'Hardware', icon: Laptop },
  { label: 'Software', icon: Monitor },
  { label: 'Network', icon: Wifi },
  { label: 'Account Access', icon: Lock },
  { label: 'Other', icon: HelpCircle },
];

export const INIT_TICKETS: TicketData[] = [
  {
    id: 'TK-2025-0841',
    category: 'Hardware',
    catIcon: Laptop,
    priority: 'Medium',
    status: 'In Progress',
    date: 'Jul 5, 2025',
    desc: 'My laptop keyboard has two keys that stopped working — F5 and the letter B.',
    thread: [
      { sender: 'Nguyen Thi Lan', self: true, text: 'My laptop keyboard has two keys not working — F5 and the letter B. Noticed since yesterday morning.', time: 'Jul 5, 09:12' },
      { sender: 'IT Support', self: false, text: "Hi Lan, thanks for reporting. Could you share your laptop model and asset tag? We'll schedule a replacement.", time: 'Jul 5, 10:30' },
      { sender: 'Nguyen Thi Lan', self: true, text: 'Dell Latitude 5420, asset tag CMC-LAP-0294.', time: 'Jul 5, 10:45' },
      { sender: 'IT Support', self: false, text: "Got it. We'll bring a replacement keyboard to your desk Tuesday July 8. Ticket updated to In Progress.", time: 'Jul 5, 11:00' },
    ],
  },
  {
    id: 'TK-2025-0802',
    category: 'Account Access',
    catIcon: Lock,
    priority: 'High',
    status: 'Resolved',
    date: 'Jun 28, 2025',
    desc: 'Cannot log in to the production tracking system. Password reset not working.',
    thread: [
      { sender: 'Nguyen Thi Lan', self: true, text: 'I cannot log in to the production tracking system. The password reset link says email not found.', time: 'Jun 28, 07:45' },
      { sender: 'IT Support', self: false, text: "Hi Lan! We've reset your account. Try employee ID as username and CMC@2025 as temp password. Change after login.", time: 'Jun 28, 08:30' },
      { sender: 'Nguyen Thi Lan', self: true, text: 'That worked! Logged in successfully. Thank you!', time: 'Jun 28, 08:42' },
      { sender: 'IT Support', self: false, text: 'Great! Ticket marked as resolved. Let us know if you need anything else 😊', time: 'Jun 28, 08:45' },
    ],
  },
];
