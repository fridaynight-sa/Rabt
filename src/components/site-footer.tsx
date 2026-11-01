import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-slate-500">
        <p>© {new Date().getFullYear()} ربط. منصة تربط المشاريع بالموردين ومزودي الخدمات.</p>
        <nav aria-label="روابط" className="flex gap-4">
          <Link href="/terms" className="hover:text-slate-800 hover:underline">
            شروط الاستخدام
          </Link>
          <Link href="/privacy" className="hover:text-slate-800 hover:underline">
            سياسة الخصوصية
          </Link>
        </nav>
      </div>
    </footer>
  );
}
