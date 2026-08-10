import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  askInSession,
  createSession,
  deleteSession,
  getSessionMessages,
  listApplications,
  listSessions,
} from "../api/chatApi";

export const assistantKeys = {
  sessions: ["assistant", "sessions"] as const,
  messages: (sessionId: string) => ["assistant", "sessions", sessionId, "messages"] as const,
  applications: ["assistant", "applications"] as const,
};

/** Applications available to scope a new chat session to. */
export function useAssistantApplications(enabled = true) {
  return useQuery({
    queryKey: assistantKeys.applications,
    queryFn: listApplications,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

/** List of the current user's AI assistant chat threads, most-recent-first. */
export function useAssistantSessions(enabled = true) {
  return useQuery({
    queryKey: assistantKeys.sessions,
    queryFn: listSessions,
    enabled,
  });
}

/** Full turn history for one assistant session. */
export function useAssistantMessages(sessionId: string | null) {
  return useQuery({
    queryKey: assistantKeys.messages(sessionId ?? ""),
    queryFn: () => getSessionMessages(sessionId as string),
    enabled: !!sessionId,
    retry: false,
  });
}

export function useCreateAssistantSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (application: string) => createSession(application),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assistantKeys.sessions, exact: true });
    },
  });
}

/** Ask a question within a session; persists both turns server-side. */
export function useAskInSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, question }: { sessionId: string; question: string }) =>
      askInSession(sessionId, question),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: assistantKeys.sessions, exact: true });
      queryClient.invalidateQueries({ queryKey: assistantKeys.messages(variables.sessionId) });
    },
  });
}

export function useDeleteAssistantSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => deleteSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assistantKeys.sessions, exact: true });
    },
  });
}
