"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin", label: "الإحصائيات" },
  { href: "/admin/reports", label: "البلاغات" },
  { href: "/admin/accounts", label: "الحسابات" },
  { href: "/admin/listings", label: "الإعلانات" },
  { href: "/admin/reviews", label: "التقييمات" },
  { href: "/admin/lists", label: "الأقسام والمدن" },
  { href: "/admin/audit", label: "سجل العمليات" },
];

export function AdminNav({ openReports }: { openReports: number }) {
  const pathname = usePathname();
  return (
    <nav aria-label="لوحة الإدارة" className="-mx-4 overflow-x-auto px-4">
      <ul className="flex gap-1 border-b border-slate-200">
        {tabs.map((t) => {
          const active = t.href === "/admin" ? pathname === t.href : pathname.startsWith(t.href);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium ${
                  active
                    ? "border-brand-700 text-brand-800"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                {t.label}
                {t.href === "/admin/reports" && openReports > 0 && (
                  <span className="rounded-full bg-red-600 px-1.5 text-xs font-bold text-white">
                    {openReports}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
