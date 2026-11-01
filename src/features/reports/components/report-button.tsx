"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useActionState, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialFormState } from "@/lib/form";
import { createReport } from "../actions";
import { REPORT_REASONS } from "../schemas";

/** "Report" link that opens a short form. Signed-out visitors are asked to log in. */
export function ReportButton({
  targetType,
  targetId,
  signedIn,
  compact = false,
}: {
  targetType: "provider" | "listing" | "review";
  targetId: string;
  signedIn: boolean;
  compact?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(createReport, initialFormState);
  const label = compact ? "إبلاغ" : "إبلاغ عن مشكلة";
  const trigger =
    "text-xs font-medium text-slate-500 underline-offset-2 hover:text-red-700 hover:underline";

  if (!signedIn) {
    return (
      <Link href={`/login?next=${encodeURIComponent(pathname)}`} className={trigger}>
        {label}
      </Link>
    );
  }
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={trigger}>
        {label}
      </button>
    );
  }
  if (state.status === "success") return <Alert tone="success">{state.message}</Alert>;

  const e = state.fieldErrors ?? {};
  return (
    <form
      action={action}
      className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
      noValidate
    >
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="targetId" value={targetId} />
      {state.status === "error" && state.message && <Alert tone="error">{state.message}</Alert>}
      <fieldset>
        <legend className="text-sm font-medium text-slate-800">وش المشكلة؟</legend>
        <div className="mt-2 space-y-1.5">
          {Object.entries(REPORT_REASONS).map(([key, text]) => (
            <label key={key} className="flex items-center gap-2 text-sm text-slate-700">
              <input type="radio" name="reason" value={key} className="accent-brand-700" />
              {text}
            </label>
          ))}
        </div>
        {e.reason && <p className="mt-1 text-sm text-red-700">{e.reason}</p>}
      </fieldset>
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-800">تفاصيل (اختياري، إلا مع «سبب آخر»)</span>
        <textarea
          name="details"
          rows={2}
          maxLength={400}
          className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        />
        {e.details && <span className="text-sm text-red-700">{e.details}</span>}
      </label>
      <div className="flex items-center gap-3">
        <div className="w-36">
          <SubmitButton pendingText="جاري الإرسال...">إرسال البلاغ</SubmitButton>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-slate-600 hover:underline"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}
