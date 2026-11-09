import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { MAX_UPLOAD_BYTES, detectImageType, extensionFor } from "@/lib/images";
import { imageStore } from "./store";

export type StoreResult = { ok: true; key: string } | { ok: false; message: string };

/**
 * Checks an uploaded image (size, real type) and stores it under
 * `<folder>/<random id>.<ext>`. The caller saves the key in the database and
 * calls removeImages if that fails.
 */
export async function storeImage(
  file: FormDataEntryValue | null,
  folder: string,
  client: SupabaseClient,
): Promise<StoreResult> {
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "اختر صورة." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, message: "الصورة كبيرة، الحد 3 ميجا." };
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectImageType(bytes);
  if (!type) {
    return { ok: false, message: "نوع الملف غير مدعوم. الصيغ المقبولة: JPG وPNG وWEBP." };
  }
  const key = `${folder}/${crypto.randomUUID()}.${extensionFor(type)}`;
  try {
    await imageStore(client).put(key, bytes, type);
  } catch (error) {
    console.error("image upload failed", error instanceof Error ? error.message : error);
    return { ok: false, message: "ما قدرنا نرفع الصورة. حاول مرة ثانية." };
  }
  return { ok: true, key };
}

/** Deletes stored images. A failure is logged, not thrown: the rows are already gone. */
export async function removeImages(keys: string[], client: SupabaseClient): Promise<void> {
  if (keys.length === 0) return;
  try {
    await imageStore(client).remove(keys);
  } catch (error) {
    console.error("image delete failed", error instanceof Error ? error.message : error);
  }
}
