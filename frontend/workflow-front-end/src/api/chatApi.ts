import { api } from "@takypok/shared";

export type AssistantRole = "USER" | "ASSISTANT";

export interface AssistantTurn {
  role: AssistantRole;
  content: string;
  sources: string[] | null;
  ts: string;
}

export interface AssistantSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface AskResult {
  answer: string;
  sources: string[];
}

export async function createSession(): Promise<AssistantSession> {
  const { data } = await api.post<AssistantSession>("/chat-service/assist/sessions");
  return data;
}

export async function listSessions(): Promise<AssistantSession[]> {
  const { data } = await api.get<AssistantSession[]>("/chat-service/assist/sessions");
  return data;
}

export async function getSessionMessages(sessionId: string): Promise<AssistantTurn[]> {
  const { data } = await api.get<AssistantTurn[]>(
    `/chat-service/assist/sessions/${sessionId}/messages`,
  );
  return data;
}

export async function askInSession(sessionId: string, question: string): Promise<AskResult> {
  const { data } = await api.post<AskResult>(`/chat-service/assist/sessions/${sessionId}/ask`, {
    question,
  });
  return data;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await api.delete(`/chat-service/assist/sessions/${sessionId}`);
}
