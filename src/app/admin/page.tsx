import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/features/auth/session";

export const metadata: Metadata = { title: "لوحة الإدارة", robots: { index: false } };

export default async function AdminPage() {
  const user = await requireUser(["admin"]);
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">لوحة الإدارة</h1>
      <Card className="mt-6">
        <p className="text-slate-700">أهلاً {user.fullName}، دخلت كأدمن.</p>
        <p className="mt-2 text-sm text-slate-500">
          الإحصائيات وإدارة الحسابات تجي في المرحلة الخامسة.
        </p>
      </Card>
    </div>
  );
}
