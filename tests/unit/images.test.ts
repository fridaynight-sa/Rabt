import { describe, expect, it } from "vitest";
import { detectImageType, isValidMediaKey, mediaUrl } from "@/lib/images";

const bytes = (...values: number[]) => new Uint8Array(values);
const ascii = (s: string) => Array.from(s, (c) => c.charCodeAt(0));

describe("detectImageType", () => {
  it("reads JPEG, PNG and WebP from their first bytes", () => {
    expect(detectImageType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
    expect(detectImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0))).toBe(
      "image/png",
    );
    expect(detectImageType(bytes(...ascii("RIFF"), 0, 0, 0, 0, ...ascii("WEBP")))).toBe(
      "image/webp",
    );
  });

  it("rejects anything else, whatever its name", () => {
    expect(detectImageType(bytes(...ascii("<svg onload=alert(1)>")))).toBeNull();
    expect(detectImageType(bytes(...ascii("GIF89a")))).toBeNull();
    expect(detectImageType(bytes(...ascii("%PDF-1.7")))).toBeNull();
    expect(detectImageType(bytes(...ascii("RIFF"), 0, 0, 0, 0, ...ascii("WAVE")))).toBeNull();
    expect(detectImageType(bytes())).toBeNull();
  });
});

describe("isValidMediaKey", () => {
  const id = "33333333-3333-3333-3333-333333333333";
  const file = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

  it("accepts keys the site creates", () => {
    expect(isValidMediaKey(`portfolio/${id}/${file}.webp`)).toBe(true);
    expect(isValidMediaKey(`listings/${id}/${file}.jpg`)).toBe(true);
  });

  it.each([
    `portfolio/${id}/../secret.webp`,
    `portfolio/${id}/${file}.svg`,
    `other/${id}/${file}.webp`,
    `portfolio/${id}/${file}.webp/extra`,
    "",
  ])("refuses %s", (key) => {
    expect(isValidMediaKey(key)).toBe(false);
  });
});

it("builds the public image address", () => {
  expect(mediaUrl("portfolio/a/b.webp")).toBe("/media/portfolio/a/b.webp");
});
