import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchComments, createComment } from "../api/ticketApi";

export const commentKeys = {
  list: (ticketId: string | number) => ["comments", ticketId] as const,
};

/** Fetch all comments for a ticket. */
export function useComments(ticketId: string | number | undefined) {
  return useQuery({
    queryKey: commentKeys.list(ticketId!),
    queryFn:  () => fetchComments(ticketId!),
    enabled:  !!ticketId,
  });
}

/** Post a new comment; invalidates the comment list on success. */
export function useCreateComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, content }: { ticketId: string | number; content: string }) =>
      createComment(ticketId, content),
    onSuccess: (_, { ticketId }) => {
      qc.invalidateQueries({ queryKey: commentKeys.list(ticketId) });
    },
  });
}
