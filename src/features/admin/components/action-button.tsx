"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ActionResult } from "@/lib/form";

const tones = {
  default: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
  primary: "bg-brand-700 text-white hover:bg-brand-800",
  danger: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
};

/** A button that runs one admin action, asks first when it matters, and refreshes the page. */
export function ActionButton({
  action,
  label,
  confirmText,
  tone = "default",
}: {
  action: () => Promise<ActionResult>;
  label: string;
  confirmText?: string;
  tone?: keyof typeof tones;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="inline-flex flex-col items-start">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirmText && !confirm(confirmText)) return;
          start(async () => {
            const result = await action();
            setError(result.ok ? null : result.message);
            router.refresh();
          });
        }}
        className={`rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-60 ${tones[tone]}`}
      >
        {pending ? "..." : label}
      </button>
      {error && <span className="mt-1 text-xs text-red-700">{error}</span>}
    </span>
  );
}
