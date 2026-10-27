import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { deleteAccount, setAccountStatus, setProviderVerified } from "@/features/admin/actions";
import { ActionButton } from "@/features/admin/components/action-button";
import { ADMIN_PAGE_SIZE, listAccounts } from "@/features/admin/queries";
import { requireAdmin } from "@/features/admin/session";
import { Pagination } from "@/features/search/components/pagination";
import { timeAgo } from "@/lib/format";
import type { AccountStatus, UserRole } from "@/lib/supabase/database.types";

export const metadata: Metadata = { title: "الحسابات" };

const ROLE_LABEL: Record<UserRole, string> = { merchant: "تاجر", provider: "مورد", admin: "أدمن" };

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function AdminAccountsPage({ searchParams }: Props) {
  const me = await requireAdmin();
  const sp = await searchParams;
  const role = (["merchant", "provider", "admin"] as const).find((r) => r === sp.role) ?? null;
  const status = (["active", "suspended"] as const).find((s) => s === sp.status) ?? null;
  const query = (sp.q ?? "").trim().slice(0, 100);
  const page = Math.max(Number.parseInt(sp.page ?? "1", 10) || 1, 1);
  const { total, items } = await listAccounts({ role, status, query, page });

  const href = (p: number) => {
    const u = new URLSearchParams();
    if (role) u.set("role", role);
    if (status) u.set("status", status);
    if (query) u.set("q", query);
    if (p > 1) u.set("page", String(p));
    const s = u.toString();
    return s ? `/admin/accounts?${s}` : "/admin/accounts";
  };

  return (
    <div className="space-y-4">
      {sp.created && <Alert tone="success">انضاف الحساب.</Alert>}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <form className="flex flex-wrap items-end gap-2" role="search">
          <label className="text-sm">
            <span className="block text-slate-600">بحث</span>
            <input
              name="q"
              defaultValue={query}
              placeholder="الاسم أو الإيميل أو الجوال"
              className="mt-1 w-56 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="block text-slate-600">النوع</span>
            <select
              name="role"
              defaultValue={role ?? ""}
              className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">الكل</option>
              <option value="merchant">تجار</option>
              <option value="provider">موردين</option>
              <option value="admin">أدمن</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="block text-slate-600">الحالة</span>
            <select
              name="status"
              defaultValue={status ?? ""}
              className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">الكل</option>
              <option value="active">نشط</option>
              <option value="suspended">موقوف</option>
            </select>
          </label>
          <button
            type="submit"
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white"
          >
            عرض
          </button>
        </form>
        <ButtonLink href="/admin/accounts/new">إضافة حساب</ButtonLink>
      </div>

      <p className="text-sm text-slate-600">{total} حساب</p>

      <ul className="space-y-2">
        {items.map((a) => {
          const isAdmin = a.role === "admin";
          return (
            <li key={a.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-slate-900">
                    {a.provider_slug ? (
                      <Link href={`/providers/${a.provider_slug}`} className="hover:underline">
                        {a.full_name}
                      </Link>
                    ) : (
                      a.full_name
                    )}
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {ROLE_LABEL[a.role]}
                    </span>
                    {a.provider_verified && (
                      <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-800">
                        موثّق
                      </span>
                    )}
                    {a.status === "suspended" && (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                        موقوف
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-600" dir="ltr">
                    {a.email}
                    {a.phone && ` · ${a.phone}`}
                  </p>
                  <p className="text-xs text-slate-500">سجّل {timeAgo(a.created_at)}</p>
                </div>
                {!isAdmin && a.id !== me.id && (
                  <div className="flex flex-wrap gap-2">
                    {a.role === "provider" && (
                      <ActionButton
                        action={setProviderVerified.bind(null, a.id, !a.provider_verified)}
                        label={a.provider_verified ? "إلغاء التوثيق" : "توثيق"}
                      />
                    )}
                    {a.status === "active" ? (
                      <ActionButton
                        action={setAccountStatus.bind(null, a.id, "suspended" as AccountStatus)}
                        label="إيقاف"
                        tone="danger"
                        confirmText={`إيقاف حساب ${a.full_name}؟ تختفي صفحته وإعلاناته وما يقدر يسجل دخول.`}
                      />
                    ) : (
                      <ActionButton
                        action={setAccountStatus.bind(null, a.id, "active" as AccountStatus)}
                        label="تفعيل"
                        tone="primary"
                      />
                    )}
                    <ActionButton
                      action={deleteAccount.bind(null, a.id)}
                      label="حذف"
                      tone="danger"
                      confirmText={`حذف حساب ${a.full_name} نهائياً مع كل بياناته وصوره؟ ما يمكن التراجع.`}
                    />
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <Pagination page={page} pageCount={Math.ceil(total / ADMIN_PAGE_SIZE)} hrefFor={href} />
    </div>
  );
}
