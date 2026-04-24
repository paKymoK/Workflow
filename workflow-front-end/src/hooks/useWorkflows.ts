import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWorkflows, fetchWorkflowById, updateWorkflow } from "../api/ticketApi";
import type { WorkflowUpdatePayload } from "../api/ticketApi";

export const workflowKeys = {
  lists:  ()                    => ["workflows", "list"]       as const,
  detail: (id: string | number) => ["workflows", "detail", id] as const,
};

export function useWorkflows() {
  return useQuery({
    queryKey: workflowKeys.lists(),
    queryFn:  fetchWorkflows,
  });
}

export function useWorkflow(id: string | number | undefined) {
  return useQuery({
    queryKey: workflowKeys.detail(id!),
    queryFn:  () => fetchWorkflowById(id!),
    enabled:  !!id,
  });
}

export function useUpdateWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: WorkflowUpdatePayload) => updateWorkflow(payload),
    onSuccess: (_, payload) => {
      qc.invalidateQueries({ queryKey: workflowKeys.detail(payload.id) });
      qc.invalidateQueries({ queryKey: workflowKeys.lists() });
    },
  });
}
