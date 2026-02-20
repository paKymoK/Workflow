import type {PageResponse, ResultMessage, TicketSla, Project, Priority, IssueType, CreateTicketRequest} from "./types.ts";
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
