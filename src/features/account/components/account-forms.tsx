"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { TextField } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { PASSWORD_HINT } from "@/features/auth/components/password-hint";
import { initialFormState, type FormState } from "@/lib/form";
import { changeEmail, changePassword, updateMerchantDetails } from "../actions";

function Messages({ state }: { state: FormState }) {
  if (state.status === "success") return <Alert tone="success">{state.message}</Alert>;
  if (state.status === "error" && state.message) return <Alert tone="error">{state.message}</Alert>;
  return null;
}

/** Shows the Saudi number the way people write it locally. */
function localPhone(e164: string | null): string {
  if (!e164) return "";
  return e164.startsWith("+966") ? `0${e164.slice(4)}` : e164;
}

export function MerchantDetailsForm({
  fullName,
  phone,
}: {
  fullName: string;
  phone: string | null;
}) {
  const [state, action] = useActionState(updateMerchantDetails, initialFormState);
  const v = state.values ?? {};
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <Messages state={state} />
      <TextField
        name="fullName"
        label="الاسم"
        autoComplete="name"
        defaultValue={v.fullName ?? fullName}
        error={e.fullName}
      />
      <TextField
        name="phone"
        label="رقم الجوال"
        type="tel"
        dir="ltr"
        placeholder="05xxxxxxxx"
        optional
        defaultValue={v.phone ?? localPhone(phone)}
        error={e.phone}
        hint="تقدر تسجل دخول فيه بدل الإيميل"
      />
      <div className="sm:w-56">
        <SubmitButton pendingText="جاري الحفظ...">حفظ</SubmitButton>
      </div>
    </form>
  );
}

export function ChangeEmailForm({ currentEmail }: { currentEmail: string | null }) {
  const [state, action] = useActionState(changeEmail, initialFormState);
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <p className="text-sm text-slate-600">
        إيميلك الحالي:{" "}
        <span dir="ltr" className="font-medium text-slate-800">
          {currentEmail}
        </span>
      </p>
      <Messages state={state} />
      <TextField
        name="newEmail"
        label="الإيميل الجديد"
        type="email"
        autoComplete="email"
        dir="ltr"
        defaultValue={state.status === "success" ? "" : state.values?.newEmail}
        error={e.newEmail}
      />
      <TextField
        name="currentPassword"
        label="كلمة المرور الحالية"
        type="password"
        autoComplete="current-password"
        dir="ltr"
        error={e.currentPassword}
      />
      <div className="sm:w-56">
        <SubmitButton pendingText="جاري الإرسال...">تغيير الإيميل</SubmitButton>
      </div>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, action] = useActionState(changePassword, initialFormState);
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <Messages state={state} />
      <TextField
        name="currentPassword"
        label="كلمة المرور الحالية"
        type="password"
        autoComplete="current-password"
        dir="ltr"
        error={e.currentPassword}
      />
      <TextField
        name="newPassword"
        label="كلمة المرور الجديدة"
        type="password"
        autoComplete="new-password"
        dir="ltr"
        error={e.newPassword}
        hint={PASSWORD_HINT}
      />
      <div className="sm:w-56">
        <SubmitButton pendingText="جاري الحفظ...">تغيير كلمة المرور</SubmitButton>
      </div>
    </form>
  );
}
