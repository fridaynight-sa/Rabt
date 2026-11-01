import { describe, expect, it } from "vitest";
import { listingSchema, parsePrice } from "@/features/listings/schemas";
import { formatPrice, timeAgo } from "@/lib/format";

describe("parsePrice", () => {
  it.each([
    ["", null],
    ["  ", null],
    ["1500", 1500],
    ["1,500", 1500],
    ["1 500.50", 1500.5],
    ["١٢٠٠", 1200],
    ["٢٬٥٠٠٫٧٥", 2500.75],
  ])("reads %j as %j", (input, expected) => {
    expect(parsePrice(input)).toBe(expected);
  });

  it.each(["-5", "abc", "1.234", "1e5", "100000000"])("rejects %j", (input) => {
    expect(parsePrice(input)).toBe("invalid");
  });
});

describe("listingSchema", () => {
  const valid = {
    title: " مكينة إسبريسو ",
    description: "مكينة بحالة ممتازة مع ضمان",
    price: "",
    cityId: "1",
    categoryId: "2",
    contactMethod: "whatsapp",
  };

  it("accepts a listing without a price", () => {
    const r = listingSchema.parse(valid);
    expect(r).toMatchObject({ title: "مكينة إسبريسو", price: null, cityId: 1, categoryId: 2 });
  });

  it("rejects missing fields and an unknown contact method", () => {
    const r = listingSchema.safeParse({
      ...valid,
      title: "ab",
      categoryId: "",
      contactMethod: "email",
    });
    expect(r.success).toBe(false);
    expect(r.error?.issues.map((i) => i.path[0])).toEqual(
      expect.arrayContaining(["title", "categoryId", "contactMethod"]),
    );
  });
});

describe("formatPrice", () => {
  it("shows riyals or asks to contact", () => {
    expect(formatPrice(12000)).toBe("12,000 ريال");
    expect(formatPrice(99.5)).toBe("99.5 ريال");
    expect(formatPrice(null)).toBe("السعر عند التواصل");
  });
});

describe("timeAgo", () => {
  const now = new Date("2026-10-27T12:00:00Z");
  it("describes how long ago", () => {
    expect(timeAgo("2026-10-27T11:59:30Z", now)).toBe("الحين");
    expect(timeAgo("2026-10-24T12:00:00Z", now)).toContain("3");
    expect(timeAgo("2026-10-24T12:00:00Z", now)).not.toMatch(/[٠-٩]/);
  });
});
