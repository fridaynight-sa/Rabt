"use server";

import { GENERIC_ERROR } from "@/features/auth/shared";
import { requireUser } from "@/features/auth/session";
import { firstFieldErrors, type FormState } from "@/lib/form";
import { createClient } from "@/lib/supabase/server";
import { reportSchema, reportText } from "./schemas";

export async function createReport(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = reportSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", fieldErrors: firstFieldErrors(parsed.error) };
  }
  const { targetType, targetId, reason, details } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    target_type: targetType,
    target_id: targetId,
    reason: reportText(reason, details),
  });
  if (error) {
    if (error.code === "23505") {
      return { status: "success", message: "بلّغت عن هذا من قبل، والإدارة بتراجعه." };
    }
    if (error.code === "23503") return { status: "error", message: "الصفحة غير موجودة." };
    console.error("report failed", error.code, error.message);
    return { status: "error", message: GENERIC_ERROR };
  }
  return { status: "success", message: "شكراً، وصل بلاغك للإدارة." };
}
