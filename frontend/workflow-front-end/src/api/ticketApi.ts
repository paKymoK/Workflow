import type {PageResponse, ResultMessage, TicketSla, Project, Priority, IssueType, IssueTypeUpdateRequest, CreateTicketRequest, Comment, UploadFile, StatisticItem, SlaOverviewStatistic, ApplicationTicketStatistic, ApplicationTrendPoint, AvgResolutionByPriority, TicketByIssueType, Workflow, WorkflowStatus, StatusCreateRequest, StatusUpdateRequest, PriorityCreateRequest, PriorityUpdateRequest, ProjectCreateRequest, ProjectUpdateRequest, FunctionResponse, WorkflowCreateRequest, TransitionRequest, AuditLog } from "./types.ts";
import { api } from "@takypok/shared";

export interface FilterTicketRequest {
    page: number;
    size: number;
    summary?: string;
    statusId?: number;
    priorityId?: number;
    issueTypeId?: number;
    projectId?: number;
    application?: string;
    assigneeSub?: string;
    sortBy?: "resolutionPercent" | "id" | "status" | "issueType" | "project" | "priority" | "assignee" | "summary";
    sortDir?: "asc" | "desc";
    /** Server-resolved scope: tickets reported by the caller's direct reports, e.g. leave requests pending my approval. */
    myTeamOnly?: boolean;
}

export async function fetchTickets(params: FilterTicketRequest) {
    const { data } = await api.get<ResultMessage<PageResponse<TicketSla>>>(
        "/workflow-service/v1/ticket",
        { params },
    );
    return data.data;
}

export async function fetchTicketById(id: string|number) {
    const { data } = await api.get<ResultMessage<TicketSla>>(
        `/workflow-service/v1/ticket/${id}`,
    );
    return data.data;
}

export async function fetchProjects() {
    const { data } = await api.get<ResultMessage<Project[]>>(
        "/workflow-service/v1/project",
    );
    return data.data;
}

export async function fetchPriorities() {
    const { data } = await api.get<ResultMessage<Priority[]>>(
        "/workflow-service/v1/priority",
    );
    return data.data;
}

export async function fetchStatuses() {
    const { data } = await api.get<ResultMessage<WorkflowStatus[]>>(
        "/workflow-service/v1/status",
    );
    return data.data;
}

export async function fetchIssueTypes(projectId: number) {
    const { data } = await api.get<ResultMessage<IssueType[]>>(
        `/workflow-service/v1/project/${projectId}/issue`,
    );
    return data.data;
}

export async function fetchApplications() {
    const { data } = await api.get<ResultMessage<string[]>>(
        "/workflow-service/v1/application",
    );
    return data.data;
}

export async function createStatus(payload: StatusCreateRequest) {
    const { data } = await api.post<ResultMessage<WorkflowStatus>>(
        "/workflow-service/v1/status",
        payload,
    );
    return data.data;
}

export async function updateStatus(payload: StatusUpdateRequest) {
    const { data } = await api.put<ResultMessage<WorkflowStatus>>(
        "/workflow-service/v1/status",
        payload,
    );
    return data.data;
}

export async function deleteStatus(id: number) {
    const { data } = await api.delete<ResultMessage<void>>(
        `/workflow-service/v1/status/${id}`,
    );
    return data;
}

export async function createPriority(payload: PriorityCreateRequest) {
    const { data } = await api.post<ResultMessage<Priority>>(
        "/workflow-service/v1/priority",
        payload,
    );
    return data.data;
}

export async function updatePriority(payload: PriorityUpdateRequest) {
    const { data } = await api.put<ResultMessage<Priority>>(
        "/workflow-service/v1/priority",
        payload,
    );
    return data.data;
}

export async function deletePriority(id: number) {
    const { data } = await api.delete<ResultMessage<void>>(
        `/workflow-service/v1/priority/${id}`,
    );
    return data;
}

export async function createProject(payload: ProjectCreateRequest) {
    const { data } = await api.post<ResultMessage<Project>>(
        "/workflow-service/v1/project",
        payload,
    );
    return data.data;
}

export async function updateProject(payload: ProjectUpdateRequest) {
    const { data } = await api.put<ResultMessage<Project>>(
        "/workflow-service/v1/project",
        payload,
    );
    return data.data;
}

export async function deleteProject(id: number) {
    const { data } = await api.delete<ResultMessage<void>>(
        `/workflow-service/v1/project/${id}`,
    );
    return data;
}

export async function createTicket(payload: CreateTicketRequest) {
    const { data } = await api.post<ResultMessage<TicketSla>>(
        "/workflow-service/v1/ticket",
        payload,
    );
    return data.data;
}

export async function pauseTicket(id: string | number) {
    const { data } = await api.post<ResultMessage<void>>(
        `/workflow-service/v1/ticket/pause/${id}`,
    );
    return data;
}

