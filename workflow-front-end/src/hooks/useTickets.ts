import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  fetchTickets, fetchTicketById,
  fetchPriorities, fetchStatuses, fetchProjects, fetchIssueTypes,
  createTicket, pauseTicket, resumeTicket, transitionTicket,
  createStatus, updateStatus, deleteStatus,
  createPriority, updatePriority, deletePriority,
  createProject, updateProject, deleteProject,
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
  statuses:   ()                         => ["statuses"]                          as const,
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

/** Status list — treated as static reference data. */
export function useStatuses() {
  return useQuery({
    queryKey: ticketKeys.statuses(),
    queryFn:  fetchStatuses,
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

export function useCreateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createStatus,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ticketKeys.statuses() });
    },
  });
}

export function useUpdateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateStatus,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ticketKeys.statuses() });
    },
  });
}

export function useDeleteStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteStatus,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ticketKeys.statuses() });
    },
  });
}

export function useCreatePriority() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPriority,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ticketKeys.priorities() });
    },
  });
}

export function useUpdatePriority() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updatePriority,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ticketKeys.priorities() });
    },
  });
}

export function useDeletePriority() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePriority,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ticketKeys.priorities() });
    },
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ticketKeys.projects() });
    },
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateProject,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ticketKeys.projects() });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ticketKeys.projects() });
    },
  });
}
