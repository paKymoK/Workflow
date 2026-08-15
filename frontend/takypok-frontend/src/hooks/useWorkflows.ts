import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWorkflows, fetchWorkflowById, updateWorkflow, createWorkflow, fetchValidators, fetchPostFunctions } from "../api/ticketApi";
import type { WorkflowUpdatePayload } from "../api/ticketApi";
import type { WorkflowCreateRequest } from "../api/types";

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

export function useCreateWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: WorkflowCreateRequest) => createWorkflow(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workflowKeys.lists() });
    },
  });
}

export function useValidators() {
  return useQuery({
    queryKey: ["functions", "validators"],
    queryFn:  fetchValidators,
    staleTime: Infinity,
  });
}

export function usePostFunctions() {
  return useQuery({
    queryKey: ["functions", "postfunctions"],
    queryFn:  fetchPostFunctions,
    staleTime: Infinity,
  });
}
