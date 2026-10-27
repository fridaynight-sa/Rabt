type Option = { value: string; label: string };

/** A set of checkboxes that submit as repeated form values (name=1&name=2). */
export function CheckboxGroup({
  name,
  legend,
  hint,
  options,
  defaultValues,
  error,
}: {
  name: string;
  legend: string;
  hint?: string;
  options: Option[];
  defaultValues: string[];
  error?: string;
}) {
  const selected = new Set(defaultValues);
  return (
    <fieldset className="space-y-2" aria-describedby={error ? `${name}-error` : undefined}>
      <legend className="text-sm font-medium text-slate-800">{legend}</legend>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            className="cursor-pointer rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50 has-[:checked]:text-brand-800 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-300"
          >
            <input
              type="checkbox"
              name={name}
              value={o.value}
              defaultChecked={selected.has(o.value)}
              className="sr-only"
            />
            {o.label}
          </label>
        ))}
      </div>
      {error && (
        <p id={`${name}-error`} className="text-sm text-red-700">
          {error}
        </p>
      )}
    </fieldset>
  );
}
