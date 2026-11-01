import "server-only";
import { createClient } from "@/lib/supabase/server";

export type PublicReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  edited: boolean;
  reviewerName: string;
  isMine: boolean;
};

/** A provider's reviews, the viewer's own first. */
export async function getProviderReviews(providerId: string, limit = 30): Promise<PublicReview[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_provider_reviews", {
    p_provider_id: providerId,
    p_limit: limit,
  });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.created_at,
    edited: new Date(r.updated_at).getTime() - new Date(r.created_at).getTime() > 60_000,
    reviewerName: r.reviewer_name,
    isMine: r.is_mine,
  }));
}

export type MyReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  providerName: string | null;
  providerSlug: string | null;
};

/** Reviews the signed-in merchant wrote. */
export async function getMyReviews(merchantId: string): Promise<MyReview[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("id, provider_id, rating, comment, created_at")
    .eq("merchant_id", merchantId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const ids = [...new Set((data ?? []).map((r) => r.provider_id))];
  const providers = ids.length
    ? await supabase.from("providers").select("id, business_name, slug").in("id", ids)
    : { data: [], error: null };
  if (providers.error) throw providers.error;
  return (data ?? []).map((r) => {
    const p = (providers.data ?? []).find((x) => x.id === r.provider_id);
    return {
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.created_at,
      providerName: p?.business_name ?? null,
      providerSlug: p?.slug ?? null,
    };
  });
}
