import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  fetchOverviewStatistic,
  fetchTicketByIssueType,
  fetchTicketByProject,
  fetchSlaOverview,
  fetchTicketByApplication,
  fetchTicketByApplicationTrend,
  fetchAvgResolutionByPriority,
} from "../api/ticketApi";

// refetchKey is included in query keys so that incrementing it from the
// WebSocket handler triggers a fresh fetch without touching the socket code.
export const statisticKeys = {
  overview:       (from: string, to: string, k = 0) => ["stat", "overview",       from, to, k] as const,
  issueType:      (from: string, to: string, k = 0) => ["stat", "issueType",      from, to, k] as const,
  project:        (from: string, to: string, k = 0) => ["stat", "project",        from, to, k] as const,
  slaOverview:    (from: string, to: string, k = 0) => ["stat", "slaOverview",    from, to, k] as const,
  appHealth:      (from: string, to: string, k = 0) => ["stat", "appHealth",      from, to, k] as const,
  appTrend:       (from: string, to: string, k = 0) => ["stat", "appTrend",       from, to, k] as const,
  avgResolution:  (from: string, to: string, k = 0) => ["stat", "avgResolution",  from, to, k] as const,
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

export function useTicketByApplication(from: string, to: string, refetchKey = 0) {
  return useQuery({
    queryKey:        statisticKeys.appHealth(from, to, refetchKey),
    queryFn:         () => fetchTicketByApplication(from, to),
    placeholderData: keepPreviousData,
  });
}

export function useTicketByApplicationTrend(from: string, to: string, refetchKey = 0) {
  return useQuery({
    queryKey:        statisticKeys.appTrend(from, to, refetchKey),
    queryFn:         () => fetchTicketByApplicationTrend(from, to),
    placeholderData: keepPreviousData,
  });
}

export function useAvgResolutionByPriority(from: string, to: string, refetchKey = 0) {
  return useQuery({
    queryKey:        statisticKeys.avgResolution(from, to, refetchKey),
    queryFn:         () => fetchAvgResolutionByPriority(from, to),
    placeholderData: keepPreviousData,
  });
}
