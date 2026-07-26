import type { PageResponse, ResultMessage } from "./types.ts";
import { api } from "@takypok/shared";

export type TrainingFormat = "PDF" | "VIDEO" | "SLIDES";
export type TrainingStatus = "ACTIVE" | "ARCHIVED";

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

export interface TrainingMaterialInput {
  category: string;
  title: string;
  format: TrainingFormat;
  videoId?: string | null;
  duration?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
}

export async function fetchTrainingMaterials(
  category?: string,
  status?: TrainingStatus,
  page = 0,
  size = 50,
) {
  const { data } = await api.get<ResultMessage<PageResponse<TrainingMaterial>>>(
    "/employee-service/v1/training-materials",
    { params: { category, status, page, size } },
  );
  return data.data;
}

export async function createTrainingMaterial(payload: TrainingMaterialInput) {
  const { data } = await api.post<ResultMessage<TrainingMaterial>>(
    "/employee-service/v1/training-materials",
    payload,
  );
  return data.data;
}

export async function updateTrainingMaterial(id: number, payload: TrainingMaterialInput) {
  const { data } = await api.put<ResultMessage<TrainingMaterial>>(
    `/employee-service/v1/training-materials/${id}`,
    payload,
  );
  return data.data;
}

export async function setTrainingMaterialArchived(id: number, archived: boolean) {
  const { data } = await api.patch<ResultMessage<TrainingMaterial>>(
    `/employee-service/v1/training-materials/${id}/archive`,
    { archived },
  );
  return data.data;
}
