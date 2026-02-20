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

export interface Priority {
    id: number;
    name: string;
    responseTime: number;
    resolutionTime: number;
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

export interface TicketSla {
    id: number;
    project: { id: number; name: string; code: string };
    issueType: { id: number; name: string };
    priority: { id: number; name: string; responseTime: number; resolutionTime: number };
    status: { id: number; name: string; color: string; group: string };
    summary: string;
    reporter: { sub: string; preferred_username?: string; name?: string };
    assignee: { sub: string; preferred_username?: string; name?: string } | null;
    sla: {
        id: number;
        ticketId: number;
        status: {
            response: string | null;
            isResponseOverdue: boolean | null;
            resolution: string | null;
            isResolutionOverdue: boolean | null;
        };
        priority: { id: number; name: string; responseTime: number; resolutionTime: number };
    } | null;
}