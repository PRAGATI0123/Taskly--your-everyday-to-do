import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Field, fieldControlClass, fieldIds, type FieldTextProps } from "./Field";

export type InputProps = ComponentProps<"input"> &
  FieldTextProps & {
    /** Something shown inside the box on the right, e.g. a "show password" button. */
    trailing?: ReactNode;
    /** A small icon inside the box on the left, e.g. a magnifying glass. */
    leading?: ReactNode;
  };

/** A one-line typing box with an optional label, hint and error. */
export function Input({
  label,
  hint,
  error,
  id,
  required,
  trailing,
  leading,
  className,
  ...rest
}: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const { describedBy } = fieldIds(inputId, { hint, error });

  return (
    <Field id={inputId} label={label} hint={hint} error={error} required={required}>
      <div className="relative">
        {leading && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted [&>svg]:size-4"
          >
            {leading}
          </span>
        )}
        <input
          id={inputId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            fieldControlClass,
            "h-10",
            trailing ? "pr-11" : undefined,
            leading ? "pl-9" : undefined,
            className,
          )}
          {...rest}
        />
        {trailing && (
          <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>
        )}
      </div>
    </Field>
  );
}
