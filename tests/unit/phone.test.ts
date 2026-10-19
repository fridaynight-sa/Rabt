import { describe, expect, it } from "vitest";
import { looksLikePhone, normalizePhone, whatsappLink } from "@/lib/phone";

describe("normalizePhone", () => {
  it.each([
    ["0512345678", "+966512345678"],
    ["512345678", "+966512345678"],
    ["966512345678", "+966512345678"],
    ["+966512345678", "+966512345678"],
    ["00966512345678", "+966512345678"],
    ["+966 51 234 5678", "+966512345678"],
    ["051-234-5678", "+966512345678"],
    ["٠٥١٢٣٤٥٦٧٨", "+966512345678"],
    ["۰۵۱۲۳۴۵۶۷۸", "+966512345678"],
    ["+971501234567", "+971501234567"],
  ])("turns %s into %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each(["", "12345", "0412345678", "+96651234567", "+9665123456789", "abc", "+0123456789"])(
    "rejects %s",
    (input) => {
      expect(normalizePhone(input)).toBeNull();
    },
  );
});

describe("looksLikePhone", () => {
  it("tells phones and emails apart", () => {
    expect(looksLikePhone("0512345678")).toBe(true);
    expect(looksLikePhone("+966 512345678")).toBe(true);
    expect(looksLikePhone("٠٥١٢٣٤٥٦٧٨")).toBe(true);
    expect(looksLikePhone("name@example.com")).toBe(false);
    expect(looksLikePhone("name")).toBe(false);
  });
});

describe("whatsappLink", () => {
  it("builds a wa.me link without the plus sign", () => {
    expect(whatsappLink("+966512345678")).toBe("https://wa.me/966512345678");
  });

  it("adds a message when given", () => {
    expect(whatsappLink("+966512345678", "مرحبا")).toBe(
      "https://wa.me/966512345678?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7",
    );
  });
});
