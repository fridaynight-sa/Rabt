"use client";

import { useState } from "react";

const LABELS = ["سيء", "مقبول", "جيد", "جيد جداً", "ممتاز"];

/** Pick 1 to 5 stars. Real radio buttons, so it works with the keyboard and screen readers. */
export function StarInput({ name, defaultValue }: { name: string; defaultValue?: number }) {
  const [value, setValue] = useState(defaultValue ?? 0);
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <fieldset>
      <legend className="text-sm font-medium text-slate-800">عدد النجوم</legend>
      <div className="mt-1 flex items-center gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer" onMouseEnter={() => setHover(n)}>
            <input
              type="radio"
              name={name}
              value={n}
              checked={value === n}
              onChange={() => setValue(n)}
              className="peer sr-only"
            />
            <span
              aria-hidden="true"
              className={`block text-3xl leading-none transition peer-focus-visible:rounded peer-focus-visible:ring-2 peer-focus-visible:ring-brand-300 ${
                n <= shown ? "text-amber-500" : "text-slate-300"
              }`}
            >
              ★
            </span>
            <span className="sr-only">
              {n} من 5 ({LABELS[n - 1]})
            </span>
          </label>
        ))}
        <span className="ms-2 text-sm text-slate-600" aria-hidden="true">
          {shown ? LABELS[shown - 1] : ""}
        </span>
      </div>
    </fieldset>
  );
}
