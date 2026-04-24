import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchGroups, createGroup, updateGroup, deleteGroup,
  addGroupMember, removeGroupMember,
} from "../api/ticketApi";
import type { UserGroupRequest } from "../api/types";

const KEY = ["groups"] as const;

export function useGroups() {
  return useQuery({ queryKey: KEY, queryFn: fetchGroups });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createGroup,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: UserGroupRequest & { id: string }) =>
      updateGroup(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteGroup,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useAddGroupMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userSub }: { groupId: string; userSub: string }) =>
      addGroupMember(groupId, userSub),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRemoveGroupMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userSub }: { groupId: string; userSub: string }) =>
      removeGroupMember(groupId, userSub),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
