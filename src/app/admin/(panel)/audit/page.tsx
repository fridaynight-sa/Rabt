import type { Metadata } from "next";
import { ADMIN_PAGE_SIZE, listAudit } from "@/features/admin/queries";
import { requireAdmin } from "@/features/admin/session";
import { Pagination } from "@/features/search/components/pagination";

export const metadata: Metadata = { title: "سجل العمليات" };

const ACTIONS: Record<string, string> = {
  "account.create": "أنشأ حساب",
  "account.delete": "حذف حساب",
  "account.suspend": "أوقف حساب",
  "account.activate": "فعّل حساب",
  "provider.verify": "وثّق مورد",
  "provider.unverify": "ألغى توثيق مورد",
  "listing.hide": "أخفى إعلان",
  "listing.show": "أظهر إعلان",
  "review.delete": "حذف تقييم",
  "report.resolved": "حل بلاغ",
  "report.dismissed": "رفض بلاغ",
  "reference.add": "أضاف لقائمة",
  "reference.rename": "عدّل قائمة",
};

const when = new Intl.DateTimeFormat("ar-SA-u-nu-latn-ca-gregory", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Riyadh",
});

function summary(details: unknown): string {
  if (!details || typeof details !== "object") return "";
  const d = details as Record<string, unknown>;
  return [d.name, d.name_ar, d.comment].filter((x) => typeof x === "string" && x).join(" · ");
}

type Props = { searchParams: Promise<{ page?: string }> };

export default async function AdminAuditPage({ searchParams }: Props) {
  await requireAdmin();
  const page = Math.max(Number.parseInt((await searchParams).page ?? "1", 10) || 1, 1);
  const { total, items } = await listAudit(page);

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        كل إجراء من الإدارة ينحفظ هنا تلقائياً، وما يمكن تعديله أو حذفه.
      </p>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-2 text-start font-medium">الوقت</th>
              <th className="px-4 py-2 text-start font-medium">من</th>
              <th className="px-4 py-2 text-start font-medium">الإجراء</th>
              <th className="px-4 py-2 text-start font-medium">التفاصيل</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id} className="border-t border-slate-100 align-top">
                <td className="whitespace-nowrap px-4 py-2 text-slate-600">
                  {when.format(new Date(a.created_at))}
                </td>
                <td className="px-4 py-2">{a.actorName}</td>
                <td className="px-4 py-2 font-medium">{ACTIONS[a.action] ?? a.action}</td>
                <td className="px-4 py-2 text-slate-600">{summary(a.details)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="p-6 text-center text-slate-500">السجل فاضي.</p>}
      </div>
      <Pagination
        page={page}
        pageCount={Math.ceil(total / ADMIN_PAGE_SIZE)}
        hrefFor={(p) => (p > 1 ? `/admin/audit?page=${p}` : "/admin/audit")}
      />
    </div>
  );
}
