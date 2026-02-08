import api from "./axios";

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
    time: number;
    status: {
      response: string | null;
      responseTime: string | null;
      resolution: string | null;
      resolutionTime: string | null;
    };
    priority: { id: number; name: string; responseTime: number; resolutionTime: number };
  } | null;
}

export async function fetchTickets(page: number, size: number) {
  const { data } = await api.get<ResultMessage<PageResponse<TicketSla>>>(
    "/workflow-service/v1/ticket",
    { params: { page, size } },
  );
  return data.data;
}

export async function fetchTicketById(id: number) {
  const { data } = await api.get<ResultMessage<TicketSla>>(
    `/workflow-service/v1/ticket/${id}`,
  );
  return data.data;
}
