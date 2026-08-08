import { fetchProjects, fetchIssueTypes, fetchTickets, transitionTicket } from "./ticketApi";
import type { TicketSla } from "./types";

export const LEAVE_PROJECT_CODE = "HR";
export const LEAVE_ISSUE_TYPE_NAME = "Leave Request";

export interface LeaveDetail {
  leaveType: "ANNUAL" | "SICK" | "PERSONAL" | "UNPAID" | "MATERNITY";
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
  attachmentUrl?: string | null;
}

export type LeaveTicket = Omit<TicketSla, "detail"> & { detail: LeaveDetail | null };

let cachedLeaveIssueTypeId: number | null = null;

/** Resolves the DB-assigned id of the "Leave Request" issue type under the "HR" project. */
export async function resolveLeaveIssueTypeId(): Promise<number> {
  if (cachedLeaveIssueTypeId !== null) return cachedLeaveIssueTypeId;
  const projects = await fetchProjects();
  const project = projects?.find((p) => p.code === LEAVE_PROJECT_CODE);
  if (!project) throw new Error("Leave (HR) project not found");
  const issueTypes = await fetchIssueTypes(project.id);
  const issueType = issueTypes?.find((t) => t.name === LEAVE_ISSUE_TYPE_NAME);
  if (!issueType) throw new Error("Leave Request issue type not found");
  cachedLeaveIssueTypeId = issueType.id;
  return issueType.id;
}

/** Leave requests reported by the current user's direct reports, pending or decided. */
export async function fetchMyTeamLeaveRequests(page = 0, size = 50) {
  const issueTypeId = await resolveLeaveIssueTypeId();
  const result = await fetchTickets({ page, size, issueTypeId, myTeamOnly: true });
  return { ...result, content: (result?.content ?? []) as unknown as LeaveTicket[] };
}

export async function approveLeave(ticketId: number, currentStatusId: number) {
  return transitionTicket({ ticketId, currentStatusId, transitionName: "Approve" });
}

export async function rejectLeave(
  ticketId: number,
  currentStatusId: number,
  rejectionNote: string,
) {
  return transitionTicket({
    ticketId,
    currentStatusId,
    transitionName: "Reject",
    rejectionNote,
  });
}
