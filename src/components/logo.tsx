import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-xl font-bold text-brand-800">
      <span
        aria-hidden="true"
        className="grid size-8 place-items-center rounded-lg bg-brand-700 text-base text-white"
      >
        ر
      </span>
      ربط
    </Link>
  );
}
