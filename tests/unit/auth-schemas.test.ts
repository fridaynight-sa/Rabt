import { describe, expect, it } from "vitest";
import {
  loginSchema,
  merchantSignUpSchema,
  passwordRule,
  providerSignUpSchema,
} from "@/features/auth/schemas";

describe("passwordRule", () => {
  it("accepts a password with a letter and a number", () => {
    expect(passwordRule.safeParse("rabt2026").success).toBe(true);
    expect(passwordRule.safeParse("ربط2026ok").success).toBe(true);
  });

  it.each(["short1", "onlyletters", "12345678", "a1".repeat(40)])("rejects %s", (pw) => {
    expect(passwordRule.safeParse(pw).success).toBe(false);
  });
});

describe("merchantSignUpSchema", () => {
  const valid = {
    fullName: "  مقهى الورد ",
    email: " Owner@Example.COM ",
    phone: "0512345678",
    password: "rabt2026",
  };

  it("cleans the input", () => {
    const result = merchantSignUpSchema.parse(valid);
    expect(result.fullName).toBe("مقهى الورد");
    expect(result.email).toBe("owner@example.com");
    expect(result.phone).toBe("+966512345678");
  });

  it("treats an empty phone as no phone", () => {
    expect(merchantSignUpSchema.parse({ ...valid, phone: "" }).phone).toBeNull();
    expect(merchantSignUpSchema.parse({ ...valid, phone: undefined }).phone).toBeNull();
  });

  it("rejects a bad phone and a bad email", () => {
    const result = merchantSignUpSchema.safeParse({ ...valid, phone: "123", email: "nope" });
    expect(result.success).toBe(false);
    const fields = result.error?.issues.map((i) => i.path[0]);
    expect(fields).toContain("phone");
    expect(fields).toContain("email");
  });
});

describe("providerSignUpSchema", () => {
  const valid = {
    fullName: "مؤسسة المعدات",
    cityId: "3",
    email: "p@example.com",
    whatsapp: "0512345678",
    services: "معدات قهوة",
    password: "rabt2026",
  };

  it("accepts a full form", () => {
    const result = providerSignUpSchema.parse(valid);
    expect(result.cityId).toBe(3);
    expect(result.whatsapp).toBe("+966512345678");
  });

  it("requires a city and a WhatsApp number", () => {
    const result = providerSignUpSchema.safeParse({ ...valid, cityId: "", whatsapp: "" });
    expect(result.success).toBe(false);
    const fields = result.error?.issues.map((i) => i.path[0]);
    expect(fields).toContain("cityId");
    expect(fields).toContain("whatsapp");
  });
});

describe("loginSchema", () => {
  it("reads an email", () => {
    const r = loginSchema.parse({ identifier: "A@B.co", password: "x" });
    expect(r.identifier).toEqual({ kind: "email", value: "a@b.co" });
  });

  it("reads a phone number", () => {
    const r = loginSchema.parse({ identifier: "0512345678", password: "x" });
    expect(r.identifier).toEqual({ kind: "phone", value: "+966512345678" });
  });

  it("rejects something that is neither", () => {
    expect(loginSchema.safeParse({ identifier: "hello", password: "x" }).success).toBe(false);
  });
});
