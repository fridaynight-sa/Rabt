import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// The few R2 bucket methods we use. The full types live in @cloudflare/workers-types.
export type StoredObject = {
  body: ReadableStream;
  size: number;
  httpEtag: string;
  httpMetadata?: { contentType?: string };
};

export interface MediaBucket {
  put(
    key: string,
    value: ArrayBuffer | Uint8Array,
    options?: { httpMetadata?: { contentType?: string; cacheControl?: string } },
  ): Promise<unknown>;
  get(key: string): Promise<StoredObject | null>;
  delete(keys: string | string[]): Promise<void>;
}

/** The R2 bucket for user images (binding "MEDIA" in wrangler.jsonc). */
export async function getMediaBucket(): Promise<MediaBucket> {
  const { env } = await getCloudflareContext({ async: true });
  const bucket = (env as unknown as { MEDIA?: MediaBucket }).MEDIA;
  if (!bucket) throw new Error("R2 binding MEDIA is missing; check wrangler.jsonc");
  return bucket;
}
