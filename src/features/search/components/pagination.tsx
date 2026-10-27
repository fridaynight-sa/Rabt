import Link from "next/link";

export function Pagination({
  page,
  pageCount,
  hrefFor,
}: {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
}) {
  if (pageCount <= 1) return null;
  const linkClass =
    "rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50";
  return (
    <nav aria-label="الصفحات" className="flex items-center justify-center gap-3">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={linkClass} rel="prev">
          السابق
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm text-slate-600">
        صفحة {page} من {pageCount}
      </span>
      {page < pageCount ? (
        <Link href={hrefFor(page + 1)} className={linkClass} rel="next">
          التالي
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
