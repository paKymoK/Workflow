const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

/**
 * Downscales an image client-side before upload. media-service serves images at
 * their original resolution with no server-side thumbnailing, and a chat feed renders
 * many inline images at once (unlike a ticket page's one or two attachments) — sending
 * full-resolution phone photos there is a real bandwidth/latency cost for no visual
 * benefit at bubble size. GIFs and SVGs pass through unchanged (canvas re-encoding
 * would destroy animation / rasterize a vector).
 */
export async function resizeImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  if (scale === 1) {
    bitmap.close();
    return file;
  }

  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
  );
  if (!blob) return file;

  const newName = file.name.replace(/\.\w+$/, "") + ".jpg";
  return new File([blob], newName, { type: "image/jpeg" });
}
