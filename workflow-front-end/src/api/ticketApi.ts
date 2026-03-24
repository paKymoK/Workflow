import type {PageResponse, ResultMessage, TicketSla, Project, Priority, IssueType, CreateTicketRequest, Comment, UploadFile, StatisticItem, TicketByIssueType, SlaStatusDistribution, SlaPriorityDistribution, Workflow, User, UserDetail} from "./types.ts";
import type { OrgChartUser } from "../utils/buildOrgChart";
import api from "./axios.ts";

export interface FilterTicketRequest {
    page: number;
    size: number;
    summary?: string;
    statusId?: number;
    priorityId?: number;
    assigneeEmail?: string;
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

export async function fetchIssueTypes(projectId: number) {
    const { data } = await api.get<ResultMessage<IssueType[]>>(
        `/workflow-service/v1/project/${projectId}/issue`,
    );
    return data.data;
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
    const { data } = await api.get<Comment[]>(
        `/media-service/v1/comment/${ticketId}`,
    );
    return data;
}

export async function createComment(ticketId: string | number, content: string) {
    const { data } = await api.post<ResultMessage<void>>(
        "/media-service/v1/comment",
        { ticketId, content },
    );
    return data;
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

export async function fetchSlaByStatus(from?: string, to?: string) {
    const { data } = await api.get<ResultMessage<SlaStatusDistribution[]>>(
        "/workflow-service/v1/statistic/sla-by-status",
        { params: { from, to } },
    );
    return data.data;
}

export async function fetchSlaByPriority(from?: string, to?: string) {
    const { data } = await api.get<ResultMessage<SlaPriorityDistribution[]>>(
        "/workflow-service/v1/statistic/sla-by-priority",
        { params: { from, to } },
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

export async function createUser(payload: {
  username: string;
  password: string;
  userinfo: { name: string; email: string; title: string; department: string };
}) {
  const { data } = await api.post<ResultMessage<void>>("/auth-service/v1/users", payload);
  return data;
}

export async function fetchUsers(page = 0, size = 10) {
  const { data } = await api.get<ResultMessage<PageResponse<User>>>("/auth-service/v1/users", {
    params: { page, size },
  });
  return data.data;
}

export async function fetchUserBySub(sub: string) {
  const { data } = await api.get<ResultMessage<UserDetail>>(`/auth-service/v1/users/${sub}`);
  return data.data;
}

export async function fetchOrgChart() {
  const { data } = await api.get<ResultMessage<OrgChartUser[]>>(
    "/auth-service/v1/organization/chart",
  );
  return data.data;
}

export async function transitionTicket(ticketId: string | number, currentStatusId: number, transitionName: string) {
    const { data } = await api.post<ResultMessage<void>>(
        `/workflow-service/v1/ticket/transition`,
        { ticketId, currentStatusId, transitionName },
    );
    return data;
}
