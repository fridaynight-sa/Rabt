import { describe, expect, it } from "vitest";
import { referenceSchema } from "@/features/admin/schemas";

describe("referenceSchema", () => {
  it("reads a new item", () => {
    expect(
      referenceSchema.parse({
        kind: "categories",
        id: "",
        slug: " Coffee-Beans ",
        nameAr: " بن مختص ",
      }),
    ).toEqual({
      kind: "categories",
      id: null,
      slug: "coffee-beans",
      nameAr: "بن مختص",
      sortOrder: 0,
    });
  });

  it("reads an edit", () => {
    const r = referenceSchema.parse({
      kind: "cities",
      id: "4",
      slug: "madinah",
      nameAr: "المدينة",
      sortOrder: "7",
    });
    expect(r.id).toBe(4);
    expect(r.sortOrder).toBe(7);
  });

  it.each([
    { kind: "profiles", id: "", slug: "x1", nameAr: "اسم" },
    { kind: "cities", id: "-1", slug: "abc", nameAr: "اسم" },
    { kind: "cities", id: "", slug: "مدينة", nameAr: "اسم" },
    { kind: "cities", id: "", slug: "a b", nameAr: "اسم" },
    { kind: "cities", id: "", slug: "abc", nameAr: "ا" },
  ])("rejects %o", (input) => {
    expect(referenceSchema.safeParse(input).success).toBe(false);
  });
});

describe("visits chart day label", async () => {
  const { label } = await import("@/features/admin/components/visits-chart");
  it("reads a plain date or a date with a time", () => {
    expect(label("2026-10-27")).toBe(label("2026-10-27T00:00:00"));
    expect(label("2026-10-27")).toMatch(/27/);
    expect(label("not a date")).toBe("not a date");
  });
});
