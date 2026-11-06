import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { MEDIA_BUCKET, imageStorage } from "./config";
import { getMediaBucket } from "./r2";

/** What the app needs from an image store. */
export interface ImageStore {
  put(key: string, bytes: Uint8Array, contentType: string): Promise<void>;
  remove(keys: string[]): Promise<void>;
}

/**
 * Supabase Storage, acting as the given client. With the user's own session,
 * the bucket's policies decide what they may write (see the storage migration).
 */
function supabaseStore(client: SupabaseClient): ImageStore {
  const bucket = client.storage.from(MEDIA_BUCKET);
  return {
    async put(key, bytes, contentType) {
      const { error } = await bucket.upload(key, bytes, {
        contentType,
        cacheControl: "31536000", // file names never change, so a year is safe
        upsert: false,
      });
      if (error) throw error;
    },
    async remove(keys) {
      const { error } = await bucket.remove(keys);
      if (error) throw error;
    },
  };
}

/** Cloudflare R2 through the Worker binding. The server checks ownership first. */
const r2Store: ImageStore = {
  async put(key, bytes, contentType) {
    await (await getMediaBucket()).put(key, bytes, { httpMetadata: { contentType } });
  },
  async remove(keys) {
    await (await getMediaBucket()).delete(keys);
  },
};

/**
 * The configured image store. Pass the Supabase client of the person acting
 * (their session, or the admin client for admin clean-up).
 */
export function imageStore(client: SupabaseClient): ImageStore {
  return imageStorage() === "r2" ? r2Store : supabaseStore(client);
}