export async function resumeTicket(id: string | number) {
    const { data } = await api.post<ResultMessage<void>>(
        `/workflow-service/v1/ticket/resume/${id}`,
    );
    return data;
}

export interface VideoJobResponse {
  videoId: string;
  jobId: string;
  status: "QUEUED" | "PROCESSING" | "DONE" | "FAILED";
  message?: string;
  errorMessage?: string;
  createdAt?: string;
  completedAt?: string;
  hlsUrl?: string;
}

export async function uploadVideo(file: File) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<VideoJobResponse>("/media-service/v1/videos/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function fetchJobStatus(jobId: string) {
  const { data } = await api.get<VideoJobResponse>(`/media-service/v1/jobs/${jobId}`);
  return data;
}

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 5 * 60_000;

/**
 * Polls media-service's transcode job until it settles. Mirrors mobile's mediaApi.ts —
 * callers should only ever persist a videoId once this resolves to DONE, since there's no
 * endpoint to flip a saved record from PROCESSING to READY after the fact.
 */
export async function waitForVideoReady(jobId: string): Promise<VideoJobResponse> {
  const start = Date.now();
  for (;;) {
    const status = await fetchJobStatus(jobId);
    if (status.status === "DONE" || status.status === "FAILED") return status;
    if (Date.now() - start > POLL_TIMEOUT_MS) {
      throw new Error("Video processing timed out");
    }
    await new Promise<void>((resolve) => setTimeout(() => resolve(), POLL_INTERVAL_MS));
  }
}

