import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/features/auth/session";
import { getMyReviews } from "@/features/reviews/queries";
import { searchHref } from "@/features/search/params";
import { timeAgo } from "@/lib/format";

export const metadata: Metadata = { title: "حسابي" };

export default async function MerchantDashboardPage() {
  const user = await requireUser(["merchant"]);
  const reviews = await getMyReviews(user.id);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">أهلاً {user.fullName}</h1>

      <Card>
        <h2 className="text-lg font-semibold text-slate-900">وش يحتاج مشروعك اليوم؟</h2>
        <p className="mt-1 text-sm text-slate-600">
          ابحث في الإعلانات والموردين، وتواصل معهم مباشرة.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <ButtonLink href="/search">تصفح الإعلانات</ButtonLink>
          <ButtonLink href={searchHref({ type: "providers" })} variant="secondary">
            تصفح الموردين
          </ButtonLink>
          <ButtonLink href="/dashboard/account" variant="ghost">
            إعدادات الحساب
          </ButtonLink>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-slate-900">تقييماتي ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">
            تعاملت مع مورد؟ ادخل صفحته وقيّم تجربتك، تساعد غيرك من التجار.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {reviews.map((r) => (
              <li key={r.id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {r.providerSlug ? (
                    <Link
                      href={`/providers/${r.providerSlug}#reviews`}
                      className="font-semibold text-slate-900 hover:underline"
                    >
                      {r.providerName}
                    </Link>
                  ) : (
                    <span className="font-semibold text-slate-500">مورد غير متاح حالياً</span>
                  )}
                  <span className="text-xs text-slate-500">{timeAgo(r.createdAt)}</span>
                </div>
                <p className="text-amber-500" role="img" aria-label={`${r.rating} من 5`}>
                  {"★".repeat(r.rating)}
                  <span className="text-slate-300">{"★".repeat(5 - r.rating)}</span>
                </p>
                {r.comment && (
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{r.comment}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
