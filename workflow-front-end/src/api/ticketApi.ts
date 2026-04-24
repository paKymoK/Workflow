import type {PageResponse, ResultMessage, TicketSla, Project, Priority, IssueType, CreateTicketRequest, Comment, UploadFile, StatisticItem, TicketByIssueType, SlaStatusDistribution, SlaPriorityDistribution, Workflow, User, UserDetail, WorkflowStatus, StatusCreateRequest, StatusUpdateRequest, PriorityCreateRequest, PriorityUpdateRequest, ProjectCreateRequest, ProjectUpdateRequest, RegisteredClient, RegisteredClientRequest, UserGroup, UserGroupRequest, GroupMember, ClientRoleAssignment, ClientRoleAssignmentRequest} from "./types.ts";
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

// ── Groups ────────────────────────────────────────────────────────────────

export async function fetchGroups() {
  const { data } = await api.get<ResultMessage<UserGroup[]>>("/auth-service/v1/groups");
  return data.data;
}

export async function createGroup(payload: UserGroupRequest) {
  const { data } = await api.post<ResultMessage<UserGroup>>("/auth-service/v1/groups", payload);
  return data.data;
}

export async function updateGroup(id: string, payload: UserGroupRequest) {
  const { data } = await api.put<ResultMessage<UserGroup>>(`/auth-service/v1/groups/${id}`, payload);
  return data.data;
}

export async function deleteGroup(id: string) {
  const { data } = await api.delete<ResultMessage<void>>(`/auth-service/v1/groups/${id}`);
  return data;
}

export async function addGroupMember(groupId: string, userSub: string) {
  const { data } = await api.post<ResultMessage<void>>(`/auth-service/v1/groups/${groupId}/members`, { userSub });
  return data;
}

export async function removeGroupMember(groupId: string, userSub: string) {
  const { data } = await api.delete<ResultMessage<void>>(`/auth-service/v1/groups/${groupId}/members/${userSub}`);
  return data;
}

// ── Client role assignments ───────────────────────────────────────────────

export async function fetchClientRoles(clientId: string) {
  const { data } = await api.get<ResultMessage<ClientRoleAssignment[]>>(`/auth-service/v1/clients/${clientId}/roles`);
  return data.data;
}

export async function assignClientRole(clientId: string, payload: ClientRoleAssignmentRequest) {
  const { data } = await api.post<ResultMessage<ClientRoleAssignment>>(`/auth-service/v1/clients/${clientId}/roles`, payload);
  return data.data;
}

export async function removeClientRole(clientId: string, assignmentId: string) {
  const { data } = await api.delete<ResultMessage<void>>(`/auth-service/v1/clients/${clientId}/roles/${assignmentId}`);
  return data;
}

// ── Registered clients ────────────────────────────────────────────────────

export async function fetchClients() {
  const { data } = await api.get<ResultMessage<RegisteredClient[]>>("/auth-service/v1/clients");
  return data.data;
}

export async function createClient(payload: RegisteredClientRequest) {
  const { data } = await api.post<ResultMessage<RegisteredClient>>("/auth-service/v1/clients", payload);
  return data.data;
}

export async function updateClient(id: string, payload: RegisteredClientRequest) {
  const { data } = await api.put<ResultMessage<RegisteredClient>>(`/auth-service/v1/clients/${id}`, payload);
  return data.data;
}

export async function deleteClient(id: string) {
  const { data } = await api.delete<ResultMessage<void>>(`/auth-service/v1/clients/${id}`);
  return data;
}

export async function transitionTicket(ticketId: string | number, currentStatusId: number, transitionName: string) {
    const { data } = await api.post<ResultMessage<void>>(
        `/workflow-service/v1/ticket/transition`,
        { ticketId, currentStatusId, transitionName },
    );
    return data;
}
