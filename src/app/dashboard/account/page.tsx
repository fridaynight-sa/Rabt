import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountSettings } from "@/features/account/components/account-settings";
import { requireUser } from "@/features/auth/session";

export const metadata: Metadata = { title: "إعدادات الحساب" };

export default async function AccountPage() {
  const user = await requireUser();
  // Providers have the same page inside their dashboard.
  if (user.role === "provider") redirect("/dashboard/provider/account");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">إعدادات الحساب</h1>
      <AccountSettings user={user} />
    </div>
  );
}
