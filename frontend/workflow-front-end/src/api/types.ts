export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ResultMessage<T> {
  status: { code: string; message: string };
  data: T;
}

export interface Project {
  id: number;
  name: string;
  code: string;
  workflowId: number;
}

export interface ProjectCreateRequest {
  name: string;
  code: string;
  workflowId: number;
}

export interface ProjectUpdateRequest extends ProjectCreateRequest {
  id: number;
}

export interface Priority {
  id: number;
  name: string;
  responseTime: number;
  resolutionTime: number;
}

export interface PriorityCreateRequest {
  name: string;
  responseTime: number;
  resolutionTime: number;
}

export interface PriorityUpdateRequest extends PriorityCreateRequest {
  id: number;
}

export interface IssueType {
  id: number;
  name: string;
  projectId: number;
}

export interface CreateTicketRequest {
  summary: string;
  projectId: number;
  issueTypeId: number;
  priority: number;
  detail: {
    data: string;
  };
}

export interface UploadFile {
  id: string;
  name: string;
  extension: string;
}

export interface Comment {
  id: string;
  ticketId: number;
  commenter: { name: string; email: string };
  content: string;
}

export interface WorkflowStatus {
  id: number;
  name: string;
  color: string;
  group: string;
  x: number;
  y: number;
}

export interface StatusCreateRequest {
  name: string;
  color: string;
  group: string;
}

export interface StatusUpdateRequest extends StatusCreateRequest {
  id: number;
}

export interface WorkflowTransition {
  name: string;
  from: WorkflowStatus;
  to: WorkflowStatus;
  validator: string[];
  postFunctions: string[];
}

export interface Workflow {
  id: number;
  name: string;
  statuses: WorkflowStatus[];
  transitions: WorkflowTransition[];
}

export interface User {
  sub: string;
  name: string;
  email: string;
  title: string;
  department: string;
  avatar?: string | null;
}

export type UserDetail = User;

export interface GroupMember {
  sub: string;
  name: string;
  email: string | null;
}

export interface UserGroup {
  id: string;
  name: string;
  description: string | null;
  members: GroupMember[];
}

export interface UserGroupRequest {
  name: string;
  description?: string;
}

export interface ClientRoleAssignment {
  id: string;
  registeredClientId: string;
  type: "USER" | "GROUP";
  subjectId: string;
  subjectName: string;
  role: string;
}

export interface ClientRoleAssignmentRequest {
  userSub?: string;
  groupId?: string;
  role: string;
}

export interface RegisteredClient {
  id: string;
  clientId: string;
  clientName: string;
  clientIdIssuedAt: string | null;
  hasSecret: boolean;
  authenticationMethods: string[];
  grantTypes: string[];
  redirectUris: string[];
  postLogoutRedirectUris: string[];
  scopes: string[];
  requireAuthorizationConsent: boolean;
  requireProofKey: boolean;
  accessTokenTtlMinutes: number;
  refreshTokenTtlDays: number;
  reuseRefreshTokens: boolean;
}

export interface RegisteredClientRequest {
  clientId: string;
  clientName?: string;
  clientSecret?: string;
  authenticationMethods: string[];
  grantTypes: string[];
  redirectUris: string[];
  postLogoutRedirectUris: string[];
  scopes: string[];
  requireAuthorizationConsent: boolean;
  requireProofKey: boolean;
  accessTokenTtlMinutes: number;
  refreshTokenTtlDays: number;
  reuseRefreshTokens: boolean;
}

export interface StatisticItem {
  name: string;
  value: number;
}

export interface TicketByIssueType {
  name: string;
  [status: string]: string | number;
}

export interface SlaStatusDistribution {
  responseStatus: string;
  resolutionStatus: string;
  count: number;
}

export interface SlaPriorityDistribution {
  priorityName: string;
  "Response Overdue": number;
  "Resolution Overdue": number;
  Success: number;
  total: number;
}

export interface TicketSla {
  id: number;
  createdAt: string;
  project: { id: number; name: string; code: string; workflowId: number };
  issueType: { id: number; name: string; projectId: number };
  priority: {
    id: number;
    name: string;
    responseTime: number;
    resolutionTime: number;
  };
  status: WorkflowStatus;
  summary: string;
  reporter: { name: string; email: string };
  assignee: { name: string; email: string } | null;
  detail: { data: string } | null;
  workflow: {
    id: number;
    name: string;
    statuses: WorkflowStatus[];
    transitions: WorkflowTransition[];
  } | null;
  sla: {
    id: number;
    ticketId: number;
    status: {
      response: string | null;
      isResponseOverdue: boolean | null;
      resolution: string | null;
      isResolutionOverdue: boolean | null;
    };
    isPaused: boolean | null;
    pausedTime: { pausedTime: string; resumeTime: string | null }[];
    priority: {
      id: number;
      name: string;
      responseTime: number;
      resolutionTime: number;
    };
    setting: {
      timezone: string;
      workStart: string;
      workEnd: string;
      lunchStart: string;
      lunchEnd: string;
      weekend: number[];
    };
  } | null;
}
