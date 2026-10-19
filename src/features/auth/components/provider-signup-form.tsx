"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialFormState } from "@/lib/form";
import { signUpProvider } from "../actions";
import { PASSWORD_HINT } from "./password-hint";

export function ProviderSignupForm({ cities }: { cities: { id: number; name_ar: string }[] }) {
  const [state, action] = useActionState(signUpProvider, initialFormState);
  const v = state.values ?? {};
  const e = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.message && <Alert tone="error">{state.message}</Alert>}
      <TextField
        name="fullName"
        label="الاسم"
        autoComplete="organization"
        defaultValue={v.fullName}
        error={e.fullName}
        hint="اسم نشاطك كما يظهر للتجار"
      />
      <SelectField
        name="cityId"
        label="المدينة"
        placeholder="اختر المدينة"
        options={cities.map((c) => ({ value: String(c.id), label: c.name_ar }))}
        defaultValue={v.cityId ?? ""}
        error={e.cityId}
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
        name="whatsapp"
        label="رقم الواتساب"
        type="tel"
        autoComplete="tel"
        dir="ltr"
        placeholder="05xxxxxxxx"
        defaultValue={v.whatsapp}
        error={e.whatsapp}
        hint="التجار يتواصلون معك عليه مباشرة"
      />
      <TextAreaField
        name="services"
        label="الخدمات أو المنتجات اللي تقدمها"
        maxLength={1000}
        defaultValue={v.services}
        error={e.services}
        hint="مثال: معدات قهوة، صيانة مكائن إسبريسو، توريد حبوب"
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
