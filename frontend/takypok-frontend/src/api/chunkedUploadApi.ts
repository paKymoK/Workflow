import { api } from "@takypok/shared";
import type { UploadFile } from "./types";

export interface StartChunkedUploadResponse {
    sessionId: string;
    chunkSizeBytes: number;
    sessionIdleTimeoutSeconds: number;
}

export interface ChunkAckResponse {
    index: number;
    bytesReceived: number;
    totalBytesReceivedSoFar: number;
}

export interface ChunkedUploadedFile {
    name: string;
    sizeBytes: number;
    modifiedAt: string;
}

export async function startChunkedUpload(sessionId: string, filename: string, totalSizeBytes: number) {
    const { data } = await api.post<StartChunkedUploadResponse>(
        "/media-service/v1/upload/chunked/start",
        { sessionId, filename, totalSizeBytes },
    );
    return data;
}

export async function uploadChunk(sessionId: string, index: number, chunk: Blob) {
    const { data } = await api.post<ChunkAckResponse>(
        `/media-service/v1/upload/chunked/${sessionId}/chunks/${index}`,
        chunk,
        { headers: { "Content-Type": "application/octet-stream" } },
    );
    return data;
}

export async function uploadChunkBase64(sessionId: string, index: number, base64Data: string) {
    const { data } = await api.post<ChunkAckResponse>(
        `/media-service/v1/upload/chunked/${sessionId}/chunks/${index}/base64`,
        { data: base64Data },
    );
    return data;
}

export async function uploadChunkEncrypted(sessionId: string, index: number, encrypted: Blob) {
    const { data } = await api.post<ChunkAckResponse>(
        `/media-service/v1/upload/chunked/${sessionId}/chunks/${index}/encrypted`,
        encrypted,
        { headers: { "Content-Type": "application/octet-stream" } },
    );
    return data;
}

export async function finishChunkedUpload(sessionId: string, totalChunks: number) {
    const { data } = await api.post<UploadFile>(
        `/media-service/v1/upload/chunked/${sessionId}/finish`,
        { totalChunks },
    );
    return data;
}

export async function listChunkedFiles() {
    const { data } = await api.get<ChunkedUploadedFile[]>("/media-service/v1/upload/chunked/files");
    return data;
}

export function getChunkedFileUrl(name: string) {
    return `${import.meta.env.VITE_API_BASE_URL}/media-service/files/${name}`;
}
