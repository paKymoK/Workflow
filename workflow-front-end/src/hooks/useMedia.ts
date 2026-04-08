import { useMutation } from "@tanstack/react-query";
import { uploadFile } from "../api/ticketApi";

/** Upload a single file; returns the UploadFile response on success. */
export function useUploadFile() {
  return useMutation({
    mutationFn: (file: File) => uploadFile(file),
  });
}
