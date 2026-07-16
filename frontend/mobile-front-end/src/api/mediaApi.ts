import { API_BASE_URL } from '@env';

import { api } from './axios';

export interface UploadFile {
  id: string;
  name: string;
  extension: string;
}

export interface VideoJobResponse {
  videoId: string;
  jobId: string;
  status: 'QUEUED' | 'PROCESSING' | 'DONE' | 'FAILED';
  message?: string;
  errorMessage?: string;
  createdAt?: string;
  completedAt?: string;
  hlsUrl?: string;
}

// RN has no browser `File` — a picked asset is just a { uri, name, type } descriptor
// (what expo-image-picker/react-native-image-picker hand back), and that same shape is
// what RN's FormData implementation expects for a file part.
export interface PickedFile {
  uri: string;
  name: string;
  type: string;
}

function toFormData(file: PickedFile): FormData {
  const form = new FormData();
  // RN's FormData accepts this { uri, name, type } object in place of a Blob/File.
  form.append('file', file as unknown as Blob);
  return form;
}

export async function uploadFile(file: PickedFile): Promise<UploadFile> {
  const { data } = await api.post<UploadFile>('/media-service/v1/upload/single', toFormData(file), {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function uploadVideo(file: PickedFile): Promise<VideoJobResponse> {
  const { data } = await api.post<VideoJobResponse>('/media-service/v1/videos/upload', toFormData(file), {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function fetchJobStatus(jobId: string): Promise<VideoJobResponse> {
  const { data } = await api.get<VideoJobResponse>(`/media-service/v1/jobs/${jobId}`);
  return data;
}

export function getFileUrl(id: string, extension: string): string {
  return `${API_BASE_URL ?? 'http://localhost:8080'}/media-service/images/${id}${extension}`;
}

// HLS master playlist for a processed video — react-native-video plays this directly via
// the platform's native player (AVPlayer on iOS), no client-side HLS library needed (unlike
// web, which uses hls.js since browsers don't natively support HLS outside Safari).
export function getVideoStreamUrl(videoId: string): string {
  return `${API_BASE_URL ?? 'http://localhost:8080'}/media-service/v1/videos/${videoId}/master.m3u8`;
}

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 5 * 60_000;

/**
 * Polls media-service's transcode job until it settles. Chat messages are only ever
 * persisted with READY attachments (no edit-message endpoint exists to flip a
 * PROCESSING attachment to READY after the fact), so the composer must wait this out
 * before sending rather than posting immediately and patching later.
 */
export async function waitForVideoReady(jobId: string): Promise<VideoJobResponse> {
  const start = Date.now();
  for (;;) {
    const status = await fetchJobStatus(jobId);
    if (status.status === 'DONE' || status.status === 'FAILED') return status;
    if (Date.now() - start > POLL_TIMEOUT_MS) {
      throw new Error('Video processing timed out');
    }
    await new Promise<void>((resolve) => setTimeout(() => resolve(), POLL_INTERVAL_MS));
  }
}
