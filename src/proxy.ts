import type { NextFetchEvent, NextRequest } from "next/server";
import { shouldCountView, viewPath } from "@/lib/analytics";
import { buildCsp, createNonce } from "@/lib/csp";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateSession } from "@/lib/supabase/proxy";

async function recordView(path: string) {
  try {
    await createAdminClient().rpc("record_page_view", { p_path: path });
  } catch {
    // Visit counting must never break a page.
  }
}

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  const view = {
    method: request.method,
    pathname: request.nextUrl.pathname,
    accept: request.headers.get("accept"),
    userAgent: request.headers.get("user-agent"),
    isRsc: request.headers.get("rsc") === "1",
    isPrefetch:
      request.headers.has("next-router-prefetch") || request.headers.get("purpose") === "prefetch",
  };
  if (shouldCountView(view)) {
    // Counted after the response is sent, so it never slows the page down.
    event.waitUntil(recordView(viewPath(view.pathname)));
  }

  // A fresh nonce per request. Next.js reads it from this request header and puts it
  // on its own scripts; the browser then runs only scripts that carry it.
  const csp = buildCsp(createNonce(), { dev: process.env.NODE_ENV === "development" });
  request.headers.set("content-security-policy", csp);

  const response = await updateSession(request);
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  // Skip static files and images.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