export async function uploadFile(file: File) {
    const form = new FormData();
    form.append("file", file);
    const { data } = await api.post<UploadFile>("/media-service/v1/upload/single", form, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
}

export function getFileUrl(id: string, extension: string) {
    return `${import.meta.env.VITE_API_BASE_URL}/media-service/images/${id}${extension}`;
}

export async function fetchComments(ticketId: string | number) {
    const { data } = await api.get<ResultMessage<Comment[]>>(
        `/workflow-service/v1/ticket/${ticketId}/comment`,
    );
    return data.data;
}

export async function createComment(ticketId: string | number, content: string) {
    const { data } = await api.post<ResultMessage<Comment>>(
        `/workflow-service/v1/ticket/${ticketId}/comment`,
        { content },
    );
    return data.data;
}

export async function updateComment(ticketId: string | number, id: string, content: string) {
    const { data } = await api.put<ResultMessage<Comment>>(
        `/workflow-service/v1/ticket/${ticketId}/comment/${id}`,
        { content },
    );
    return data.data;
}

export interface UserSummary {
    sub: string;
    name: string;
    email: string;
    avatar?: string | null;
}

export async function searchMentions(q: string): Promise<UserSummary[]> {
    const { data } = await api.get<ResultMessage<UserSummary[]>>("/workflow-service/v1/mention/search", { params: { q } });
    return data.data;
}

interface EmployeeRecord {
    sub:       string;
    name:      string;
    email:     string | null;
    avatarUrl: string | null;
}

function toUserSummary(e: EmployeeRecord): UserSummary {
    return { sub: e.sub, name: e.name, email: e.email ?? "", avatar: e.avatarUrl };
}

export async function fetchUsers(q: string, size = 10): Promise<UserSummary[]> {
    const { data } = await api.get<ResultMessage<{ content: EmployeeRecord[] }>>(
        "/employee-service/v1/employees",
        { params: { q, size } },
    );
    return (data.data?.content ?? []).map(toUserSummary);
}

export async function fetchUserBySub(sub: string): Promise<UserSummary | null> {
    try {
        const { data } = await api.get<ResultMessage<EmployeeRecord>>(`/employee-service/v1/employees/${sub}`);
        return data.data ? toUserSummary(data.data) : null;
    } catch {
        return null;
    }
}

export async function updateMyAvatar(sub: string, avatar: string): Promise<UserSummary> {
    const { data } = await api.patch<ResultMessage<EmployeeRecord>>(
        `/employee-service/v1/employees/${sub}/avatar`,
        { avatarUrl: avatar },
    );
    return toUserSummary(data.data);
}

export async function fetchTicketByIssueType(from?: string, to?: string) {
    const { data } = await api.get<ResultMessage<TicketByIssueType[]>>(
        "/workflow-service/v1/statistic/ticket-by-issue-type",
        { params: { from, to } },
    );
    return data.data;
}

export async function fetchOverviewStatistic(from?: string, to?: string) {
    const { data } = await api.get<ResultMessage<StatisticItem[]>>(
        "/workflow-service/v1/statistic/overview",
        { params: { from, to } },
    );
    return data.data;
}

export async function fetchTicketByProject(from?: string, to?: string) {
    const { data } = await api.get<ResultMessage<StatisticItem[]>>(
        "/workflow-service/v1/statistic/ticket-by-project",
        { params: { from, to } },
    );
    return data.data;
}

export async function fetchAllIssueTypes() {
    const { data } = await api.get<ResultMessage<IssueType[]>>(
        "/workflow-service/v1/issue",
    );
    return data.data;
}

export async function fetchSlaOverview(from?: string, to?: string) {
    const { data } = await api.get<ResultMessage<SlaOverviewStatistic>>(
        "/workflow-service/v1/statistic/sla-overview",
        { params: { from, to } },
    );
    return data.data;
}

export async function fetchTicketByApplicationTrend(from?: string, to?: string) {
    const { data } = await api.get<ResultMessage<ApplicationTrendPoint[]>>(
        "/workflow-service/v1/statistic/ticket-by-application-trend",
        { params: { from, to } },
    );
    return data.data;
}

export async function fetchTicketByApplication(from?: string, to?: string) {
    const { data } = await api.get<ResultMessage<ApplicationTicketStatistic[]>>(
        "/workflow-service/v1/statistic/ticket-by-application",
        { params: { from, to } },
    );
    return data.data;
}

export async function fetchAvgResolutionByPriority(from?: string, to?: string) {
    const { data } = await api.get<ResultMessage<AvgResolutionByPriority[]>>(
        "/workflow-service/v1/statistic/avg-resolution-by-priority",
        { params: { from, to } },
    );
    return data.data;
}

export async function fetchValidators() {
    const { data } = await api.get<ResultMessage<FunctionResponse[]>>(
        "/workflow-service/v1/function/validator",
    );
    return data.data;
}

export async function fetchPostFunctions() {
    const { data } = await api.get<ResultMessage<FunctionResponse[]>>(
        "/workflow-service/v1/function/postfunction",
    );
    return data.data;
}

export async function createWorkflow(payload: WorkflowCreateRequest) {
    const { data } = await api.post<ResultMessage<Workflow>>(
        "/workflow-service/v1/workflow",
        payload,
    );
    return data.data;
}

export async function fetchWorkflows() {
    const { data } = await api.get<ResultMessage<Workflow[]>>(
        "/workflow-service/v1/workflow",
    );
    return data.data;
}

export async function fetchWorkflowById(id: string | number) {
    const { data } = await api.get<ResultMessage<Workflow>>(
        `/workflow-service/v1/workflow/${id}`,
    );
    return data.data;
}

export interface WorkflowUpdatePayload {
  id: number;
  name: string;
  statuses: { id: number; name: string; color: string; group: string; x: number; y: number }[];
  transitions: { name: string; from: number; to: number; validator: string[]; postFunctions: string[] }[];
}

export async function updateWorkflow(payload: WorkflowUpdatePayload) {
  const { data } = await api.put<ResultMessage<Workflow>>(
    "/workflow-service/v1/workflow",
    payload,
  );
  return data.data;
}

export interface ExportTicketRequest {
    summary?: string;
    statusId?: number;
    priorityId?: number;
    assigneeSub?: string;
}

export async function exportTickets(params?: ExportTicketRequest): Promise<void> {
    const { data } = await api.get("/workflow-service/v1/ticket/export", {
        params,
        responseType: "blob",
    });
    const url = window.URL.createObjectURL(data);
    const a   = document.createElement("a");
    a.href     = url;
    a.download = "tickets.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
}

export async function updateIssueType(id: number, payload: IssueTypeUpdateRequest) {
    const { data } = await api.put<ResultMessage<IssueType>>(
        `/workflow-service/v1/issue/${id}`,
        payload,
    );
    return data.data;
}

export async function updateAssignee(ticketId: string | number, payload: { sub: string }) {
    const { data } = await api.patch<ResultMessage<void>>(
        `/workflow-service/v1/ticket/${ticketId}/assignee`,
        payload,
    );
    return data;
}

export interface AssigneeLoad {
    assigneeSub: string;
    openCount: number;
}

export async function fetchAssigneeLoad(): Promise<AssigneeLoad[]> {
    const { data } = await api.get<ResultMessage<AssigneeLoad[]>>(
        "/workflow-service/v1/ticket/assignee-load",
    );
    return data.data ?? [];
}

export async function fetchRecentAuditLog(): Promise<AuditLog[]> {
    const { data } = await api.get<ResultMessage<AuditLog[]>>(
        "/workflow-service/v1/ticket/audit",
    );
    return data.data;
}

export async function fetchAuditLog(ticketId: string | number): Promise<AuditLog[]> {
    const { data } = await api.get<ResultMessage<AuditLog[]>>(
        `/workflow-service/v1/ticket/${ticketId}/audit`,
    );
    return data.data;
}

export async function transitionTicket(payload: TransitionRequest) {
    const { data } = await api.post<ResultMessage<void>>(
        `/workflow-service/v1/ticket/transition`,
        payload,
    );
    return data;
}
