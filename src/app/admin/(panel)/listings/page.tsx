import type { Metadata } from "next";
import Link from "next/link";
import { setListingStatus } from "@/features/admin/actions";
import { ActionButton } from "@/features/admin/components/action-button";
import { ADMIN_PAGE_SIZE, listListings } from "@/features/admin/queries";
import { requireAdmin } from "@/features/admin/session";
import { Pagination } from "@/features/search/components/pagination";
import { formatPrice, timeAgo } from "@/lib/format";
import type { ListingStatus } from "@/lib/supabase/database.types";

export const metadata: Metadata = { title: "الإعلانات" };

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function AdminListingsPage({ searchParams }: Props) {
  await requireAdmin();
  const sp = await searchParams;
  const status = (["published", "hidden"] as const).find((s) => s === sp.status) ?? null;
  const query = (sp.q ?? "").trim().slice(0, 100);
  const page = Math.max(Number.parseInt(sp.page ?? "1", 10) || 1, 1);
  const { total, items } = await listListings({ status, query, page });

  const href = (p: number) => {
    const u = new URLSearchParams();
    if (status) u.set("status", status);
    if (query) u.set("q", query);
    if (p > 1) u.set("page", String(p));
    const s = u.toString();
    return s ? `/admin/listings?${s}` : "/admin/listings";
  };

  return (
    <div className="space-y-4">
      <form className="flex flex-wrap items-end gap-2" role="search">
        <label className="text-sm">
          <span className="block text-slate-600">بحث في العناوين</span>
          <input
            name="q"
            defaultValue={query}
            className="mt-1 w-56 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="block text-slate-600">الحالة</span>
          <select
            name="status"
            defaultValue={status ?? ""}
            className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">الكل</option>
            <option value="published">منشور</option>
            <option value="hidden">مخفي</option>
          </select>
        </label>
        <button
          type="submit"
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white"
        >
          عرض
        </button>
      </form>

      <p className="text-sm text-slate-600">{total} إعلان</p>

      <ul className="space-y-2">
        {items.map((l) => (
          <li
            key={l.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div className="min-w-0">
              <Link
                href={`/listings/${l.id}`}
                className="font-semibold text-slate-900 hover:underline"
              >
                {l.title}
              </Link>
              {l.status === "hidden" && (
                <span className="ms-2 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                  مخفي
                </span>
              )}
              <p className="text-sm text-slate-600">
                {formatPrice(l.price === null ? null : Number(l.price))} ·{" "}
                <Link href={`/providers/${l.providerSlug}`} className="hover:underline">
                  {l.providerName}
                </Link>{" "}
                · {timeAgo(l.created_at)}
              </p>
            </div>
            {l.status === "published" ? (
              <ActionButton
                action={setListingStatus.bind(null, l.id, "hidden" as ListingStatus)}
                label="إخفاء"
                tone="danger"
                confirmText="إخفاء الإعلان؟ يختفي من الموقع ويشوفه صاحبه فقط."
              />
            ) : (
              <ActionButton
                action={setListingStatus.bind(null, l.id, "published" as ListingStatus)}
                label="إظهار"
                tone="primary"
              />
            )}
          </li>
        ))}
      </ul>

      <Pagination page={page} pageCount={Math.ceil(total / ADMIN_PAGE_SIZE)} hrefFor={href} />
    </div>
  );
}
