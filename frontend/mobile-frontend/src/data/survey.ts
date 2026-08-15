// Placeholder data — swap for real API calls (workflow-service) once that endpoint exists.

export type SurveyStatus = 'Not Started' | 'In Progress' | 'Completed';
export type SurveyItem = { id: number; title: string; desc: string; duration: string; deadline: string; status: SurveyStatus };

export const ACTIVE_SURVEYS: SurveyItem[] = [
  { id: 1, title: 'Q2 Employee Satisfaction Survey', desc: 'Help us improve your workplace experience', duration: '5 min', deadline: 'Jul 15, 2025', status: 'Not Started' },
  { id: 2, title: 'Canteen Menu Feedback', desc: 'Rate the quality and variety of canteen meals', duration: '2 min', deadline: 'Jul 20, 2025', status: 'In Progress' },
  { id: 3, title: 'Safety Training Evaluation', desc: 'Evaluate the recent PPE refresher training', duration: '3 min', deadline: 'Jul 31, 2025', status: 'Not Started' },
];

export const PAST_SURVEYS: SurveyItem[] = [
  { id: 4, title: 'Q1 Employee Satisfaction Survey', desc: '', duration: '5 min', deadline: 'Apr 15, 2025', status: 'Completed' },
  { id: 5, title: 'Annual Company Picnic Poll', desc: '', duration: '1 min', deadline: 'Jun 30, 2025', status: 'Completed' },
];

export type SurveyQuestion =
  | { id: number; type: 'rating'; q: string }
  | { id: number; type: 'mc'; q: string; opts: string[] }
  | { id: number; type: 'text'; q: string };

export const SURVEY_QS: SurveyQuestion[] = [
  { id: 1, type: 'rating', q: 'How satisfied are you with your current work environment?' },
  {
    id: 2,
    type: 'mc',
    q: 'Which area needs the most improvement?',
    opts: ['Canteen & Facilities', 'Communication from Management', 'Work Schedule & Shifts', 'Safety Conditions', 'Career Development'],
  },
  { id: 3, type: 'text', q: 'Share any specific suggestions to improve your workplace.' },
];

export const RATING_LABELS = ['', 'Very Dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very Satisfied'];
