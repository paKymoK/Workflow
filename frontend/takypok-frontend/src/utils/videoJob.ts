import { fetchJobStatus, type VideoJobResponse } from "../api/ticketApi";

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
    if (status.status === "DONE" || status.status === "FAILED") return status;
    if (Date.now() - start > POLL_TIMEOUT_MS) {
      throw new Error("Video processing timed out");
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}
