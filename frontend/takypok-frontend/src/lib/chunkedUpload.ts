import { startChunkedUpload, uploadChunk, finishChunkedUpload } from "../api/chunkedUploadApi";
import type { UploadFile } from "../api/types";

const CONCURRENCY = 25;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;

export interface ChunkedUploadProgress {
    sentChunks: number;
    totalChunks: number;
    percent: number;
}

function sleep(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function uploadChunkWithRetry(sessionId: string, index: number, chunk: Blob) {
    let attempt = 0;
    for (;;) {
        try {
            return await uploadChunk(sessionId, index, chunk);
        } catch (err) {
            attempt += 1;
            if (attempt > MAX_RETRIES) throw err;
            await sleep(RETRY_DELAY_MS);
        }
    }
}

/**
 * Splits a file into fixed-size chunks (size dictated by the server's /start response) and
 * uploads them through a bounded-concurrency worker pool — a fixed number of workers pulling
 * from a shared cursor, not an unbounded Promise.all over every chunk, so one slow chunk can't
 * block the rest and the browser never fires hundreds of simultaneous requests.
 */
export async function uploadFileChunked(
    file: File,
    onProgress?: (progress: ChunkedUploadProgress) => void,
): Promise<UploadFile> {
    const { sessionId, chunkSizeBytes } = await startChunkedUpload(
        crypto.randomUUID(),
        file.name,
        file.size,
    );
    const totalChunks = Math.max(1, Math.ceil(file.size / chunkSizeBytes));

    let nextIndex = 0;
    let sentChunks = 0;
    const workerCount = Math.min(CONCURRENCY, totalChunks);

    async function worker() {
        for (;;) {
            const index = nextIndex;
            nextIndex += 1;
            if (index >= totalChunks) return;

            const start = index * chunkSizeBytes;
            const chunk = file.slice(start, start + chunkSizeBytes);
            await uploadChunkWithRetry(sessionId, index, chunk);

            sentChunks += 1;
            onProgress?.({
                sentChunks,
                totalChunks,
                percent: Math.round((sentChunks / totalChunks) * 100),
            });
        }
    }

    await Promise.all(Array.from({ length: workerCount }, () => worker()));

    return finishChunkedUpload(sessionId, totalChunks);
}
