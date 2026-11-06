// Image rules shared by the browser (before upload) and the server (on upload).

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type ImageType = (typeof ACCEPTED_IMAGE_TYPES)[number];

/** Largest file the server accepts, after the browser has shrunk it. */
export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;

/**
 * Longest side, in pixels, the browser shrinks photos to before upload. 1280 keeps
 * photos sharp on phones and laptops at about 100 to 250 KB each as WebP.
 */
export const MAX_IMAGE_SIDE = 1280;

/** WebP/JPEG quality used when shrinking (0 to 1). */
export const IMAGE_QUALITY = 0.8;

export const PORTFOLIO_LIMIT = 30;

const EXTENSIONS: Record<ImageType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function extensionFor(type: ImageType): string {
  return EXTENSIONS[type];
}

/**
 * The real type of an image, read from its first bytes. The file name and the
 * type the browser claims are not trusted.
 */
export function detectImageType(bytes: Uint8Array): ImageType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => bytes[i] === b)
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

const KEY_PATTERN =
  /^(portfolio|listings)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;

/** True for keys this site creates. The R2 media route refuses anything else. */
export function isValidMediaKey(key: string): boolean {
  return KEY_PATTERN.test(key);
}

export { mediaUrl } from "@/lib/storage/config";
