"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/dashboard/provider", label: "نظرة عامة" },
  { href: "/dashboard/provider/profile", label: "بيانات الصفحة" },
  { href: "/dashboard/provider/portfolio", label: "صور الأعمال" },
];

export function ProviderNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="لوحة المورد" className="-mx-4 overflow-x-auto px-4">
      <ul className="flex gap-1 border-b border-slate-200">
        {tabs.map((t) => {
          const active = pathname === t.href;
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`block whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium ${
                  active
                    ? "border-brand-700 text-brand-800"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
