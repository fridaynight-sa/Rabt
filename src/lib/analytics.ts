// Which requests count as a page view for the admin visit numbers.

// Only real public pages are counted, so made-up addresses cannot fill the table.
const COUNTED_PAGES =
  /^\/(search|login|signup(\/(merchant|provider))?|providers\/[a-z0-9-]{3,60}|listings\/[0-9a-f-]{36})?$/;
const BOT =
  /bot|crawl|spider|slurp|preview|whatsapp|facebookexternalhit|telegram|curl|wget|headless/i;

export type ViewRequest = {
  method: string;
  pathname: string;
  accept: string | null;
  userAgent: string | null;
  isRsc: boolean;
  isPrefetch: boolean;
};

/**
 * A full page load, or an in-app navigation (React Server Components request),
 * by a person, on a public page. Prefetches and bots do not count.
 */
export function shouldCountView(r: ViewRequest): boolean {
  if (r.method !== "GET" || r.isPrefetch) return false;
  if (!COUNTED_PAGES.test(r.pathname.replace(/\/+$/, "") || "/")) return false;
  if (!r.userAgent || BOT.test(r.userAgent)) return false;
  return r.isRsc || (r.accept ?? "").includes("text/html");
}

/** The path stored for a view: no query, no trailing slash, at most 200 characters. */
export function viewPath(pathname: string): string {
  let path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  try {
    path = decodeURI(path);
  } catch {
    // keep it encoded
  }
  return path.slice(0, 200) || "/";
}
