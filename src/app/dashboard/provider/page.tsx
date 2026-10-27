import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/features/auth/session";
import { getProviderById } from "@/features/providers/queries";

export const metadata: Metadata = { title: "لوحة المورد" };

export default async function ProviderOverviewPage() {
  const user = await requireUser(["provider"]);
  const provider = await getProviderById(user.id);
  if (!provider) notFound();

  const steps = [
    {
      done: Boolean(provider.description),
      label: "اكتب وصف مختصر عن نشاطك",
      href: "/dashboard/provider/profile",
    },
    {
      done: provider.sectors.length > 0,
      label: "اختر نوع المشاريع اللي تخدمها",
      href: "/dashboard/provider/profile",
    },
    {
      done: provider.categories.length > 0,
      label: "اختر فئات خدماتك",
      href: "/dashboard/provider/profile",
    },
    {
      done: provider.images.length >= 3,
      label: "أضف 3 صور من أعمالك على الأقل",
      href: "/dashboard/provider/portfolio",
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-lg font-semibold text-slate-900">صفحتك العامة</h2>
        <p className="mt-1 text-sm text-slate-600">
          هذي الصفحة اللي يشوفها التجار. شاركها مع عملائك.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <ButtonLink href={`/providers/${provider.slug}`}>عرض صفحتي</ButtonLink>
          <ButtonLink href="/dashboard/provider/profile" variant="secondary">
            تعديل البيانات
          </ButtonLink>
        </div>
      </Card>

      <Card>
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900">كمّل صفحتك</h2>
          <span className="text-sm text-slate-500">
            {doneCount} من {steps.length}
          </span>
        </div>
        <ul className="mt-4 space-y-2">
          {steps.map((s) => (
            <li key={s.label} className="flex items-center gap-3 text-sm">
              <span
                aria-hidden="true"
                className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
                  s.done ? "bg-brand-600 text-white" : "border border-slate-300 text-transparent"
                }`}
              >
                ✓
              </span>
              {s.done ? (
                <span className="text-slate-500 line-through">{s.label}</span>
              ) : (
                <Link href={s.href} className="font-medium text-brand-700 hover:underline">
                  {s.label}
                </Link>
              )}
              <span className="sr-only">{s.done ? "(تم)" : "(باقي)"}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
