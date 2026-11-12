import { useId, type ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { Field, fieldControlClass, fieldIds, type FieldTextProps } from "./Field";

export type TextareaProps = ComponentProps<"textarea"> & FieldTextProps;

/** A multi-line typing box with an optional label, hint and error. */
export function Textarea({
  label,
  hint,
  error,
  id,
  required,
  rows = 4,
  className,
  ...rest
}: TextareaProps) {
  const autoId = useId();
  const textareaId = id ?? autoId;
  const { describedBy } = fieldIds(textareaId, { hint, error });

  return (
    <Field id={textareaId} label={label} hint={hint} error={error} required={required}>
      <textarea
        id={textareaId}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(fieldControlClass, "resize-y py-2 leading-relaxed", className)}
        {...rest}
      />
    </Field>
  );
}
