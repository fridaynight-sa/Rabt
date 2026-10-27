import "server-only";
import { MAX_UPLOAD_BYTES, detectImageType, extensionFor } from "@/lib/images";
import { getMediaBucket } from "./r2";

export type StoreResult = { ok: true; key: string } | { ok: false; message: string };

/**
 * Checks an uploaded image (size, real type) and stores it in R2 under
 * `<folder>/<random id>.<ext>`. The caller saves the key in the database and
 * calls removeImage if that fails.
 */
export async function storeImage(
  file: FormDataEntryValue | null,
  folder: string,
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
  await (await getMediaBucket()).put(key, bytes, { httpMetadata: { contentType: type } });
  return { ok: true, key };
}

export async function removeImages(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  await (await getMediaBucket()).delete(keys);
}
