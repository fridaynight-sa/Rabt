"use client";

import { useActionState } from "react";
import { initialFormState } from "@/lib/form";
import { saveReference } from "../actions";
import type { ReferenceKind } from "../schemas";

const input =
  "rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-200";

/** One row to rename an item, or an empty row to add one. */
export function ReferenceForm({
  kind,
  item,
}: {
  kind: ReferenceKind;
  item?: { id: number; slug: string; name_ar: string; sort_order: number };
}) {
  const [state, action] = useActionState(saveReference, initialFormState);
  const v = state.values ?? {};
  const e = state.fieldErrors ?? {};
  const error = state.status === "error" ? (state.message ?? Object.values(e)[0]) : null;

  return (
    <form action={action} className="flex flex-wrap items-start gap-2" noValidate>
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={item?.id ?? ""} />
      <label className="sr-only" htmlFor={`${kind}-${item?.id ?? "new"}-name`}>
        الاسم
      </label>
      <input
        id={`${kind}-${item?.id ?? "new"}-name`}
        name="nameAr"
        defaultValue={v.nameAr ?? item?.name_ar ?? ""}
        placeholder="الاسم بالعربي"
        className={`${input} w-40`}
        aria-invalid={e.nameAr ? true : undefined}
      />
      <label className="sr-only" htmlFor={`${kind}-${item?.id ?? "new"}-slug`}>
        الرابط
      </label>
      <input
        id={`${kind}-${item?.id ?? "new"}-slug`}
        name="slug"
        dir="ltr"
        defaultValue={v.slug ?? item?.slug ?? ""}
        placeholder="slug"
        className={`${input} w-36`}
        aria-invalid={e.slug ? true : undefined}
      />
      <label className="sr-only" htmlFor={`${kind}-${item?.id ?? "new"}-order`}>
        الترتيب
      </label>
      <input
        id={`${kind}-${item?.id ?? "new"}-order`}
        name="sortOrder"
        type="number"
        min={0}
        max={999}
        defaultValue={v.sortOrder ?? item?.sort_order ?? 0}
        className={`${input} w-20`}
        title="الترتيب"
      />
      <button
        type="submit"
        className="rounded-lg bg-brand-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-800"
      >
        {item ? "حفظ" : "إضافة"}
      </button>
      {state.status === "success" && (
        <span className="self-center text-xs text-brand-700">{state.message}</span>
      )}
      {error && <span className="w-full text-xs text-red-700">{error}</span>}
    </form>
  );
}
