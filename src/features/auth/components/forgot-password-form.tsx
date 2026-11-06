"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { TextField } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { Turnstile } from "@/components/turnstile";
import { initialFormState } from "@/lib/form";
import { requestPasswordReset } from "../actions";

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordReset, initialFormState);

  if (state.status === "success") {
    return <Alert tone="success">{state.message}</Alert>;
  }

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.message && <Alert tone="error">{state.message}</Alert>}
      <TextField
        name="email"
        label="الإيميل"
        type="email"
        autoComplete="email"
        dir="ltr"
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
      />
      <Turnstile resetKey={state} />
      <SubmitButton pendingText="جاري الإرسال...">أرسل رابط التغيير</SubmitButton>
    </form>
  );
}
