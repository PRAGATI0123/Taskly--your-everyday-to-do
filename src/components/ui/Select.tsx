import { useId, type ComponentProps } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { Field, fieldControlClass, fieldIds, type FieldTextProps } from "./Field";

export interface SelectOption {
  value: string;
  label: string;
}

export type SelectProps = Omit<ComponentProps<"select">, "children"> &
  FieldTextProps & {
    options: SelectOption[];
    /** Optional first choice like "Choose…" or "Nobody". */
    placeholder?: string;
  };

/** A drop-down list with an optional label, hint and error. */
export function Select({
  label,
  hint,
  error,
  id,
  required,
  options,
  placeholder,
  className,
  ...rest
}: SelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const { describedBy } = fieldIds(selectId, { hint, error });

  return (
    <Field id={selectId} label={label} hint={hint} error={error} required={required}>
      <div className="relative">
        <select
          id={selectId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(fieldControlClass, "h-10 cursor-pointer appearance-none pr-9", className)}
          {...rest}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted"
        />
      </div>
    </Field>
  );
}
