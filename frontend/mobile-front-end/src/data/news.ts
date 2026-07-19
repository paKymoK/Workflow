// Static UI config for the News tab — real post/comment/reaction data comes from
// employee-service (see src/api/newsApi.ts).

export const NEWS_FILTERS = ['All', 'News', 'Events', 'Union', 'Recognition'] as const;

export const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  Recognition: { bg: '#FEF3C7', text: '#B45309' },
  Events: { bg: '#DCFCE7', text: '#15803D' },
  Union: { bg: '#EDE9FE', text: '#6D28D9' },
  News: { bg: '#DBEAFE', text: '#1D4ED8' },
};

export const REACTIONS = [
  { key: 'like', emoji: '👍', label: 'Like' },
  { key: 'love', emoji: '❤️', label: 'Love' },
  { key: 'celebrate', emoji: '🎉', label: 'Celebrate' },
  { key: 'insightful', emoji: '💡', label: 'Insightful' },
] as const;
