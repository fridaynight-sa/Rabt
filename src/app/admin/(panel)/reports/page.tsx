import type { Metadata } from "next";
import Link from "next/link";
import {
  adminDeleteReview,
  resolveReport,
  setAccountStatus,
  setListingStatus,
} from "@/features/admin/actions";
import { ActionButton } from "@/features/admin/components/action-button";
import { ADMIN_PAGE_SIZE, listReports } from "@/features/admin/queries";
import { requireAdmin } from "@/features/admin/session";
import { Pagination } from "@/features/search/components/pagination";
import { timeAgo } from "@/lib/format";
import type { AccountStatus, ListingStatus, ReportStatus } from "@/lib/supabase/database.types";

export const metadata: Metadata = { title: "البلاغات" };

const TARGET: Record<string, string> = { provider: "مورد", listing: "إعلان", review: "تقييم" };
const STATUS_TABS = [
  { value: "open", label: "مفتوحة" },
  { value: "resolved", label: "تم حلها" },
  { value: "dismissed", label: "مرفوضة" },
] as const;

type Props = { searchParams: Promise<{ status?: string; page?: string }> };

export default async function AdminReportsPage({ searchParams }: Props) {
  await requireAdmin();
  const sp = await searchParams;
  const status: ReportStatus = STATUS_TABS.find((t) => t.value === sp.status)?.value ?? "open";
  const page = Math.max(Number.parseInt(sp.page ?? "1", 10) || 1, 1);
  const { total, items } = await listReports(status, page);

  return (
    <div className="space-y-4">
      <nav aria-label="حالة البلاغات" className="flex gap-2">
        {STATUS_TABS.map((t) => (
          <Link
            key={t.value}
            href={t.value === "open" ? "/admin/reports" : `/admin/reports?status=${t.value}`}
            aria-current={status === t.value ? "page" : undefined}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
              status === t.value
                ? "bg-brand-700 text-white"
                : "border border-slate-300 bg-white text-slate-700"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
          {status === "open" ? "ما فيه بلاغات مفتوحة. كل شي تمام." : "ما فيه بلاغات هنا."}
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((r) => (
            <li key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-600">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                  {TARGET[r.target_type]}
                </span>{" "}
                {r.target_path ? (
                  <Link
                    href={r.target_path}
                    className="font-semibold text-brand-700 hover:underline"
                  >
                    {r.target_label ?? "عرض"}
                  </Link>
                ) : (
                  <span className="text-slate-500">انحذف</span>
                )}
              </p>
              <p className="mt-2 text-slate-800">{r.reason}</p>
              <p className="mt-1 text-xs text-slate-500">
                من {r.reporter_name} · {timeAgo(r.created_at)}
              </p>

              {r.status === "open" && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  {r.target_type === "listing" && r.target_path && (
                    <ActionButton
                      action={setListingStatus.bind(null, r.target_id, "hidden" as ListingStatus)}
                      label="إخفاء الإعلان"
                      tone="danger"
                      confirmText="إخفاء الإعلان؟"
                    />
                  )}
                  {r.target_type === "review" && r.target_path && (
                    <ActionButton
                      action={adminDeleteReview.bind(null, r.target_id)}
                      label="حذف التقييم"
                      tone="danger"
                      confirmText="حذف التقييم؟"
                    />
                  )}
                  {r.target_owner_id && (
                    <ActionButton
                      action={setAccountStatus.bind(
                        null,
                        r.target_owner_id,
                        "suspended" as AccountStatus,
                      )}
                      label="إيقاف صاحب الحساب"
                      tone="danger"
                      confirmText="إيقاف صاحب هذا الحساب؟"
                    />
                  )}
                  <ActionButton
                    action={resolveReport.bind(null, r.id, "resolved" as ReportStatus)}
                    label="تم الحل"
                    tone="primary"
                  />
                  <ActionButton
                    action={resolveReport.bind(null, r.id, "dismissed" as ReportStatus)}
                    label="رفض البلاغ"
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <Pagination
        page={page}
        pageCount={Math.ceil(total / ADMIN_PAGE_SIZE)}
        hrefFor={(p) => `/admin/reports?status=${status}${p > 1 ? `&page=${p}` : ""}`}
      />
    </div>
  );
}
