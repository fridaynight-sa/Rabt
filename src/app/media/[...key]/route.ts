import { isValidMediaKey } from "@/lib/images";
import { imageStorage } from "@/lib/storage/config";
import { getMediaBucket } from "@/lib/storage/r2";

/**
 * Serves images when they are stored in Cloudflare R2 (NEXT_PUBLIC_IMAGE_STORAGE=r2).
 * With Supabase Storage, images load straight from Supabase and this route is unused.
 * Keys are random and never change, so browsers may cache forever.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  if (imageStorage() !== "r2") return new Response("Not found", { status: 404 });
  const key = (await params).key.join("/");
  if (!isValidMediaKey(key)) return new Response("Not found", { status: 404 });

  const object = await (await getMediaBucket()).get(key);
  if (!object) return new Response("Not found", { status: 404 });

  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
      "Content-Length": String(object.size),
      "Cache-Control": "public, max-age=31536000, immutable",
      ETag: object.httpEtag,
    },
  });
}
