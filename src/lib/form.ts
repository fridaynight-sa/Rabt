import type { z } from "zod";

/** What a server action returns to its form when something needs fixing. */
export type FormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string>;
  /** Typed values to put back in the form (never passwords). */
  values?: Record<string, string>;
};

export const initialFormState: FormState = { status: "idle" };

/** Form fields as plain strings, without any password fields. */
export function formValues(formData: FormData, keep: string[]): Record<string, string> {
  const values: Record<string, string> = {};
  for (const key of keep) {
    const value = formData.get(key);
    if (typeof value === "string") values[key] = value;
  }
  return values;
}

/** First error message for each field. */
export function firstFieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!(key in errors)) errors[key] = issue.message;
  }
  return errors;
}
