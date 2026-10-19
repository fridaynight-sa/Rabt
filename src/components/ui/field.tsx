import type { ComponentProps, ReactNode } from "react";

const control =
  "block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-200 aria-[invalid=true]:border-red-500 aria-[invalid=true]:ring-red-100";

type FieldShell = {
  name: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
};

function Shell({
  name,
  label,
  error,
  hint,
  optional,
  children,
}: FieldShell & { children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-sm font-medium text-slate-800">
        {label}
        {optional && <span className="ms-1 font-normal text-slate-500">(اختياري)</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${name}-hint`} className="text-xs text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${name}-error`} className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

function describedBy(name: string, error?: string, hint?: string) {
  if (error) return `${name}-error`;
  if (hint) return `${name}-hint`;
  return undefined;
}

export function TextField({
  name,
  label,
  error,
  hint,
  optional,
  ...props
}: FieldShell & Omit<ComponentProps<"input">, "name">) {
  return (
    <Shell name={name} label={label} error={error} hint={hint} optional={optional}>
      <input
        id={name}
        name={name}
        className={control}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(name, error, hint)}
        required={!optional}
        {...props}
      />
    </Shell>
  );
}

export function TextAreaField({
  name,
  label,
  error,
  hint,
  optional,
  ...props
}: FieldShell & Omit<ComponentProps<"textarea">, "name">) {
  return (
    <Shell name={name} label={label} error={error} hint={hint} optional={optional}>
      <textarea
        id={name}
        name={name}
        rows={3}
        className={control}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(name, error, hint)}
        required={!optional}
        {...props}
      />
    </Shell>
  );
}

export function SelectField({
  name,
  label,
  error,
  hint,
  optional,
  options,
  placeholder,
  ...props
}: FieldShell &
  Omit<ComponentProps<"select">, "name"> & {
    options: { value: string; label: string }[];
    placeholder: string;
  }) {
  return (
    <Shell name={name} label={label} error={error} hint={hint} optional={optional}>
      <select
        id={name}
        name={name}
        className={control}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(name, error, hint)}
        required={!optional}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Shell>
  );
}
