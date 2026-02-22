import type {PageResponse, ResultMessage, TicketSla, Project, Priority, IssueType, CreateTicketRequest, Comment, UploadFile, StatisticItem, TicketByIssueType} from "./types.ts";
import api from "./axios.ts";

export async function fetchTickets(page: number, size: number) {
    const { data } = await api.get<ResultMessage<PageResponse<TicketSla>>>(
        "/workflow-service/v1/ticket",
        { params: { page, size } },
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

export async function fetchTicketByIssueType() {
    const { data } = await api.get<ResultMessage<TicketByIssueType[]>>(
        "/workflow-service/v1/statistic/ticket-by-issue-type",
    );
    return data.data;
}

export async function fetchOverviewStatistic() {
    const { data } = await api.get<ResultMessage<StatisticItem[]>>(
        "/workflow-service/v1/statistic/overview",
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
