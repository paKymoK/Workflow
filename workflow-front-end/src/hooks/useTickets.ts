import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  fetchTickets, fetchTicketById,
  fetchPriorities, fetchProjects, fetchIssueTypes,
  createTicket, pauseTicket, resumeTicket, transitionTicket,
} from "../api/ticketApi";
import type { FilterTicketRequest } from "../api/ticketApi";

// ── Query key factory ────────────────────────────────────────────────────────
// Centralised keys make it easy to invalidate related queries precisely.
export const ticketKeys = {
  all:        ()                         => ["tickets"]                           as const,
  lists:      ()                         => ["tickets", "list"]                   as const,
  list:       (p: FilterTicketRequest)   => ["tickets", "list", p]                as const,
  details:    ()                         => ["tickets", "detail"]                 as const,
  detail:     (id: string | number)      => ["tickets", "detail", id]             as const,
  priorities: ()                         => ["priorities"]                        as const,
  projects:   ()                         => ["projects"]                          as const,
  issueTypes: (projectId: number)        => ["issueTypes", projectId]             as const,
};

// ── Queries ──────────────────────────────────────────────────────────────────

/** Paginated + filtered ticket list. keepPreviousData keeps old rows visible while fetching. */
export function useTicketList(params: FilterTicketRequest) {
  return useQuery({
    queryKey: ticketKeys.list(params),
    queryFn:  () => fetchTickets(params),
    placeholderData: keepPreviousData,
  });
}

/** Single ticket by id. Disabled when id is falsy. */
export function useTicket(id: string | number | undefined) {
  return useQuery({
    queryKey: ticketKeys.detail(id!),
    queryFn:  () => fetchTicketById(id!),
    enabled:  !!id,
  });
}

/** Priority list — treated as static reference data (fetched once, never re-fetched). */
export function usePriorities() {
  return useQuery({
    queryKey: ticketKeys.priorities(),
    queryFn:  fetchPriorities,
    staleTime: Infinity,
  });
}

/** Project list — also static reference data. */
export function useProjects() {
  return useQuery({
    queryKey: ticketKeys.projects(),
    queryFn:  fetchProjects,
    staleTime: Infinity,
  });
}

/** Issue types for a project. Only runs when projectId is non-null. */
export function useIssueTypes(projectId: number | null) {
  return useQuery({
    queryKey: ticketKeys.issueTypes(projectId!),
    queryFn:  () => fetchIssueTypes(projectId!),
    enabled:  projectId !== null,
  });
}

// ── Mutations ────────────────────────────────────────────────────────────────

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTicket,
    onSuccess: () => {
      // Invalidate every ticket list so the new ticket appears
      qc.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
}

export function usePauseTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: pauseTicket,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ticketKeys.lists() });
      qc.invalidateQueries({ queryKey: ticketKeys.detail(id) });
    },
  });
}

export function useResumeTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: resumeTicket,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ticketKeys.lists() });
      qc.invalidateQueries({ queryKey: ticketKeys.detail(id) });
    },
  });
}

export function useTransitionTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      currentStatusId,
      transitionName,
    }: {
      ticketId: string | number;
      currentStatusId: number;
      transitionName: string;
    }) => transitionTicket(ticketId, currentStatusId, transitionName),
    onSuccess: (_, { ticketId }) => {
      qc.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
    },
  });
}
