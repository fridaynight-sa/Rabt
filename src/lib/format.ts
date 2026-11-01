// Display formats. Latin digits, as most Saudi sites use for prices.

const priceFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

export function formatPrice(price: number | null): string {
  return price === null ? "السعر عند التواصل" : `${priceFormat.format(price)} ريال`;
}

const relative = new Intl.RelativeTimeFormat("ar-SA-u-nu-latn", { numeric: "auto" });

/** "قبل 3 أيام", "أمس", ... */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const seconds = Math.round((new Date(iso).getTime() - now.getTime()) / 1000);
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of steps) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  }
  return "الحين";
}
