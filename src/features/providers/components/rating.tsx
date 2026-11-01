/** Average rating out of 5 with the number of reviews. */
export function Rating({ average, count }: { average: number; count: number }) {
  if (count === 0) return <span className="text-sm text-slate-500">لا توجد تقييمات بعد</span>;
  const rounded = Math.round(average);
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span aria-hidden="true" className="tracking-tight text-amber-500">
        {"★".repeat(rounded)}
        <span className="text-slate-300">{"★".repeat(5 - rounded)}</span>
      </span>
      <span className="font-semibold text-slate-800">{average.toFixed(1)}</span>
      <span className="text-slate-500">({count} تقييم)</span>
      <span className="sr-only">
        التقييم {average.toFixed(1)} من 5، من {count} تقييم
      </span>
    </span>
  );
}
