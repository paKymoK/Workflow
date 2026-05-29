import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  fetchOverviewStatistic,
  fetchTicketByIssueType,
  fetchTicketByProject,
  fetchSlaOverview,
  fetchSlaByStatus,
  fetchSlaByPriority,
  fetchTicketByApplication,
} from "../api/ticketApi";

// refetchKey is included in query keys so that incrementing it from the
// WebSocket handler triggers a fresh fetch without touching the socket code.
export const statisticKeys = {
  overview:       (from: string, to: string, k = 0) => ["stat", "overview",       from, to, k] as const,
  issueType:      (from: string, to: string, k = 0) => ["stat", "issueType",      from, to, k] as const,
  project:        (from: string, to: string, k = 0) => ["stat", "project",        from, to, k] as const,
  slaOverview:    (from: string, to: string, k = 0) => ["stat", "slaOverview",    from, to, k] as const,
  slaStatus:      (from: string, to: string, k = 0) => ["stat", "slaStatus",      from, to, k] as const,
  slaPriority:    (from: string, to: string, k = 0) => ["stat", "slaPriority",    from, to, k] as const,
  appHealth:      (from: string, to: string, k = 0) => ["stat", "appHealth",      from, to, k] as const,
};

export function useOverviewStatistic(from: string, to: string, refetchKey = 0) {
  return useQuery({
    queryKey:        statisticKeys.overview(from, to, refetchKey),
    queryFn:         () => fetchOverviewStatistic(from, to),
    placeholderData: keepPreviousData,
  });
}

export function useTicketByIssueType(from: string, to: string, refetchKey = 0) {
  return useQuery({
    queryKey:        statisticKeys.issueType(from, to, refetchKey),
    queryFn:         () => fetchTicketByIssueType(from, to),
    placeholderData: keepPreviousData,
  });
}

export function useTicketByProject(from: string, to: string, refetchKey = 0) {
  return useQuery({
    queryKey:        statisticKeys.project(from, to, refetchKey),
    queryFn:         () => fetchTicketByProject(from, to),
    placeholderData: keepPreviousData,
  });
}

export function useSlaOverview(from: string, to: string, refetchKey = 0) {
  return useQuery({
    queryKey:        statisticKeys.slaOverview(from, to, refetchKey),
    queryFn:         () => fetchSlaOverview(from, to),
    placeholderData: keepPreviousData,
  });
}

export function useSlaByStatus(from: string, to: string, refetchKey = 0) {
  return useQuery({
    queryKey:        statisticKeys.slaStatus(from, to, refetchKey),
    queryFn:         () => fetchSlaByStatus(from, to),
    placeholderData: keepPreviousData,
  });
}

export function useSlaByPriority(from: string, to: string, refetchKey = 0) {
  return useQuery({
    queryKey:        statisticKeys.slaPriority(from, to, refetchKey),
    queryFn:         () => fetchSlaByPriority(from, to),
    placeholderData: keepPreviousData,
  });
}

export function useTicketByApplication(from: string, to: string, refetchKey = 0) {
  return useQuery({
    queryKey:        statisticKeys.appHealth(from, to, refetchKey),
    queryFn:         () => fetchTicketByApplication(from, to),
    placeholderData: keepPreviousData,
  });
}
