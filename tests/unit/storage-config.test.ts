import { afterEach, describe, expect, it, vi } from "vitest";
import { imageStorage, mediaOrigin, mediaUrl } from "@/lib/storage/config";
import { buildCsp } from "@/lib/csp";

const KEY =
  "portfolio/33333333-3333-3333-3333-333333333333/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.webp";

afterEach(() => vi.unstubAllEnvs());

describe("image storage switch", () => {
  it("uses Supabase Storage by default", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co/");
    vi.stubEnv("NEXT_PUBLIC_IMAGE_STORAGE", "");
    expect(imageStorage()).toBe("supabase");
    expect(mediaUrl(KEY)).toBe(
      `https://abc.supabase.co/storage/v1/object/public/rabt-media/${KEY}`,
    );
    expect(mediaOrigin()).toBe("https://abc.supabase.co");
  });

  it("switches back to R2 with one setting", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_IMAGE_STORAGE", "r2");
    expect(imageStorage()).toBe("r2");
    expect(mediaUrl(KEY)).toBe(`/media/${KEY}`);
    expect(mediaOrigin()).toBe("");
  });

  it("ignores unknown values", () => {
    vi.stubEnv("NEXT_PUBLIC_IMAGE_STORAGE", "s3");
    expect(imageStorage()).toBe("supabase");
  });
});

describe("CSP image origin", () => {
  it("allows images from the image store and nowhere else", () => {
    const csp = buildCsp("n", { imageOrigin: "https://abc.supabase.co" });
    expect(csp).toContain("img-src 'self' data: blob: https://abc.supabase.co;");
    expect(buildCsp("n")).toContain("img-src 'self' data: blob:;");
  });
});
