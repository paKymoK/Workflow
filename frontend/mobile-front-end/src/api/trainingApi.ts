import { api } from './axios';

export type TrainingFormat = 'PDF' | 'VIDEO' | 'SLIDES';
export type TrainingStatus = 'ACTIVE' | 'ARCHIVED';

export interface TrainingMaterial {
  id: number;
  category: string;
  title: string;
  format: TrainingFormat;
  videoId: string | null;
  duration: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  status: TrainingStatus;
  completedByMe: boolean;
  completedCount: number;
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

export async function fetchTrainingMaterials(
  category?: string,
  status: TrainingStatus = 'ACTIVE',
): Promise<TrainingMaterial[]> {
  const { data } = await api.get<ResultMessage<PageResponse<TrainingMaterial>>>(
    '/employee-service/v1/training-materials',
    { params: { category, status, page: 0, size: 100 } },
  );
  return data.data.content;
}

export async function completeTrainingMaterial(id: number): Promise<TrainingMaterial> {
  const { data } = await api.post<ResultMessage<TrainingMaterial>>(
    `/employee-service/v1/training-materials/${id}/complete`,
  );
  return data.data;
}
