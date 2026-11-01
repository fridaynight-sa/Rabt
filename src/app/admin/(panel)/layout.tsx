import type { Metadata } from "next";
import { AdminNav } from "@/features/admin/components/admin-nav";
import { getAdminStats } from "@/features/admin/queries";
import { requireAdmin } from "@/features/admin/session";

export const metadata: Metadata = {
  title: { default: "لوحة الإدارة", template: "%s | الإدارة" },
  robots: { index: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const stats = await getAdminStats(1);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">لوحة الإدارة</h1>
      <div className="mt-4">
        <AdminNav openReports={stats.openReports} />
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}
