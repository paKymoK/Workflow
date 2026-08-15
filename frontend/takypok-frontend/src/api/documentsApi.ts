import type { PageResponse, ResultMessage } from "./types.ts";
import { api } from "@takypok/shared";

export type DocumentStatus = "ACTIVE" | "ARCHIVED";

export interface DocumentPost {
  id: number;
  category: string;
  title: string;
  version: string | null;
  content: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  status: DocumentStatus;
  acknowledgedByMe: boolean;
  acknowledgedCount: number;
  totalActiveEmployees: number;
  createdAt: string;
  modifiedAt: string;
}

export interface DocumentInput {
  category: string;
  title: string;
  version?: string | null;
  content?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
}

export async function fetchDocuments(category?: string, status?: DocumentStatus, page = 0, size = 50) {
  const { data } = await api.get<ResultMessage<PageResponse<DocumentPost>>>("/employee-service/v1/documents", {
    params: { category, status, page, size },
  });
  return data.data;
}

export async function createDocument(payload: DocumentInput) {
  const { data } = await api.post<ResultMessage<DocumentPost>>("/employee-service/v1/documents", payload);
  return data.data;
}

export async function updateDocument(id: number, payload: DocumentInput) {
  const { data } = await api.put<ResultMessage<DocumentPost>>(`/employee-service/v1/documents/${id}`, payload);
  return data.data;
}

export async function setDocumentArchived(id: number, archived: boolean) {
  const { data } = await api.patch<ResultMessage<DocumentPost>>(`/employee-service/v1/documents/${id}/archive`, {
    archived,
  });
  return data.data;
}
