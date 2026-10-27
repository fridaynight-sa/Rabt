const dayLabel = new Intl.DateTimeFormat("ar-SA-u-nu-latn-ca-gregory", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/** "27 أكتوبر" from "2026-10-27" (a time part, if any, is ignored). */
export function label(day: string) {
  const date = new Date(`${day.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? day : dayLabel.format(date);
}

/**
 * Visits per day: one series in the brand colour, thin bars with rounded tops,
 * a value on hover, and the same numbers as a list for screen readers.
 */
export function VisitsChart({ data }: { data: { day: string; views: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.views));
  const first = data[0];
  const last = data.at(-1);

  return (
    <figure>
      <div
        className="flex h-40 items-end gap-0.5 border-b border-slate-200"
        dir="ltr"
        aria-hidden="true"
      >
        {data.map((d) => (
          <div key={d.day} className="group relative flex h-full flex-1 items-end">
            <div
              className="w-full rounded-t-[4px] bg-brand-600 transition-colors group-hover:bg-brand-800"
              style={{ height: `${d.views === 0 ? 0 : Math.max(2, (d.views / max) * 100)}%` }}
            />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white group-hover:block">
              {label(d.day)}: {d.views}
            </div>
          </div>
        ))}
      </div>
      {first && last && (
        // Pinned to each side: oldest day under the left end, newest under the right end.
        <div className="relative mt-1 h-4 text-xs text-slate-500" aria-hidden="true">
          <span className="absolute left-0">{label(first.day)}</span>
          <span className="absolute right-0">{label(last.day)}</span>
        </div>
      )}
      <figcaption className="sr-only">
        <ul>
          {data.map((d) => (
            <li key={d.day}>
              {label(d.day)}: {d.views} زيارة
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}
