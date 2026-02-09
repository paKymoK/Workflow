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
function parseSSEEvents(buffer: string): { events: string[]; remaining: string } {
  // Handle both \r\n and \n line endings
  const normalized = buffer.replace(/\r\n/g, "\n");
  const parts = normalized.split("\n\n");
  const remaining = parts.pop()!;
  return { events: parts, remaining };
}

function extractEventData(event: string): string | null {
  const lines = event.split("\n");
  const dataLines: string[] = [];
  for (const line of lines) {
    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }
  return dataLines.length > 0 ? dataLines.join("") : null;
}

function unwrapTicket(parsed: unknown): TicketSla | TicketSla[] | null {
  if (!parsed || typeof parsed !== "object") return null;

  const obj = parsed as Record<string, unknown>;

  // Wrapped in ResultMessage: { status: {...}, data: ... }
  if ("status" in obj && "data" in obj && obj.data) {
    const inner = obj.data as Record<string, unknown>;
    // ResultMessage<PageResponse<TicketSla>>
    if ("content" in inner && Array.isArray(inner.content)) {
      return inner.content as TicketSla[];
    }
    // ResultMessage<TicketSla>
    if ("id" in inner) {
      return inner as unknown as TicketSla;
    }
    // ResultMessage<TicketSla[]>
    if (Array.isArray(inner)) {
      return inner as TicketSla[];
    }
    return null;
  }

  // Raw PageResponse: { content: [...], page: ... }
  if ("content" in obj && Array.isArray(obj.content)) {
    return obj.content as TicketSla[];
  }

  // Raw TicketSla: { id: ..., summary: ... }
  if ("id" in obj) {
    return obj as unknown as TicketSla;
  }

  return null;
}

async function connectSSE(
  url: string,
  onData: (json: string) => void,
  signal: AbortSignal,
) {
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const token = sessionStorage.getItem("access_token");

  const response = await fetch(`${baseURL}${url}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "text/event-stream",
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`SSE connection failed: ${response.status}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const { events, remaining } = parseSSEEvents(buffer);
    buffer = remaining;

    for (const event of events) {
      const data = extractEventData(event);
      if (data) {
        onData(data);
      }
    }
  }
}

export function streamTickets(
  onTicket: (ticket: TicketSla) => void,
  onError?: (error: Error) => void,
  onComplete?: () => void,
): AbortController {
  const controller = new AbortController();

  connectSSE(
    "/workflow-service/v1/ticket/stream",
    (json) => {
      try {
        const parsed = JSON.parse(json);
        const result = unwrapTicket(parsed);
        if (Array.isArray(result)) {
          result.forEach(onTicket);
        } else if (result) {
          onTicket(result);
        }
      } catch (e) {
        console.warn("[SSE] Failed to parse ticket stream event:", json, e);
      }
    },
    controller.signal,
  )
    .then(() => onComplete?.())
    .catch((err) => {
      if (err.name !== "AbortError") {
        onError?.(err);
      }
    });

  return controller;
}

export function streamTicketById(
  id: number,
  onTicket: (ticket: TicketSla) => void,
  onError?: (error: Error) => void,
  onComplete?: () => void,
): AbortController {
  const controller = new AbortController();

  connectSSE(
    `/workflow-service/v1/ticket/stream/id?id=${id}`,
    (json) => {
      try {
        const parsed = JSON.parse(json);
        const result = unwrapTicket(parsed);
        if (Array.isArray(result)) {
          if (result.length > 0) onTicket(result[0]);
        } else if (result) {
          onTicket(result);
        }
      } catch (e) {
        console.warn("[SSE] Failed to parse ticket detail event:", json, e);
      }
    },
    controller.signal,
  )
    .then(() => onComplete?.())
    .catch((err) => {
      if (err.name !== "AbortError") {
        onError?.(err);
      }
    });

  return controller;
}
