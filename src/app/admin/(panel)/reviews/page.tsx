import type { Metadata } from "next";
import Link from "next/link";
import { adminDeleteReview } from "@/features/admin/actions";
import { ActionButton } from "@/features/admin/components/action-button";
import { ADMIN_PAGE_SIZE, listReviews } from "@/features/admin/queries";
import { requireAdmin } from "@/features/admin/session";
import { Pagination } from "@/features/search/components/pagination";
import { timeAgo } from "@/lib/format";

export const metadata: Metadata = { title: "التقييمات" };

type Props = { searchParams: Promise<{ page?: string }> };

export default async function AdminReviewsPage({ searchParams }: Props) {
  await requireAdmin();
  const page = Math.max(Number.parseInt((await searchParams).page ?? "1", 10) || 1, 1);
  const { total, items } = await listReviews(page);

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">{total} تقييم، الأحدث أولاً</p>
      <ul className="space-y-2">
        {items.map((r) => (
          <li key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">{r.merchantName}</span> قيّم{" "}
                  <Link
                    href={`/providers/${r.providerSlug}#reviews`}
                    className="font-semibold text-brand-700 hover:underline"
                  >
                    {r.providerName}
                  </Link>{" "}
                  · {timeAgo(r.created_at)}
                </p>
                <p className="text-amber-500" role="img" aria-label={`${r.rating} من 5`}>
                  {"★".repeat(r.rating)}
                  <span className="text-slate-300">{"★".repeat(5 - r.rating)}</span>
                </p>
                {r.comment && (
                  <p className="mt-1 whitespace-pre-line text-slate-700">{r.comment}</p>
                )}
              </div>
              <ActionButton
                action={adminDeleteReview.bind(null, r.id)}
                label="حذف"
                tone="danger"
                confirmText="حذف التقييم؟ ينحفظ نصه في سجل العمليات."
              />
            </div>
          </li>
        ))}
      </ul>
      <Pagination
        page={page}
        pageCount={Math.ceil(total / ADMIN_PAGE_SIZE)}
        hrefFor={(p) => (p > 1 ? `/admin/reviews?page=${p}` : "/admin/reviews")}
      />
    </div>
  );
}
