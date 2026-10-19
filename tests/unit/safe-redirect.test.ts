import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/safe-redirect";

describe("safeNextPath", () => {
  it.each([
    ["/dashboard/provider", "/dashboard/provider"],
    ["/reset-password?x=1", "/reset-password?x=1"],
  ])("keeps the local path %s", (input, expected) => {
    expect(safeNextPath(input)).toBe(expected);
  });

  it.each([
    null,
    undefined,
    "",
    "https://evil.com",
    "//evil.com",
    "/\\evil.com",
    "\\\\evil.com",
    "javascript:alert(1)",
    "dashboard",
  ])("falls back for %s", (input) => {
    expect(safeNextPath(input)).toBe("/dashboard");
  });
});
