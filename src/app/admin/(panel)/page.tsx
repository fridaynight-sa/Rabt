import Link from "next/link";
import { Card } from "@/components/ui/card";
import { VisitsChart } from "@/features/admin/components/visits-chart";
import { getAdminStats } from "@/features/admin/queries";
import { requireAdmin } from "@/features/admin/session";

const number = new Intl.NumberFormat("en-US");

function Tile({
  label,
  value,
  href,
  alert,
}: {
  label: string;
  value: number;
  href?: string;
  alert?: boolean;
}) {
  const body = (
    <>
      <p className="text-sm text-slate-600">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${alert ? "text-red-700" : "text-slate-900"}`}>
        {number.format(value)}
      </p>
    </>
  );
  const cls = "block rounded-2xl border border-slate-200 bg-white p-4";
  return href ? (
    <Link href={href} className={`${cls} hover:border-brand-400`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export default async function AdminHomePage() {
  await requireAdmin();
  const s = await getAdminStats(30);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile
          label="بلاغات مفتوحة"
          value={s.openReports}
          href="/admin/reports"
          alert={s.openReports > 0}
        />
        <Tile label="التجار" value={s.merchants} href="/admin/accounts?role=merchant" />
        <Tile label="الموردين" value={s.providers} href="/admin/accounts?role=provider" />
        <Tile label="حسابات جديدة (30 يوم)" value={s.newAccounts} />
        <Tile label="إعلانات منشورة" value={s.listings} href="/admin/listings" />
        <Tile label="إعلانات مخفية" value={s.hiddenListings} href="/admin/listings?status=hidden" />
        <Tile label="التقييمات" value={s.reviews} href="/admin/reviews" />
        <Tile label="حسابات موقوفة" value={s.suspended} href="/admin/accounts?status=suspended" />
      </div>

      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">الزيارات اليومية (آخر 30 يوم)</h2>
          <p className="text-sm text-slate-600">
            المجموع: <span className="font-bold text-slate-900">{number.format(s.viewsTotal)}</span>
          </p>
        </div>
        <div className="mt-4">
          <VisitsChart data={s.viewsByDay} />
        </div>
        <p className="mt-3 text-xs text-slate-500">
          تُحسب زيارات الصفحات العامة من الأشخاص فقط، بدون البوتات ولوحات التحكم.
        </p>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-slate-900">أكثر الصفحات زيارة</h2>
        {s.topPages.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">ما فيه زيارات مسجلة للحين.</p>
        ) : (
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-start text-slate-500">
                <th className="py-2 text-start font-medium">الصفحة</th>
                <th className="py-2 text-end font-medium">الزيارات</th>
              </tr>
            </thead>
            <tbody>
              {s.topPages.map((p) => (
                <tr key={p.path} className="border-t border-slate-100">
                  <td className="py-2">
                    {/^\/(?!\/)/.test(p.path) ? (
                      <Link href={p.path} dir="ltr" className="text-brand-700 hover:underline">
                        {p.path}
                      </Link>
                    ) : (
                      <span dir="ltr">{p.path}</span>
                    )}
                  </td>
                  <td className="py-2 text-end font-semibold">{number.format(p.views)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
