"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { TextField } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialFormState } from "@/lib/form";
import { signUpMerchant } from "../actions";
import { PASSWORD_HINT } from "./password-hint";

export function MerchantSignupForm() {
  const [state, action] = useActionState(signUpMerchant, initialFormState);
  const v = state.values ?? {};
  const e = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.message && <Alert tone="error">{state.message}</Alert>}
      <TextField
        name="fullName"
        label="الاسم"
        autoComplete="name"
        defaultValue={v.fullName}
        error={e.fullName}
        hint="اسمك أو اسم مشروعك"
      />
      <TextField
        name="email"
        label="الإيميل"
        type="email"
        autoComplete="email"
        dir="ltr"
        defaultValue={v.email}
        error={e.email}
      />
      <TextField
        name="phone"
        label="رقم الجوال"
        type="tel"
        autoComplete="tel"
        dir="ltr"
        placeholder="05xxxxxxxx"
        optional
        defaultValue={v.phone}
        error={e.phone}
        hint="تقدر تسجل دخول فيه بدل الإيميل"
      />
      <TextField
        name="password"
        label="كلمة المرور"
        type="password"
        autoComplete="new-password"
        dir="ltr"
        error={e.password}
        hint={PASSWORD_HINT}
      />
      <SubmitButton pendingText="جاري إنشاء الحساب...">إنشاء الحساب</SubmitButton>
    </form>
  );
}
