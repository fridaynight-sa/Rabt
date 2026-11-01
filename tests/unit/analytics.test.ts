import { describe, expect, it } from "vitest";
import { shouldCountView, viewPath, type ViewRequest } from "@/lib/analytics";

const browser = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Safari/604.1";
const page = (over: Partial<ViewRequest> = {}): ViewRequest => ({
  method: "GET",
  pathname: "/",
  accept: "text/html,application/xhtml+xml",
  userAgent: browser,
  isRsc: false,
  isPrefetch: false,
  ...over,
});

describe("shouldCountView", () => {
  it("counts page loads and in-app navigations by people", () => {
    expect(shouldCountView(page())).toBe(true);
    expect(shouldCountView(page({ pathname: "/search", accept: "*/*", isRsc: true }))).toBe(true);
    expect(shouldCountView(page({ pathname: "/providers/p-1a2b3c4d5e6f" }))).toBe(true);
    expect(
      shouldCountView(page({ pathname: "/listings/30000000-0000-0000-0000-000000000001" })),
    ).toBe(true);
    expect(shouldCountView(page({ pathname: "/signup/provider/" }))).toBe(true);
  });

  it.each([
    ["a prefetch", page({ isRsc: true, isPrefetch: true })],
    ["a form post", page({ method: "POST" })],
    ["a bot", page({ userAgent: "Googlebot/2.1" })],
    ["a WhatsApp link preview", page({ userAgent: "WhatsApp/2.23" })],
    ["no user agent", page({ userAgent: null })],
    ["an image", page({ pathname: "/media/portfolio/a/b.webp" })],
    ["a dashboard page", page({ pathname: "/dashboard/provider" })],
    ["an admin page", page({ pathname: "/admin/reports" })],
    ["a file", page({ pathname: "/robots.txt" })],
    ["a data request", page({ accept: "application/json" })],
    ["a made-up address", page({ pathname: "/wp-admin/install.php" })],
    ["an unknown provider address", page({ pathname: "/providers/<script>" })],
    ["a protocol-relative path", page({ pathname: "//evil.example" })],
  ])("skips %s", (_name, request) => {
    expect(shouldCountView(request)).toBe(false);
  });
});

describe("viewPath", () => {
  it("cleans the path", () => {
    expect(viewPath("/")).toBe("/");
    expect(viewPath("/search/")).toBe("/search");
    expect(viewPath("/providers/p-123")).toBe("/providers/p-123");
    expect(viewPath("/%D8%B1%D8%A8%D8%B7")).toBe("/ربط");
    expect(viewPath("/%E0%A4%A")).toBe("/%E0%A4%A");
    expect(viewPath(`/${"x".repeat(300)}`)).toHaveLength(200);
  });
});
