import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { fetchUsers, fetchOrgChart, fetchUserBySub, createUser } from "../api/iamApi";

export const userKeys = {
  lists:    (page: number, size: number) => ["users", "list", page, size] as const,
  orgChart: ()                           => ["users", "orgChart"]          as const,
};

export function useUsers(page: number, size: number) {
  return useQuery({
    queryKey: userKeys.lists(page, size),
    queryFn:  () => fetchUsers(page, size),
    placeholderData: keepPreviousData,
  });
}

export function useOrgChart() {
  return useQuery({
    queryKey: userKeys.orgChart(),
    queryFn:  fetchOrgChart,
    staleTime: 5 * 60 * 1000,
  });
}

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
