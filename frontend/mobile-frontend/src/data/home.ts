import type { LucideIcon } from 'lucide-react-native';
import { Calendar, FileText, Clock, Utensils, Headphones, Timer } from 'lucide-react-native';

// Placeholder data — swap for real API calls (auth-service/workflow-service via
// src/api/axios.ts) once those endpoints exist. Shapes here are the contract
// each screen expects.

export const HOME_SLIDES = [
  {
    tag: 'Our Vision',
    body: 'To be the leading garment manufacturer in Southeast Asia, delivering world-class quality by 2030.',
    colors: ['#0D3F7A', '#1558A8', '#2176C8'] as const,
  },
  {
    tag: 'Core Values',
    body: 'Quality · Integrity · Innovation · Teamwork · Sustainability',
    colors: ['#1558A8', '#2176C8', '#4BA3E6'] as const,
  },
  {
    tag: 'CMC Global',
    body: '700+ employees · 3 production lines · Est. 2008 · Ho Chi Minh City',
    colors: ['#0D3F7A', '#1558A8'] as const,
  },
];

export const QUICK_LINKS: {
  icon: LucideIcon;
  label: string;
  tab: 'Profile' | 'More';
  screen: string;
}[] = [
  { icon: Calendar, label: 'Leave Request', tab: 'Profile', screen: 'Leave' },
  { icon: FileText, label: 'Payslip', tab: 'Profile', screen: 'Payslip' },
  { icon: Clock, label: 'Work Schedule', tab: 'Profile', screen: 'Schedule' },
  { icon: Utensils, label: 'Meal Booking', tab: 'Profile', screen: 'Canteen' },
  { icon: Headphones, label: 'IT Helpdesk', tab: 'More', screen: 'Helpdesk' },
  { icon: Timer, label: 'Overtime Reg.', tab: 'Profile', screen: 'Overtime' },
];

export const HOME_WIDGETS = {
  leave: { used: 8, total: 15 },
  hours: { worked: 176, target: 200, overtime: 12 },
  production: { kpi: 94, defectRate: 1.8 },
  performance: { rating: 'A+', attendance: 100 },
};

export const ANNOUNCEMENTS = [
  { emoji: '🔔', text: 'OT Registration closes this Friday, July 11', urgent: true },
  { emoji: '📢', text: 'Line B production target increased to 1,200 units/day starting next week', urgent: false },
];
