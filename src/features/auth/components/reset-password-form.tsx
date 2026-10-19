"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { TextField } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialFormState } from "@/lib/form";
import { updatePassword } from "../actions";
import { PASSWORD_HINT } from "./password-hint";

export function ResetPasswordForm() {
  const [state, action] = useActionState(updatePassword, initialFormState);

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.message && <Alert tone="error">{state.message}</Alert>}
      <TextField
        name="password"
        label="كلمة المرور الجديدة"
        type="password"
        autoComplete="new-password"
        dir="ltr"
        error={state.fieldErrors?.password}
        hint={PASSWORD_HINT}
      />
      <SubmitButton pendingText="جاري الحفظ...">حفظ كلمة المرور</SubmitButton>
    </form>
  );
}
