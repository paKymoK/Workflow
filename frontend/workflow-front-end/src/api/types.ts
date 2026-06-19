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
}

export const PROJECT_CODE_INTERNAL = "IA";

export interface ProjectCreateRequest {
  name: string;
  code: string;
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
  code: string;
  projectId: number;
  workflowId: number;
}

export interface IssueTypeUpdateRequest {
  workflowId: number;
}

export interface AttachmentRef {
  id: string;
  name: string;
  extension: string;
}

export type RelationType = "relates to" | "blocks" | "is blocked by" | "duplicates";

export interface RelatedLink {
  type: RelationType;
  ticketId: number;
}

export interface InternalApplicationDetail {
  application: string;
  description: string;
  attachment?: AttachmentRef[];
  department?: string;
  region?: string;
  location?: string;
  phoneNumber?: string;
  relatedLinks?: RelatedLink[];
}

export interface CreateTicketRequest {
  summary: string;
  projectId: number;
  issueTypeId: number;
  priorityId: number;
  detail: InternalApplicationDetail | null;
}

export interface UploadFile {
  id: string;
  name: string;
  extension: string;
}

export interface Comment {
  id: string;
  ticketId: number;
  commenter: { sub: string; name: string; email: string };
  content: string;
  isEdited: boolean;
  modifiedAt?: string;
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

export interface FunctionResponse {
  name: string;
  value: string;
}

export interface WorkflowCreateRequest {
  name: string;
  statuses: number[];
  transitions: { name: string; from: number; to: number; validator: string[]; postFunctions: string[] }[];
}


export type PendingReason =
  | "AWAITING_USER"
  | "AWAITING_THIRD_PARTY"
  | "AWAITING_CHANGE"
  | "AWAITING_PARTS"
  | "SCHEDULED_MAINTENANCE";

export const PENDING_REASON_LABELS: Record<PendingReason, string> = {
  AWAITING_USER: "Awaiting User",
  AWAITING_THIRD_PARTY: "Awaiting Third Party",
  AWAITING_CHANGE: "Awaiting Change",
  AWAITING_PARTS: "Awaiting Parts / Procurement",
  SCHEDULED_MAINTENANCE: "Scheduled Maintenance",
};

export interface TransitionRequest {
  ticketId: number;
  currentStatusId: number;
  transitionName: string;
  pendingReason?: PendingReason;
  pendingDescription?: string;
}

export interface StatisticItem {
  name: string;
  value: number;
}

export interface ApplicationTrendPoint {
  date: string; // ISO datetime string, e.g. "2026-05-29T00:00:00+07:00"
  application: string;
  statusGroup: string;
  count: number;
}

export interface ApplicationTicketStatistic {
  application: string;
  total: number;
  open: number;
  inProgress: number;
  done: number;
  slaBreached: number;
}

export interface AvgResolutionByPriority {
  priorityId: number;
  priorityName: string;
  avgHours: number | null;
  avgResponseHours: number | null;
  count: number;
}

export interface SlaOverviewStatistic {
  responseInProgress: number;
  responseDoneInTime: number;
  responseMissed: number;
  resolutionInProgress: number;
  resolutionDoneInTime: number;
  resolutionMissed: number;
  total: number;
}

export interface TicketByIssueType {
  name: string;
  [status: string]: string | number;
}

export interface TicketSla {
  id: number;
  createdAt: string;
  project: { id: number; name: string; code: string };
  issueType: { id: number; name: string; code: string; projectId: number; workflowId: number };
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
  detail: { application?: string; description: string; attachment?: AttachmentRef[] } | null;
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
      resolutionPercent: number | null;
    };
    isPaused: boolean | null;
    pausedTime: {
      pausedTime: string;
      resumeTime: string | null;
      reason: PendingReason | null;
      description: string | null;
    }[];
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
