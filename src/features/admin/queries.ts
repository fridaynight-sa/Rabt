import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  AccountStatus,
  ListingStatus,
  ReportStatus,
  UserRole,
} from "@/lib/supabase/database.types";

export const ADMIN_PAGE_SIZE = 50;

export type AdminStats = {
  merchants: number;
  providers: number;
  suspended: number;
  newAccounts: number;
  listings: number;
  hiddenListings: number;
  reviews: number;
  openReports: number;
  viewsTotal: number;
  viewsByDay: { day: string; views: number }[];
  topPages: { path: string; views: number }[];
};

export async function getAdminStats(days = 30): Promise<AdminStats> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_stats", { p_days: days });
  if (error) throw error;
  const s = data as Record<string, unknown>;
  const n = (k: string) => Number(s[k] ?? 0);
  return {
    merchants: n("merchants"),
    providers: n("providers"),
    suspended: n("suspended"),
    newAccounts: n("new_accounts"),
    listings: n("listings"),
    hiddenListings: n("hidden_listings"),
    reviews: n("reviews"),
    openReports: n("open_reports"),
    viewsTotal: n("views_total"),
    viewsByDay: ((s.views_by_day as { day: string; views: number }[]) ?? []).map((d) => ({
      day: d.day,
      views: Number(d.views),
    })),
    topPages: ((s.top_pages as { path: string; views: number }[]) ?? []).map((p) => ({
      path: p.path,
      views: Number(p.views),
    })),
  };
}

export async function listAccounts(params: {
  role?: UserRole | null;
  status?: AccountStatus | null;
  query?: string | null;
  page?: number;
}) {
  const supabase = await createClient();
  const page = Math.max(params.page ?? 1, 1);
  const { data, error } = await supabase.rpc("admin_list_accounts", {
    p_role: params.role ?? null,
    p_status: params.status ?? null,
    p_query: params.query || null,
    p_limit: ADMIN_PAGE_SIZE,
    p_offset: (page - 1) * ADMIN_PAGE_SIZE,
  });
  if (error) throw error;
  const rows = data ?? [];
  return { total: rows[0] ? Number(rows[0].total_count) : 0, items: rows };
}

export async function listReports(status: ReportStatus | null, page = 1) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_reports", {
    p_status: status,
    p_limit: ADMIN_PAGE_SIZE,
    p_offset: (Math.max(page, 1) - 1) * ADMIN_PAGE_SIZE,
  });
  if (error) throw error;
  const rows = data ?? [];
  return { total: rows[0] ? Number(rows[0].total_count) : 0, items: rows };
}

/** Escapes % and _ so a typed search is matched as plain text. */
function likeTerm(q: string): string {
  return `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

export async function listListings(params: {
  status?: ListingStatus | null;
  query?: string | null;
  page?: number;
}) {
  const supabase = await createClient();
  const page = Math.max(params.page ?? 1, 1);
  let q = supabase
    .from("listings")
    .select("id, title, price, status, created_at, provider_id", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * ADMIN_PAGE_SIZE, page * ADMIN_PAGE_SIZE - 1);
  if (params.status) q = q.eq("status", params.status);
  if (params.query) q = q.ilike("title", likeTerm(params.query));
  const { data, error, count } = await q;
  if (error) throw error;

  const providerIds = [...new Set((data ?? []).map((l) => l.provider_id))];
  const providers = providerIds.length
    ? await supabase.from("providers").select("id, business_name, slug").in("id", providerIds)
    : { data: [] };
  return {
    total: count ?? 0,
    items: (data ?? []).map((l) => {
      const p = (providers.data ?? []).find((x) => x.id === l.provider_id);
      return { ...l, providerName: p?.business_name ?? "", providerSlug: p?.slug ?? "" };
    }),
  };
}

export async function listReviews(page = 1) {
  const supabase = await createClient();
  const { data, error, count } = await supabase
    .from("reviews")
    .select("id, provider_id, merchant_id, rating, comment, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * ADMIN_PAGE_SIZE, page * ADMIN_PAGE_SIZE - 1);
  if (error) throw error;

  const providerIds = [...new Set((data ?? []).map((r) => r.provider_id))];
  const merchantIds = [...new Set((data ?? []).map((r) => r.merchant_id))];
  const [providers, merchants] = await Promise.all([
    providerIds.length
      ? supabase.from("providers").select("id, business_name, slug").in("id", providerIds)
      : { data: [] },
    merchantIds.length
      ? supabase.from("profiles").select("id, full_name").in("id", merchantIds)
      : { data: [] },
  ]);
  return {
    total: count ?? 0,
    items: (data ?? []).map((r) => {
      const p = (providers.data ?? []).find((x) => x.id === r.provider_id);
      const m = (merchants.data ?? []).find((x) => x.id === r.merchant_id);
      return {
        ...r,
        providerName: p?.business_name ?? "",
        providerSlug: p?.slug ?? "",
        merchantName: m?.full_name ?? "",
      };
    }),
  };
}

export async function listAudit(page = 1) {
  const supabase = await createClient();
  const { data, error, count } = await supabase
    .from("audit_log")
    .select("id, actor_id, action, target_type, target_id, details, created_at", { count: "exact" })
    .order("id", { ascending: false })
    .range((page - 1) * ADMIN_PAGE_SIZE, page * ADMIN_PAGE_SIZE - 1);
  if (error) throw error;
  const actorIds = [...new Set((data ?? []).flatMap((a) => (a.actor_id ? [a.actor_id] : [])))];
  const actors = actorIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", actorIds)
    : { data: [] };
  return {
    total: count ?? 0,
    items: (data ?? []).map((a) => ({
      ...a,
      actorName: (actors.data ?? []).find((x) => x.id === a.actor_id)?.full_name ?? "حساب محذوف",
    })),
  };
}
