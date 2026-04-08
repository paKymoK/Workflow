import { useQuery } from "@tanstack/react-query";
import {
  fetchOverviewStatistic,
  fetchTicketByIssueType,
  fetchSlaByStatus,
  fetchSlaByPriority,
} from "../api/ticketApi";

// refetchKey is included in query keys so that incrementing it from the
// WebSocket handler triggers a fresh fetch without touching the socket code.
export const statisticKeys = {
  overview:    (from: string, to: string, k = 0) => ["stat", "overview",    from, to, k] as const,
  issueType:   (from: string, to: string, k = 0) => ["stat", "issueType",   from, to, k] as const,
  slaStatus:   (from: string, to: string, k = 0) => ["stat", "slaStatus",   from, to, k] as const,
  slaPriority: (from: string, to: string, k = 0) => ["stat", "slaPriority", from, to, k] as const,
};

export function useOverviewStatistic(from: string, to: string, refetchKey = 0) {
  return useQuery({
    queryKey: statisticKeys.overview(from, to, refetchKey),
    queryFn:  () => fetchOverviewStatistic(from, to),
  });
}

export function useTicketByIssueType(from: string, to: string, refetchKey = 0) {
  return useQuery({
    queryKey: statisticKeys.issueType(from, to, refetchKey),
    queryFn:  () => fetchTicketByIssueType(from, to),
  });
}

export function useSlaByStatus(from: string, to: string, refetchKey = 0) {
  return useQuery({
    queryKey: statisticKeys.slaStatus(from, to, refetchKey),
    queryFn:  () => fetchSlaByStatus(from, to),
  });
}

export function useSlaByPriority(from: string, to: string, refetchKey = 0) {
  return useQuery({
    queryKey: statisticKeys.slaPriority(from, to, refetchKey),
    queryFn:  () => fetchSlaByPriority(from, to),
  });
}
