// Placeholder data — swap for real API calls (workflow-service) once that endpoint exists.

export type ShiftKind = 'morning' | 'night' | 'off';
export const SHIFTS: Record<ShiftKind, { label: string; bg: string; text: string; time: string }> = {
  morning: { label: 'Morning Shift', bg: '#DBEAFE', text: '#1D4ED8', time: '06:00 – 15:00' },
  night: { label: 'Night Shift', bg: '#EDE9FE', text: '#6D28D9', time: '22:00 – 06:00' },
  off: { label: 'Day Off', bg: '#F3F4F6', text: '#6B7280', time: '—' },
};

export const WEEK_DAYS_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const WEEK_DATES_NUMS = [7, 8, 9, 10, 11, 12, 13];
export const WEEK_SCHEDULE: ShiftKind[] = ['morning', 'morning', 'morning', 'off', 'morning', 'off', 'off'];
