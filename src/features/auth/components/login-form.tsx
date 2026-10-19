"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { TextField } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialFormState } from "@/lib/form";
import { signIn } from "../actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(signIn, initialFormState);
  const v = state.values ?? {};

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.message && <Alert tone="error">{state.message}</Alert>}
      <input type="hidden" name="next" value={v.next ?? next ?? ""} />
      <TextField
        name="identifier"
        label="الإيميل أو رقم الجوال"
        autoComplete="username"
        inputMode="email"
        dir="ltr"
        defaultValue={v.identifier}
        error={state.fieldErrors?.identifier}
      />
      <TextField
        name="password"
        label="كلمة المرور"
        type="password"
        autoComplete="current-password"
        dir="ltr"
        error={state.fieldErrors?.password}
      />
      <div className="text-sm">
        <Link href="/forgot-password" className="font-medium text-brand-700 hover:underline">
          نسيت كلمة المرور؟
        </Link>
      </div>
      <SubmitButton pendingText="جاري الدخول...">دخول</SubmitButton>
    </form>
  );
}
