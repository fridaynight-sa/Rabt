"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { TextAreaField } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialFormState, type FormState } from "@/lib/form";
import { deleteReview } from "../actions";
import { StarInput } from "./star-input";

export function ReviewForm({
  save,
  existing,
}: {
  save: (prev: FormState, formData: FormData) => Promise<FormState>;
  existing: { id: string; rating: number; comment: string | null } | null;
}) {
  const router = useRouter();
  const [state, action] = useActionState(save, initialFormState);
  const [deleting, startDelete] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const v = state.values ?? {};
  const e = state.fieldErrors ?? {};
  const rating = v.rating ? Number(v.rating) : existing?.rating;

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.status === "success" && <Alert tone="success">{state.message}</Alert>}
      {state.status === "error" && state.message && <Alert tone="error">{state.message}</Alert>}
      <div>
        <StarInput key={rating} name="rating" defaultValue={rating} />
        {e.rating && <p className="mt-1 text-sm text-red-700">{e.rating}</p>}
      </div>
      <TextAreaField
        name="comment"
        label="تعليقك"
        optional
        rows={3}
        maxLength={1000}
        defaultValue={v.comment ?? existing?.comment ?? ""}
        error={e.comment}
        hint="كيف كان التعامل، الجودة، الالتزام بالمواعيد"
      />
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-48">
          <SubmitButton pendingText="جاري الحفظ...">
            {existing ? "تحديث التقييم" : "إرسال التقييم"}
          </SubmitButton>
        </div>
        {existing && (
          <button
            type="button"
            disabled={deleting}
            onClick={() => {
              if (!confirm("تبي تحذف تقييمك؟")) return;
              startDelete(async () => {
                const r = await deleteReview(existing.id);
                if (!r.ok) setDeleteError(r.message);
                router.refresh();
              });
            }}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
          >
            حذف تقييمي
          </button>
        )}
      </div>
      {deleteError && <p className="text-sm text-red-700">{deleteError}</p>}
    </form>
  );
}
