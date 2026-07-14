// Brand palette shared across screens — mirrors docs/[DEMO] Employee Portal App Prototype's theme.css tokens.
export const colors = {
  primaryDark: '#0D3F7A',
  primary: '#1558A8',
  primaryMid: '#2176C8',
  primaryLight: '#4BA3E6',
  surface: '#EEF3FA',
  background: '#F0F5FB',
  border: '#E4EBF5',
  textMuted: '#6B7A8D',
} as const;

export const statusColors: Record<string, { bg: string; text: string }> = {
  Approved: { bg: '#DCFCE7', text: '#15803D' },
  Confirmed: { bg: '#DCFCE7', text: '#15803D' },
  Completed: { bg: '#DCFCE7', text: '#15803D' },
  Resolved: { bg: '#DCFCE7', text: '#15803D' },
  Pending: { bg: '#FEF3C7', text: '#B45309' },
  'In Progress': { bg: '#FEF3C7', text: '#B45309' },
  Rejected: { bg: '#FEE2E2', text: '#B91C1C' },
  High: { bg: '#FEE2E2', text: '#B91C1C' },
  Cancelled: { bg: '#F3F4F6', text: '#6B7280' },
  'Not Started': { bg: '#F3F4F6', text: '#6B7280' },
  Low: { bg: '#F3F4F6', text: '#6B7280' },
  Medium: { bg: '#FEF3C7', text: '#B45309' },
  Open: { bg: '#DBEAFE', text: '#1D4ED8' },
};
