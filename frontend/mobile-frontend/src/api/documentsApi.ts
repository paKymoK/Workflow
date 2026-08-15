import { api } from './axios';

export type DocumentStatus = 'ACTIVE' | 'ARCHIVED';

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

interface ResultMessage<T> {
  status: { code: string; message: string };
  data: T;
}

interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export async function fetchDocuments(category?: string, status: DocumentStatus = 'ACTIVE'): Promise<DocumentPost[]> {
  const { data } = await api.get<ResultMessage<PageResponse<DocumentPost>>>('/employee-service/v1/documents', {
    params: { category, status, page: 0, size: 100 },
  });
  return data.data.content;
}

export async function acknowledgeDocument(id: number): Promise<DocumentPost> {
  const { data } = await api.post<ResultMessage<DocumentPost>>(`/employee-service/v1/documents/${id}/acknowledge`);
  return data.data;
}
