import type { NextFetchEvent, NextRequest } from "next/server";
import { shouldCountView, viewPath } from "@/lib/analytics";
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
  return updateSession(request);
}

export const config = {
  // Skip static files and images.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
