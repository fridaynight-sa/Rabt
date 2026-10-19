import { describe, expect, it } from "vitest";
import { providerProfileSchema, readProfileForm } from "@/features/providers/schemas";

function form(entries: [string, string][]) {
  const data = new FormData();
  for (const [k, v] of entries) data.append(k, v);
  return data;
}

const base: [string, string][] = [
  ["businessName", " مؤسسة المعدات "],
  ["cityId", "2"],
  ["whatsapp", "0512345678"],
  ["services", "معدات قهوة"],
  ["description", ""],
];

describe("provider profile form", () => {
  it("reads repeated checkboxes as lists", () => {
    const raw = readProfileForm(
      form([...base, ["sectorIds", "1"], ["sectorIds", "3"], ["categoryIds", "2"]]),
    );
    const result = providerProfileSchema.parse(raw);
    expect(result.businessName).toBe("مؤسسة المعدات");
    expect(result.sectorIds).toEqual([1, 3]);
    expect(result.categoryIds).toEqual([2]);
    expect(result.whatsapp).toBe("+966512345678");
    expect(result.description).toBeNull();
  });

  it("allows no sectors or categories", () => {
    const result = providerProfileSchema.parse(readProfileForm(form(base)));
    expect(result.sectorIds).toEqual([]);
    expect(result.categoryIds).toEqual([]);
  });

  it("rejects bad ids and a bad WhatsApp number", () => {
    const raw = readProfileForm(
      form([...base.filter(([k]) => k !== "whatsapp"), ["whatsapp", "123"], ["sectorIds", "abc"]]),
    );
    const result = providerProfileSchema.safeParse(raw);
    expect(result.success).toBe(false);
    const fields = result.error?.issues.map((i) => i.path[0]);
    expect(fields).toContain("whatsapp");
    expect(fields).toContain("sectorIds");
  });

  it("limits the description to 2000 characters", () => {
    const raw = readProfileForm(
      form([...base.filter(([k]) => k !== "description"), ["description", "x".repeat(2001)]]),
    );
    expect(providerProfileSchema.safeParse(raw).success).toBe(false);
  });
});
