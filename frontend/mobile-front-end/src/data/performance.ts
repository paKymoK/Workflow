// Placeholder data — swap for real API calls (workflow-service) once that endpoint exists.

export const PERF_TREND = [
  { month: 'Feb', score: 78 },
  { month: 'Mar', score: 83 },
  { month: 'Apr', score: 86 },
  { month: 'May', score: 85 },
  { month: 'Jun', score: 91 },
  { month: 'Jul', score: 94 },
];

export const RADAR_DATA = [
  { subject: 'Output', value: 94, full: 100 },
  { subject: 'Quality', value: 98, full: 100 },
  { subject: 'Attend.', value: 100, full: 100 },
  { subject: 'Safety', value: 95, full: 100 },
  { subject: 'Teamwork', value: 88, full: 100 },
];

export const PERF_KPIS = [
  { label: 'Production Output', value: 94, target: 90, unit: '%', color: '#1558A8', bg: '#EEF3FA', up: true },
  { label: 'Quality Rate', value: 98.2, target: 97, unit: '%', color: '#10B981', bg: '#ECFDF5', up: true },
  { label: 'Attendance', value: 100, target: 100, unit: '%', color: '#8B5CF6', bg: '#F5F3FF', up: true },
  { label: 'Defect Rate', value: 1.8, target: 2.0, unit: '%', color: '#F59E0B', bg: '#FFFBEB', up: false },
];

export const GOALS = [
  { label: 'Reduce defect rate below 2%', done: true },
  { label: 'Complete PPE refresher training', done: true },
  { label: 'Achieve 95% output in Q3', done: false },
  { label: 'Mentor 2 new QC operators', done: false },
];
