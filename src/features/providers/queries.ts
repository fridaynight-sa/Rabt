import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type RefItem = { id: number; slug: string; name_ar: string };

/** Cities, sectors and categories, in display order. */
export const getReferenceData = cache(async () => {
  const supabase = await createClient();
  const [cities, sectors, categories] = await Promise.all([
    supabase.from("cities").select("id, slug, name_ar").order("sort_order"),
    supabase.from("sectors").select("id, slug, name_ar").order("sort_order"),
    supabase.from("categories").select("id, slug, name_ar").order("sort_order"),
  ]);
  for (const r of [cities, sectors, categories]) if (r.error) throw r.error;
  return {
    cities: cities.data ?? [],
    sectors: sectors.data ?? [],
    categories: categories.data ?? [],
  };
});

export type ProviderDetails = {
  id: string;
  slug: string;
  businessName: string;
  cityId: number;
  cityName: string | null;
  whatsapp: string;
  services: string;
  description: string | null;
  isVerified: boolean;
  ratingAvg: number;
  ratingCount: number;
  sectors: RefItem[];
  categories: RefItem[];
  images: { id: string; storageKey: string }[];
};

/**
 * One provider with everything its page shows. Row level security decides
 * visibility: visitors only get active providers, owners always get their own.
 */
async function loadProvider(column: "slug" | "id", value: string): Promise<ProviderDetails | null> {
  const supabase = await createClient();
  const { data: p, error } = await supabase
    .from("providers")
    .select(
      "id, slug, business_name, city_id, whatsapp, services, description, is_verified, rating_avg, rating_count",
    )
    .eq(column, value)
    .maybeSingle();
  if (error) throw error;
  if (!p) return null;

  const [ref, sectors, categories, images] = await Promise.all([
    getReferenceData(),
    supabase.from("provider_sectors").select("sector_id").eq("provider_id", p.id),
    supabase.from("provider_categories").select("category_id").eq("provider_id", p.id),
    supabase
      .from("portfolio_images")
      .select("id, storage_key")
      .eq("provider_id", p.id)
      .order("sort_order")
      .order("created_at"),
  ]);
  for (const r of [sectors, categories, images]) if (r.error) throw r.error;

  const sectorIds = new Set((sectors.data ?? []).map((s) => s.sector_id));
  const categoryIds = new Set((categories.data ?? []).map((c) => c.category_id));

  return {
    id: p.id,
    slug: p.slug,
    businessName: p.business_name,
    cityId: p.city_id,
    cityName: ref.cities.find((c) => c.id === p.city_id)?.name_ar ?? null,
    whatsapp: p.whatsapp,
    services: p.services,
    description: p.description,
    isVerified: p.is_verified,
    ratingAvg: Number(p.rating_avg),
    ratingCount: p.rating_count,
    sectors: ref.sectors.filter((s) => sectorIds.has(s.id)),
    categories: ref.categories.filter((c) => categoryIds.has(c.id)),
    images: (images.data ?? []).map((i) => ({ id: i.id, storageKey: i.storage_key })),
  };
}

export const getProviderBySlug = cache((slug: string) => loadProvider("slug", slug));
export const getProviderById = cache((id: string) => loadProvider("id", id));

export type ProviderSearch = {
  query?: string | null;
  cityId?: number | null;
  categoryId?: number | null;
  sectorId?: number | null;
  sort?: "rating" | "new";
  page?: number;
  pageSize?: number;
};

/** Active providers matching the filters, one page at a time. */
export async function searchProviders(params: ProviderSearch) {
  const pageSize = params.pageSize ?? 24;
  const page = Math.max(params.page ?? 1, 1);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_providers", {
    p_query: params.query ?? null,
    p_city_id: params.cityId ?? null,
    p_category_id: params.categoryId ?? null,
    p_sector_id: params.sectorId ?? null,
    p_sort: params.sort ?? "rating",
    p_limit: pageSize,
    p_offset: (page - 1) * pageSize,
  });
  if (error) throw error;
  const rows = data ?? [];
  return {
    total: rows[0] ? Number(rows[0].total_count) : 0,
    items: rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      businessName: r.business_name,
      cityId: r.city_id,
      services: r.services,
      isVerified: r.is_verified,
      ratingAvg: Number(r.rating_avg),
      ratingCount: r.rating_count,
      coverKey: r.cover_key,
    })),
  };
}
