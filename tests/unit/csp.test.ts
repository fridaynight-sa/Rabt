import { describe, expect, it } from "vitest";
import { buildCsp, createNonce } from "@/lib/csp";

function directives(csp: string) {
  return Object.fromEntries(
    csp.split("; ").map((d) => {
      const [name, ...values] = d.split(" ");
      return [name, values];
    }),
  );
}

describe("createNonce", () => {
  it("is random and long enough", () => {
    const a = createNonce();
    expect(a).not.toBe(createNonce());
    expect(atob(a)).toHaveLength(16);
  });
});

describe("buildCsp", () => {
  const d = directives(buildCsp("abc123"));

  it("allows only our nonced scripts and Turnstile", () => {
    expect(d["script-src"]).toEqual(
      expect.arrayContaining([
        "'nonce-abc123'",
        "'strict-dynamic'",
        "https://challenges.cloudflare.com",
      ]),
    );
    expect(d["script-src"]).not.toContain("'unsafe-inline'");
    expect(d["script-src"]).not.toContain("'unsafe-eval'");
  });

  it("blocks framing, plugins and foreign forms", () => {
    expect(d["frame-ancestors"]).toEqual(["'none'"]);
    expect(d["object-src"]).toEqual(["'none'"]);
    expect(d["form-action"]).toEqual(["'self'"]);
    expect(d["base-uri"]).toEqual(["'self'"]);
    expect(d["upgrade-insecure-requests"]).toEqual([]);
  });

  it("relaxes only what local development needs", () => {
    const dev = directives(buildCsp("x", { dev: true }));
    expect(dev["script-src"]).toContain("'unsafe-eval'");
    expect(dev["upgrade-insecure-requests"]).toBeUndefined();
  });
});
