// Placeholder data — swap for real API calls (workflow-service) once the news endpoint exists.

export const NEWS_FILTERS = ['All', 'News', 'Events', 'Union', 'Recognition'] as const;

export type NewsComment = { id: number; author: string; text: string; time: string; liked: boolean; likes: number };
export type NewsPost = {
  id: number;
  type: (typeof NEWS_FILTERS)[number];
  pinned: boolean;
  author: string;
  time: string;
  title: string;
  body: string;
  img: string | null;
  likes: number;
  liked: boolean;
  commentList: NewsComment[];
};

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

export const NEWS_POSTS: NewsPost[] = [
  {
    id: 1,
    type: 'Recognition',
    pinned: true,
    author: 'CMC Global CEO',
    time: 'Pinned',
    title: 'CEO Message: Mid-Year Review 2025',
    body: 'Dear CMC Global family,\n\nI am proud to share that we achieved 97% of our H1 production targets. Your dedication and hard work have made this possible.\n\nAs we move into H2, let us continue striving for excellence together. New initiatives around quality control and line efficiency will roll out in August — more details to follow from department heads.\n\nThank you for everything you do every day.\n\n— Mr. Tran Quoc Hung, CEO',
    img: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=280&fit=crop&auto=format',
    likes: 142,
    liked: false,
    commentList: [
      { id: 1, author: 'Le Van Nam', text: 'Thank you for the inspiring message! Proud to be part of CMC Global.', time: '1h ago', liked: false, likes: 12 },
      { id: 2, author: 'Tran Thi Hong', text: '97% in H1 — incredible achievement. The whole team worked so hard!', time: '2h ago', liked: true, likes: 8 },
      { id: 3, author: 'Dao Van Minh', text: 'Looking forward to the new initiatives in August. H2 will be even better! 💪', time: '3h ago', liked: false, likes: 5 },
    ],
  },
  {
    id: 2,
    type: 'Recognition',
    pinned: false,
    author: 'HR Department',
    time: '2h ago',
    title: '🏆 Employee of the Month — July 2025',
    body: 'Congratulations to Tran Van Duc (Line A Supervisor) for outstanding leadership and quality control excellence this month!\n\nHis team achieved 0% defect rate for 3 consecutive weeks — an exceptional result that sets a new benchmark for Line A. Tran Van Duc consistently goes above and beyond, mentoring junior operators and driving process improvements on the floor.\n\nPlease join us in congratulating him at the brief ceremony on Friday, July 11 at 2:00 PM in the main cafeteria.',
    img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&h=280&fit=crop&auto=format',
    likes: 89,
    liked: true,
    commentList: [
      { id: 1, author: 'Nguyen Thi Huong', text: 'Congratulations Duc!! So well deserved 🎉🎉', time: '30m ago', liked: true, likes: 14 },
      { id: 2, author: 'Pham Van Khanh', text: '0% defect rate for 3 weeks — that is incredible. An inspiration to us all!', time: '1h ago', liked: false, likes: 7 },
      { id: 3, author: 'Le Thi Mai', text: 'Very proud of you, Duc. Keep leading by example!', time: '1h ago', liked: false, likes: 4 },
      { id: 4, author: 'Bui Van Long', text: 'Legend! Drinks on you Friday 😄', time: '2h ago', liked: false, likes: 9 },
    ],
  },
  {
    id: 3,
    type: 'News',
    pinned: false,
    author: 'Operations Team',
    time: 'Yesterday',
    title: 'New Safety Equipment Distribution',
    body: 'FR (flame-resistant) work uniforms and safety gloves will be distributed to all Line A, B, and C workers starting Monday, July 14.\n\nPlease collect your equipment from your line supervisor between 6:00–7:00 AM before your shift starts. Sizes were confirmed from the earlier survey — if your size is incorrect, contact HR ext. 201 within 3 days of receiving.\n\nReminder: wearing approved PPE at all times on the production floor is mandatory per company safety policy.',
    img: null,
    likes: 45,
    liked: false,
    commentList: [
      { id: 1, author: 'Bui Van Long', text: "When will Line C get theirs? Our supervisor hasn't been notified yet.", time: '5h ago', liked: false, likes: 3 },
      { id: 2, author: 'Nguyen Thi Lan', text: 'Confirmed — Line B supervisors have all been briefed. Collection starts Monday 6 AM.', time: '4h ago', liked: true, likes: 6 },
      { id: 3, author: 'Hoang Van Tuan', text: 'What if my uniform size is wrong? Do I exchange it the same day?', time: '3h ago', liked: false, likes: 1 },
    ],
  },
  {
    id: 4,
    type: 'Events',
    pinned: false,
    author: 'Events Committee',
    time: '3 days ago',
    title: 'Company Family Picnic — August 16, 2025',
    body: 'We are excited to announce our Annual Family Picnic at Suoi Tien Theme Park on Saturday, August 16, 2025!\n\nFamily members are warmly welcome. CMC Global will provide:\n• Free bus transport from the factory (departs 7:30 AM)\n• Admission tickets for employees and up to 3 family members\n• Lunch and refreshments included\n• Prizes and games for children\n\nRegistration closes July 20. Sign up via the Survey tab or contact HR ext. 201. Don’t miss out!',
    img: 'https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=600&h=280&fit=crop&auto=format',
    likes: 198,
    liked: true,
    commentList: [
      { id: 1, author: 'Hoang Van Tuan', text: "Can't wait! My kids are already so excited about Suoi Tien 🎡", time: '1 day ago', liked: true, likes: 22 },
      { id: 2, author: 'Pham Thi Thu', text: 'The theme park is a great choice this year! See you all there 🌟', time: '2 days ago', liked: false, likes: 15 },
      { id: 3, author: 'Tran Van An', text: 'Is there a bus from Gate 2 or only Gate 1? Want to make sure my family knows where to meet.', time: '2 days ago', liked: false, likes: 4 },
      { id: 4, author: 'Events Committee', text: 'Hi Tran Van An — buses depart from Gate 1 only. Please arrive by 7:15 AM. See you there!', time: '2 days ago', liked: true, likes: 8 },
      { id: 5, author: 'Le Thi Hoa', text: 'Already registered! This is the highlight of the year 😊', time: '3 days ago', liked: false, likes: 11 },
    ],
  },
  {
    id: 5,
    type: 'Union',
    pinned: false,
    author: 'Labor Union',
    time: '4 days ago',
    title: 'Q3 Benefits Review Meeting — July 18',
    body: '📅 Date: Friday, July 18, 2025\n🕓 Time: 4:00 PM – 5:30 PM\n📍 Venue: Main Cafeteria, Building A\n\nAgenda:\n1. Meal allowance increase proposal (from ₫25,000 to ₫35,000/day)\n2. Shift rotation policy update — new 2-week rotation schedule\n3. Annual leave carry-forward policy clarification\n4. Q&A and open floor\n\nAttendance is strongly encouraged. All issues raised will be minuted and escalated to HR management.',
    img: null,
    likes: 56,
    liked: false,
    commentList: [
      { id: 1, author: 'Le Thi Hoa', text: 'Will the meal allowance increase be backdated to Q2 or only effective Q3?', time: '2 days ago', liked: false, likes: 7 },
      { id: 2, author: 'Nguyen Van Minh', text: "Important meeting everyone. All union members should attend — let's make our voices heard.", time: '3 days ago', liked: true, likes: 13 },
      { id: 3, author: 'Labor Union', text: 'Le Thi Hoa — the proposal is for Q3 onwards. We will push for backdating during the meeting.', time: '3 days ago', liked: false, likes: 5 },
    ],
  },
];
