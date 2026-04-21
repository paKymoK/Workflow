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
}

export type UserDetail = User;

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

export interface ProductDetail {
  data: string;
}

export interface ShopProduct {
  id: number;
  name: string;
  type: string;
  imageUrl: string;
  detail: ProductDetail | null;
  stock: number;
  price: number;
  currency: string;
}

export interface FilterProductRequest {
  page: number;
  size: number;
  sortBy?: "id" | "price" | "name";
  sortDir?: "asc" | "desc";
}

export interface CartItem {
  productId: number;
  name: string;
  imageUrl: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  lineTotal: number;
}

export interface Cart {
  id: number;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

export interface UpsertCartItemRequest {
  productId: number;
  quantity: number;
}

export interface CheckoutResponse {
  cartId: number;
  totalItems: number;
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
