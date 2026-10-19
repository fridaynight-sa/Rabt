import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "حساب جديد" };

const choices = [
  {
    href: "/signup/merchant",
    title: "تاجر",
    body: "عندك مطعم أو كوفي أو متجر إلكتروني، وتدوّر على موردين ومزودي خدمات.",
  },
  {
    href: "/signup/provider",
    title: "مورد أو مزود خدمة",
    body: "تبيع منتجات أو تقدم خدمات للمشاريع، وتبي توصل لهم.",
  },
];

export default function SignupChoicePage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-16">
      <h1 className="text-2xl font-bold text-slate-900">وش نوع حسابك؟</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {choices.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand-400 hover:shadow"
          >
            <h2 className="text-lg font-semibold text-slate-900">{c.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{c.body}</p>
          </Link>
        ))}
      </div>
      <p className="mt-6 text-sm text-slate-600">
        عندك حساب؟{" "}
        <Link href="/login" className="font-semibold text-brand-700 hover:underline">
          سجّل دخول
        </Link>
      </p>
    </div>
  );
}
