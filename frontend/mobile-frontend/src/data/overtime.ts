// Placeholder data — swap for real API calls (workflow-service) once that endpoint exists.

export type OTStatus = 'Approved' | 'Pending' | 'Rejected';
export const OT_HISTORY: { date: string; hours: number; task: string; status: OTStatus; approver: string }[] = [
  { date: 'Jul 5, 2025', hours: 4, task: 'Production line quality inspection', status: 'Approved', approver: 'Pham Van Hung' },
  { date: 'Jul 2, 2025', hours: 3, task: 'Machinery maintenance support', status: 'Pending', approver: 'Pham Van Hung' },
  { date: 'Jun 28, 2025', hours: 5, task: 'End-of-month inventory count', status: 'Approved', approver: 'Pham Van Hung' },
  { date: 'Jun 20, 2025', hours: 2, task: 'Emergency line coverage', status: 'Approved', approver: 'Pham Van Hung' },
];
