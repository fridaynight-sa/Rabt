import { isValidMediaKey } from "@/lib/images";
import { getMediaBucket } from "@/lib/storage/r2";

/** Serves stored images. Keys are random and never change, so browsers may cache forever. */
export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
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
