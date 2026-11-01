import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { ContactMethod, ListingStatus } from "@/lib/supabase/database.types";

export type ListingCardData = {
  id: string;
  title: string;
  price: number | null;
  cityId: number;
  categoryId: number;
  createdAt: string;
  providerName: string;
  providerSlug: string;
  providerVerified: boolean;
  coverKey: string | null;
};

export type ListingSearch = {
  query?: string | null;
  cityId?: number | null;
  categoryId?: number | null;
  sectorId?: number | null;
  providerId?: string | null;
  sort?: "new" | "price_low" | "price_high";
  page?: number;
  pageSize?: number;
};

/** Published listings matching the filters, one page at a time. */
export async function searchListings(params: ListingSearch) {
  const pageSize = params.pageSize ?? 24;
  const page = Math.max(params.page ?? 1, 1);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_listings", {
    p_query: params.query ?? null,
    p_city_id: params.cityId ?? null,
    p_category_id: params.categoryId ?? null,
    p_sector_id: params.sectorId ?? null,
    p_provider_id: params.providerId ?? null,
    p_sort: params.sort ?? "new",
    p_limit: pageSize,
    p_offset: (page - 1) * pageSize,
  });
  if (error) throw error;
  const rows = data ?? [];
  return {
    total: rows[0] ? Number(rows[0].total_count) : 0,
    items: rows.map((r): ListingCardData => ({
      id: r.id,
      title: r.title,
      price: r.price === null ? null : Number(r.price),
      cityId: r.city_id,
      categoryId: r.category_id,
      createdAt: r.created_at,
      providerName: r.provider_name,
      providerSlug: r.provider_slug,
      providerVerified: r.provider_verified,
      coverKey: r.cover_key,
    })),
  };
}

export type ListingDetails = {
  id: string;
  providerId: string;
  title: string;
  description: string;
  price: number | null;
  cityId: number;
  categoryId: number;
  contactMethod: ContactMethod;
  status: ListingStatus;
  createdAt: string;
  images: { id: string; storageKey: string }[];
};

/** One listing with its images. Row level security decides who can see it. */
export const getListing = cache(async (id: string): Promise<ListingDetails | null> => {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const supabase = await createClient();
  const [listing, images] = await Promise.all([
    supabase
      .from("listings")
      .select(
        "id, provider_id, title, description, price, city_id, category_id, contact_method, status, created_at",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("listing_images")
      .select("id, storage_key")
      .eq("listing_id", id)
      .order("sort_order")
      .order("created_at"),
  ]);
  if (listing.error) throw listing.error;
  if (images.error) throw images.error;
  const l = listing.data;
  if (!l) return null;
  return {
    id: l.id,
    providerId: l.provider_id,
    title: l.title,
    description: l.description,
    price: l.price === null ? null : Number(l.price),
    cityId: l.city_id,
    categoryId: l.category_id,
    contactMethod: l.contact_method,
    status: l.status,
    createdAt: l.created_at,
    images: (images.data ?? []).map((i) => ({ id: i.id, storageKey: i.storage_key })),
  };
});

export type OwnListing = {
  id: string;
  title: string;
  price: number | null;
  status: ListingStatus;
  createdAt: string;
  imageCount: number;
  coverKey: string | null;
};

/** All of a provider's own listings, including ones an admin hid. */
export async function getOwnListings(providerId: string): Promise<OwnListing[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("id, title, price, status, created_at")
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const ids = (data ?? []).map((l) => l.id);
  const images = ids.length
    ? await supabase
        .from("listing_images")
        .select("listing_id, storage_key, sort_order, created_at")
        .in("listing_id", ids)
        .order("sort_order")
        .order("created_at")
    : { data: [], error: null };
  if (images.error) throw images.error;

  return (data ?? []).map((l) => {
    const own = (images.data ?? []).filter((i) => i.listing_id === l.id);
    return {
      id: l.id,
      title: l.title,
      price: l.price === null ? null : Number(l.price),
      status: l.status,
      createdAt: l.created_at,
      imageCount: own.length,
      coverKey: own[0]?.storage_key ?? null,
    };
  });
}
