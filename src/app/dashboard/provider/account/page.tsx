import type { Metadata } from "next";
import { AccountSettings } from "@/features/account/components/account-settings";
import { requireUser } from "@/features/auth/session";

export const metadata: Metadata = { title: "إعدادات الحساب" };

export default async function ProviderAccountPage() {
  const user = await requireUser(["provider"]);
  return <AccountSettings user={user} />;
}
