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
  level: number;
}

export interface PriorityCreateRequest {
  name: string;
  responseTime: number;
  resolutionTime: number;
  level: number;
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

export type LinkType = "RELATED" | "CAUSED_BY" | "DUPLICATES";

export interface LinkedTicket {
  ticketId: number;
  type: LinkType;
}

export interface InternalApplicationDetail {
  application: string;
  description: string;
  attachment?: AttachmentRef[];
  department?: string;
  region?: string;
  location?: string;
  phoneNumber?: string;
}

export interface CreateTicketRequest {
  summary: string;
  projectId: number;
  issueTypeId: number;
  priorityId: number;
  detail: InternalApplicationDetail | null;
  linkedTickets?: LinkedTicket[];
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

export type AuditAction =
  | "TICKET_CREATED"
  | "STATUS_CHANGED"
  | "ASSIGNEE_CHANGED"
  | "SLA_PAUSED"
  | "SLA_RESUMED";

export interface AuditActor {
  sub: string;
  name: string;
  email: string | null;
}

export type ConversationType = "DIRECT" | "GROUP";
export type MessageType = "TEXT" | "IMAGE" | "VIDEO" | "MIXED";
export type MessageAttachmentType = "IMAGE" | "VIDEO";
export type MessageAttachmentStatus = "PROCESSING" | "READY" | "FAILED";

export interface MessageAttachment {
  type: MessageAttachmentType;
  mediaAssetId: string;
  url: string | null;
  status: MessageAttachmentStatus;
}

export interface ChatSender {
  sub: string;
  name: string;
  email?: string;
  avatar?: string | null;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  name: string | null;
}

export interface ReactionSummary {
  emoji: string;
  // Full list of reactor subs, not just a count — "mine" depends on the viewer, so each
  // client works that out itself by checking whether its own sub is in this list.
  subs: string[];
}

export interface ChatMessage {
  id: number;
  conversationId: string;
  sender: ChatSender;
  content: string | null;
  messageType: MessageType;
  attachments: MessageAttachment[] | null;
  createdAt: string;
  reactions: ReactionSummary[];
  // Null for a top-level message; set when this message is itself a reply (not shown in the
  // main thread, only inside the opened thread panel).
  parentMessageId: number | null;
  // Always 0 for a reply itself — no nested threads.
  replyCount: number;
}

export interface ConversationSummary {
  id: string;
  type: ConversationType;
  name: string | null;
  participantSubs: string[];
  lastMessage: ChatMessage | null;
  unreadCount: number;
  // Only populated for DIRECT — a GROUP has no single "the other participant" these
  // watermarks could unambiguously refer to.
  peerReadThroughMessageId: number | null;
  peerDeliveredThroughMessageId: number | null;
  // GROUP only — null for DIRECT. false = public, discoverable/self-joinable via
  // browsePublicChannels + joinChannel; true = today's invite-only behavior.
  privateChannel: boolean | null;
  // Whether the caller is this conversation's owner — only the owner may invite/remove other
  // GROUP members (enforced server-side). Meaningless for DIRECT.
  owner: boolean;
}

export interface PublicChannel {
  id: string;
  name: string;
  memberCount: number;
}

export interface PresenceStatus {
  online: boolean;
  lastSeenAt: string | null;
}

export interface ConversationListResponse {
  items: ConversationSummary[];
  hasMore: boolean;
  nextBefore: string | null;
  nextBeforeId: string | null;
}

export interface CreateConversationRequest {
  type: ConversationType;
  name?: string;
  participantSubs: string[];
  // GROUP only; omit/true = invite-only (today's behavior), false = public channel.
  privateChannel?: boolean;
}

export interface SendMessageRequest {
  content: string;
  messageType?: MessageType;
  attachments?: MessageAttachment[];
  // Set to reply within a thread instead of posting a new top-level message.
  parentMessageId?: number;
}

export interface AuditLog {
  id: number;
  ticketId: number;
  action: AuditAction;
  actor: AuditActor | null;
  payload: Record<string, unknown>;
  createdAt: string;
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
    level: number;
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
      level: number;
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
