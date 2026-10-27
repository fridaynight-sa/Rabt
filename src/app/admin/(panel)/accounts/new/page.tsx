import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { CreateAccountForm } from "@/features/admin/components/create-account-form";
import { requireAdmin } from "@/features/admin/session";
import { getReferenceData } from "@/features/providers/queries";

export const metadata: Metadata = { title: "إضافة حساب" };

export default async function NewAccountPage() {
  await requireAdmin();
  const { cities } = await getReferenceData();
  return (
    <Card className="max-w-xl">
      <h2 className="mb-5 text-lg font-semibold text-slate-900">إضافة حساب</h2>
      <CreateAccountForm cities={cities} />
    </Card>
  );
}
