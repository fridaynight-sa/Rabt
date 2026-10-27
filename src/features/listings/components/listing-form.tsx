"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialFormState, type FormState } from "@/lib/form";

type Ref = { id: number; name_ar: string };

export type ListingFormDefaults = {
  title: string;
  description: string;
  price: number | null;
  cityId: number;
  categoryId: number | null;
  contactMethod: "whatsapp" | "call";
};

const toOptions = (items: Ref[]) => items.map((i) => ({ value: String(i.id), label: i.name_ar }));

export function ListingForm({
  action: submit,
  defaults,
  cities,
  categories,
  submitLabel,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  defaults: ListingFormDefaults;
  cities: Ref[];
  categories: Ref[];
  submitLabel: string;
}) {
  const [state, action] = useActionState(submit, initialFormState);
  const v = state.values ?? {};
  const e = state.fieldErrors ?? {};
  const contact = v.contactMethod ?? defaults.contactMethod;

  return (
    <form action={action} className="space-y-5" noValidate>
      {state.status === "success" && <Alert tone="success">{state.message}</Alert>}
      {state.status === "error" && state.message && <Alert tone="error">{state.message}</Alert>}

      <TextField
        name="title"
        label="عنوان الإعلان"
        maxLength={120}
        defaultValue={v.title ?? defaults.title}
        error={e.title}
        hint="مثال: مكينة إسبريسو مستعملة بحالة ممتازة"
      />
      <TextAreaField
        name="description"
        label="الوصف"
        rows={6}
        maxLength={3000}
        defaultValue={v.description ?? defaults.description}
        error={e.description}
        hint="التفاصيل، الحالة، الكمية، مدة التوريد..."
      />
      <TextField
        name="price"
        label="السعر بالريال"
        inputMode="decimal"
        dir="ltr"
        optional
        defaultValue={v.price ?? (defaults.price === null ? "" : String(defaults.price))}
        error={e.price}
        hint="اتركه فاضي إذا السعر حسب الطلب"
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          name="cityId"
          label="المدينة"
          placeholder="اختر المدينة"
          options={toOptions(cities)}
          defaultValue={v.cityId ?? String(defaults.cityId)}
          error={e.cityId}
        />
        <SelectField
          name="categoryId"
          label="الفئة"
          placeholder="اختر الفئة"
          options={toOptions(categories)}
          defaultValue={v.categoryId ?? (defaults.categoryId ? String(defaults.categoryId) : "")}
          error={e.categoryId}
        />
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-slate-800">طريقة التواصل</legend>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "whatsapp", label: "واتساب" },
            { value: "call", label: "اتصال" },
          ].map((o) => (
            <label
              key={o.value}
              className="cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50 has-[:checked]:font-semibold has-[:checked]:text-brand-800 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-300"
            >
              <input
                type="radio"
                name="contactMethod"
                value={o.value}
                defaultChecked={contact === o.value}
                className="sr-only"
              />
              {o.label}
            </label>
          ))}
        </div>
        <p className="text-xs text-slate-500">على رقم الواتساب المسجل في صفحتك.</p>
        {e.contactMethod && <p className="text-sm text-red-700">{e.contactMethod}</p>}
      </fieldset>
      <div className="sm:w-56">
        <SubmitButton pendingText="جاري الحفظ...">{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
