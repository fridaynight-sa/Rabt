import type { ReactNode } from "react";

/** Plain readable layout for the terms and privacy pages. */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
      <p className="mt-2 text-sm text-slate-500">آخر تحديث: {updated}</p>
      <div className="mt-8 space-y-6 leading-8 text-slate-700 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-slate-900 [&_li]:ms-5 [&_ul]:list-disc [&_ul]:space-y-1">
        {children}
        {contact && (
          <>
            <h2>التواصل</h2>
            <p>
              لأي سؤال أو طلب، راسلنا على{" "}
              <a href={`mailto:${contact}`} dir="ltr" className="text-brand-700 underline">
                {contact}
              </a>
              .
            </p>
          </>
        )}
      </div>
    </article>
  );
}
