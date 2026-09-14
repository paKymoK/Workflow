import { startChunkedUpload, uploadChunk, uploadChunkBase64, finishChunkedUpload } from "../api/chunkedUploadApi";
import type { ChunkAckResponse } from "../api/chunkedUploadApi";
import type { UploadFile } from "../api/types";

const CONCURRENCY = 25;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;

export interface ChunkedUploadProgress {
    sentChunks: number;
    totalChunks: number;
    percent: number;
}

type ChunkSender = (sessionId: string, index: number, chunk: Blob) => Promise<ChunkAckResponse>;

function sleep(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function blobToBase64(blob: Blob): Promise<string> {
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

const sendBinary: ChunkSender = (sessionId, index, chunk) => uploadChunk(sessionId, index, chunk);

const sendBase64: ChunkSender = async (sessionId, index, chunk) =>
    uploadChunkBase64(sessionId, index, await blobToBase64(chunk));

async function sendChunkWithRetry(sessionId: string, index: number, chunk: Blob, send: ChunkSender) {
    let attempt = 0;
    for (;;) {
        try {
            return await send(sessionId, index, chunk);
        } catch (err) {
            attempt += 1;
            if (attempt > MAX_RETRIES) throw err;
            await sleep(RETRY_DELAY_MS);
        }
    }
}

async function runChunkedUpload(
    file: File,
    send: ChunkSender,
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
            await sendChunkWithRetry(sessionId, index, chunk, send);

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
    return runChunkedUpload(file, sendBinary, onProgress);
}

/**
 * Same as {@link uploadFileChunked}, but sends each chunk base64-encoded inside a JSON body
 * instead of raw binary. Some networks (corporate proxies, security gateways) content-inspect
 * raw octet-stream bodies and block ones matching a recognizable binary signature — e.g. the ZIP
 * header at the start of an .xlsx/.docx file. Base64 text sidesteps that at the cost of ~33%
 * extra bytes on the wire.
 */
export async function uploadFileChunkedBase64(
    file: File,
    onProgress?: (progress: ChunkedUploadProgress) => void,
): Promise<UploadFile> {
    return runChunkedUpload(file, sendBase64, onProgress);
}
