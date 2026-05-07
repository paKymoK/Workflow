import { useMutation, useQuery } from "@tanstack/react-query";
import { uploadFile, uploadVideo, fetchJobStatus } from "../api/ticketApi";

export function useUploadFile() {
  return useMutation({
    mutationFn: (file: File) => uploadFile(file),
  });
}

export function useUploadVideo() {
  return useMutation({
    mutationFn: (file: File) => uploadVideo(file),
  });
}

export function useJobStatus(jobId: string | null) {
  return useQuery({
    queryKey: ["job", jobId],
    queryFn: () => fetchJobStatus(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "DONE" || status === "FAILED") return false;
      return 3000;
    },
  });
}
