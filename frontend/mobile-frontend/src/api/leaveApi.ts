import { api } from './axios';

export interface ResultMessage<T> {
  status: { code: string; message: string };
  data: T;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export type LeaveType = 'ANNUAL' | 'SICK' | 'PERSONAL' | 'UNPAID' | 'MATERNITY';

export interface LeaveDetail {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
  attachmentUrl?: string | null;
}

export interface LeaveTicket {
  id: number;
  createdAt: string;
  status: { id: number; name: string };
  reporter: { sub?: string; name: string } | null;
  detail: LeaveDetail | null;
  approvals?: { transitionName: string; approvedBy: { name: string }; approvedAt: string }[];
}

export interface LeaveBalance {
  leaveType: LeaveType;
  year: number;
  totalDays: number;
  usedDays: number;
}

const LEAVE_PROJECT_CODE = 'HR';
const LEAVE_ISSUE_TYPE_NAME = 'Leave Request';
const DEFAULT_PRIORITY_NAME = 'Medium';

let cachedProjectId: number | null = null;
let cachedIssueTypeId: number | null = null;
let cachedPriorityId: number | null = null;

// Ticket type/project ids are DB-assigned (serial), so they're resolved by name/code at runtime
// rather than hardcoded, then cached in-memory for the life of the app session.
async function resolveLeaveIds(): Promise<{ projectId: number; issueTypeId: number }> {
  if (cachedProjectId !== null && cachedIssueTypeId !== null) {
    return { projectId: cachedProjectId, issueTypeId: cachedIssueTypeId };
  }
  const { data: projects } = await api.get<ResultMessage<{ id: number; code: string }[]>>(
    '/workflow-service/v1/project',
  );
  const project = projects.data.find((p) => p.code === LEAVE_PROJECT_CODE);
  if (!project) throw new Error('Leave (HR) project not found');
  const { data: issueTypes } = await api.get<ResultMessage<{ id: number; name: string }[]>>(
    `/workflow-service/v1/project/${project.id}/issue`,
  );
  const issueType = issueTypes.data.find((t) => t.name === LEAVE_ISSUE_TYPE_NAME);
  if (!issueType) throw new Error('Leave Request issue type not found');
  cachedProjectId = project.id;
  cachedIssueTypeId = issueType.id;
  return { projectId: project.id, issueTypeId: issueType.id };
}

async function resolveDefaultPriorityId(): Promise<number> {
  if (cachedPriorityId !== null) return cachedPriorityId;
  const { data } = await api.get<ResultMessage<{ id: number; name: string }[]>>(
    '/workflow-service/v1/priority',
  );
  const priority = data.data.find((p) => p.name === DEFAULT_PRIORITY_NAME) ?? data.data[0];
  if (!priority) throw new Error('No priority configured');
  cachedPriorityId = priority.id;
  return priority.id;
}

export async function fetchLeaveBalances(sub: string): Promise<LeaveBalance[]> {
  const { data } = await api.get<ResultMessage<LeaveBalance[]>>(
    `/employee-service/v1/employees/${sub}/leave-balance`,
  );
  return data.data ?? [];
}

export async function fetchMyLeaveRequests(): Promise<LeaveTicket[]> {
  const { issueTypeId } = await resolveLeaveIds();
  const { data } = await api.get<ResultMessage<PageResponse<LeaveTicket>>>(
    '/workflow-service/v1/ticket',
    { params: { page: 0, size: 50, issueTypeId } },
  );
  return data.data?.content ?? [];
}

export interface CreateLeaveRequestInput {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
}

export async function createLeaveRequest(input: CreateLeaveRequestInput): Promise<LeaveTicket> {
  const [{ projectId, issueTypeId }, priorityId] = await Promise.all([
    resolveLeaveIds(),
    resolveDefaultPriorityId(),
  ]);
  const { data } = await api.post<ResultMessage<LeaveTicket>>('/workflow-service/v1/ticket', {
    summary: `${input.leaveType} leave: ${input.startDate} to ${input.endDate}`,
    projectId,
    issueTypeId,
    priorityId,
    detail: input,
  });
  return data.data;
}
