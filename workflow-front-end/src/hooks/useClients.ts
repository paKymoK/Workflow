import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClients, createClient, updateClient, deleteClient } from "../api/ticketApi";

const KEY = ["clients"] as const;

export function useClients() {
  return useQuery({ queryKey: KEY, queryFn: fetchClients });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createClient,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: Parameters<typeof updateClient>[1] & { id: string }) =>
      updateClient(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteClient,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
