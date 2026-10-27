import { describe, expect, it } from "vitest";
import {
  changeEmailSchema,
  changePasswordSchema,
  merchantDetailsSchema,
} from "@/features/account/schemas";

describe("changePasswordSchema", () => {
  it("needs the current password and a strong new one", () => {
    expect(
      changePasswordSchema.safeParse({ currentPassword: "old", newPassword: "rabt2026" }).success,
    ).toBe(true);
    const weak = changePasswordSchema.safeParse({ currentPassword: "", newPassword: "short" });
    expect(weak.success).toBe(false);
    expect(weak.error?.issues.map((i) => i.path[0])).toEqual(
      expect.arrayContaining(["currentPassword", "newPassword"]),
    );
  });
});

describe("changeEmailSchema", () => {
  it("cleans the new email", () => {
    const r = changeEmailSchema.parse({ newEmail: " New@Example.COM ", currentPassword: "x" });
    expect(r.newEmail).toBe("new@example.com");
  });

  it("rejects a bad email", () => {
    expect(changeEmailSchema.safeParse({ newEmail: "nope", currentPassword: "x" }).success).toBe(
      false,
    );
  });
});

describe("merchantDetailsSchema", () => {
  it("normalizes the phone and allows none", () => {
    expect(merchantDetailsSchema.parse({ fullName: "مقهى", phone: "0512345678" }).phone).toBe(
      "+966512345678",
    );
    expect(merchantDetailsSchema.parse({ fullName: "مقهى", phone: "" }).phone).toBeNull();
    expect(merchantDetailsSchema.parse({ fullName: "مقهى" }).phone).toBeNull();
  });

  it("rejects a bad phone", () => {
    expect(merchantDetailsSchema.safeParse({ fullName: "مقهى", phone: "123" }).success).toBe(false);
  });
});
