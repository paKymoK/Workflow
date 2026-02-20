import type {PageResponse, ResultMessage, TicketSla} from "./types.ts";
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
