// Content Security Policy for pages: only our own scripts (each page load gets a
// one-time "nonce"), Cloudflare Turnstile for the bot check, nothing else.

const TURNSTILE = "https://challenges.cloudflare.com";

export function createNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

export function buildCsp(
  nonce: string,
  {
    dev = false,
    imageOrigin = "",
    https = !dev,
  }: { dev?: boolean; imageOrigin?: string; https?: boolean } = {},
): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // 'strict-dynamic': scripts loaded by our nonced scripts (like Turnstile) are allowed too.
    "script-src": [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      TURNSTILE,
      ...(dev ? ["'unsafe-eval'"] : []),
    ],
    "style-src": ["'self'", "'unsafe-inline'"],
    // Stored images come from the image store (Supabase Storage) when it is another site.
    "img-src": ["'self'", "data:", "blob:", ...(imageOrigin ? [imageOrigin] : [])],
    "font-src": ["'self'"],
    "connect-src": ["'self'", TURNSTILE, ...(dev ? ["ws:"] : [])],
    "frame-src": [TURNSTILE],
    "frame-ancestors": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "object-src": ["'none'"],
    "worker-src": ["'self'", "blob:"],
  };
  const policy = Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(" ")}`)
    .join("; ");
  // On an https site, also load any http address over https.
  return https ? `${policy}; upgrade-insecure-requests` : policy;
}
