// Where images live. One switch, read in the browser and on the server:
//   NEXT_PUBLIC_IMAGE_STORAGE=supabase (default)  Supabase Storage bucket "rabt-media"
//   NEXT_PUBLIC_IMAGE_STORAGE=r2                  Cloudflare R2 bucket bound as MEDIA
// Image keys (portfolio/<id>/<file>, listings/<id>/<file>) are the same in both,
// so switching only needs the files copied across.

export type ImageStorage = "supabase" | "r2";

export const MEDIA_BUCKET = "rabt-media";

export function imageStorage(): ImageStorage {
  return process.env.NEXT_PUBLIC_IMAGE_STORAGE === "r2" ? "r2" : "supabase";
}

/** Public address of a stored image. */
export function mediaUrl(key: string): string {
  if (imageStorage() === "r2") return `/media/${key}`;
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${MEDIA_BUCKET}/${key}`;
}

/** Origin images load from, for the Content Security Policy ("" = this site). */
export function mediaOrigin(): string {
  if (imageStorage() === "r2") return "";
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").origin;
  } catch {
    return "";
  }
}
