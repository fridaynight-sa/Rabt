"use client";

import { useActionState, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { PASSWORD_HINT } from "@/features/auth/components/password-hint";
import { initialFormState } from "@/lib/form";
import { createAccount } from "../actions";

export function CreateAccountForm({ cities }: { cities: { id: number; name_ar: string }[] }) {
  const [state, action] = useActionState(createAccount, initialFormState);
  const v = state.values ?? {};
  const e = state.fieldErrors ?? {};
  const [type, setType] = useState<"merchant" | "provider">(
    v.accountType === "provider" ? "provider" : "merchant",
  );

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.status === "error" && state.message && <Alert tone="error">{state.message}</Alert>}

      <fieldset>
        <legend className="text-sm font-medium text-slate-800">نوع الحساب</legend>
        <div className="mt-2 flex gap-2">
          {[
            { value: "merchant", label: "تاجر" },
            { value: "provider", label: "مورد أو مزود خدمة" },
          ].map((o) => (
            <label
              key={o.value}
              className="cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50 has-[:checked]:font-semibold has-[:checked]:text-brand-800"
            >
              <input
                type="radio"
                name="accountType"
                value={o.value}
                checked={type === o.value}
                onChange={() => setType(o.value as "merchant" | "provider")}
                className="sr-only"
              />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>

      <TextField name="fullName" label="الاسم" defaultValue={v.fullName} error={e.fullName} />
      <TextField
        name="email"
        label="الإيميل"
        type="email"
        dir="ltr"
        defaultValue={v.email}
        error={e.email}
        hint="الحساب يكون مؤكد مباشرة، بدون رسالة تأكيد"
      />

      {type === "merchant" ? (
        <TextField
          name="phone"
          label="رقم الجوال"
          type="tel"
          dir="ltr"
          optional
          defaultValue={v.phone}
          error={e.phone}
        />
      ) : (
        <>
          <SelectField
            name="cityId"
            label="المدينة"
            placeholder="اختر المدينة"
            options={cities.map((c) => ({ value: String(c.id), label: c.name_ar }))}
            defaultValue={v.cityId ?? ""}
            error={e.cityId}
          />
          <TextField
            name="whatsapp"
            label="رقم الواتساب"
            type="tel"
            dir="ltr"
            defaultValue={v.whatsapp}
            error={e.whatsapp}
          />
          <TextAreaField
            name="services"
            label="الخدمات أو المنتجات"
            maxLength={1000}
            defaultValue={v.services}
            error={e.services}
          />
        </>
      )}

      <TextField
        name="password"
        label="كلمة مرور مؤقتة"
        type="text"
        dir="ltr"
        autoComplete="off"
        error={e.password}
        hint={`${PASSWORD_HINT}. أرسلها لصاحب الحساب، ويقدر يغيرها من إعدادات الحساب.`}
      />
      <div className="sm:w-56">
        <SubmitButton pendingText="جاري الإنشاء...">إنشاء الحساب</SubmitButton>
      </div>
    </form>
  );
}
