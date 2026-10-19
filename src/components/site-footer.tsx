export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-500">
        © {new Date().getFullYear()} ربط. منصة تربط المشاريع بالموردين ومزودي الخدمات.
      </div>
    </footer>
  );
}
