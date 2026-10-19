import { requireUser } from "@/features/auth/session";
import { ProviderNav } from "@/features/providers/components/provider-nav";

export default async function ProviderDashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(["provider"]);
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">أهلاً {user.fullName}</h1>
      <div className="mt-6">
        <ProviderNav />
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}
