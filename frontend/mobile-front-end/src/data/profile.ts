// Placeholder data — swap for real API calls once auth-service/workflow-service endpoints exist.

export const PROFILE = {
  initials: 'NL',
  name: 'Nguyen Thi Lan',
  title: 'Quality Control Supervisor',
  department: 'Production Department',
  line: 'Line B',
  employeeId: 'CMC-2847',
  joined: 'Mar 2019',
  shift: 'Morning',
  workLocation: 'Factory Floor 2, Block C',
  shiftHours: 'Morning · 06:00 – 15:00',
  manager: 'Pham Van Hung',
  mobile: '+84 098 765 4321',
  email: 'n.thi.lan@cmcglobal.vn',
};

export const ORG_CHART = {
  chain: [
    { name: 'Tran Quoc Hung', role: 'Chief Executive Officer' },
    { name: 'Le Van Thanh', role: 'Factory Director' },
    { name: 'Pham Van Hung', role: 'Production Manager', isManager: true },
    { name: 'Nguyen Thi Lan', role: 'QC Supervisor · Line B', isSelf: true },
  ],
  reports: [
    { name: 'Dao Thi Thu', role: 'QC Operator' },
    { name: 'Tran Van An', role: 'QC Operator' },
    { name: 'Le Thi Hoa', role: 'QC Operator' },
  ],
};

export const LEAVE_BALANCES = [
  { label: 'Annual', rem: 8 as number | null, total: 15 as number | null, used: null as number | null, color: '#1558A8' },
  { label: 'Sick', rem: 8 as number | null, total: 10 as number | null, used: null as number | null, color: '#10B981' },
  { label: 'Unpaid', rem: null as number | null, total: null as number | null, used: 1 as number | null, color: '#8B5CF6' },
];

export type LeaveStatus = 'Approved' | 'Pending' | 'Rejected';
export const LEAVE_HISTORY: { id: string; type: string; range: string; days: number; status: LeaveStatus; approver: string }[] = [
  { id: 'LR-2025-0698', type: 'Annual Leave', range: 'Jul 1 – Jul 3, 2025', days: 3, status: 'Approved', approver: 'Pham Van Hung' },
  { id: 'LR-2025-0671', type: 'Sick Leave', range: 'Jun 15, 2025', days: 1, status: 'Approved', approver: 'Pham Van Hung' },
  { id: 'LR-2025-0645', type: 'Annual Leave', range: 'Jun 2 – Jun 4, 2025', days: 3, status: 'Rejected', approver: 'Pham Van Hung' },
  { id: 'LR-2025-0601', type: 'Personal Leave', range: 'May 20, 2025', days: 1, status: 'Approved', approver: 'Pham Van Hung' },
];
