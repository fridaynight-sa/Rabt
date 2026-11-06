import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

// Built on request, so new providers and listings show up without a deploy.
// Row level security limits it to public pages: active providers, published listings.
export const dynamic = "force-dynamic";

const LIMIT = 10_000;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const supabase = await createClient();
  const [providers, listings] = await Promise.all([
    supabase
      .from("providers")
      .select("slug, updated_at")
      .order("updated_at", { ascending: false })
      .limit(LIMIT),
    supabase
      .from("listings")
      .select("id, updated_at")
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(LIMIT),
  ]);

  return [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/search`, changeFrequency: "daily", priority: 0.8 },
    ...(providers.data ?? []).map((p) => ({
      url: `${base}/providers/${p.slug}`,
      lastModified: p.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...(listings.data ?? []).map((l) => ({
      url: `${base}/listings/${l.id}`,
      lastModified: l.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.1 },
  ];
}
