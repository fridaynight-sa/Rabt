import type { ReactNode } from "react";

const tones = {
  error: "border-red-200 bg-red-50 text-red-800",
  success: "border-brand-200 bg-brand-50 text-brand-900",
  info: "border-slate-200 bg-white text-slate-700",
};

export function Alert({
  tone = "info",
  children,
}: {
  tone?: keyof typeof tones;
  children: ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-lg border px-4 py-3 text-sm ${tones[tone]}`}
    >
      {children}
    </div>
  );
}
