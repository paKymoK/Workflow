import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClientRoles, assignClientRole, removeClientRole } from "../api/ticketApi";
import type { ClientRoleAssignmentRequest } from "../api/types";

const key = (clientId: string) => ["clientRoles", clientId] as const;

export function useClientRoles(clientId: string) {
  return useQuery({
    queryKey: key(clientId),
    queryFn: () => fetchClientRoles(clientId),
    enabled: !!clientId,
  });
}

export function useAssignClientRole(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ClientRoleAssignmentRequest) => assignClientRole(clientId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(clientId) }),
  });
}

export function useRemoveClientRole(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: string) => removeClientRole(clientId, assignmentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(clientId) }),
  });
}
