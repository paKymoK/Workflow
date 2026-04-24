import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { fetchUsers, fetchOrgChart, fetchUserBySub, createUser } from "../api/ticketApi";

export const userKeys = {
  lists:    (page: number, size: number) => ["users", "list", page, size] as const,
  orgChart: ()                           => ["users", "orgChart"]          as const,
};

/** Paginated user list. */
export function useUsers(page: number, size: number) {
  return useQuery({
    queryKey: userKeys.lists(page, size),
    queryFn:  () => fetchUsers(page, size),
    placeholderData: keepPreviousData,
  });
}

/** Full org-chart tree — cached for 5 minutes. */
export function useOrgChart() {
  return useQuery({
    queryKey: userKeys.orgChart(),
    queryFn:  fetchOrgChart,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Imperative on-demand fetch of a single user (e.g. org-chart node click).
 * Using useMutation even though it's a GET because the call is user-triggered,
 * not a background fetch — this gives us isPending and per-call result state.
 */
export function useFetchUserBySub() {
  return useMutation({
    mutationFn: (sub: string) => fetchUserBySub(sub),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
