"use client";

import { useId } from "react";
import { Check } from "lucide-react";
import { LABEL_COLORS } from "@/lib/projects";

/**
 * A row of colour dots. Under the hood they are real radio buttons, so the
 * keyboard works for free (Tab to the group, arrow keys to pick).
 */
export function ColorPicker({
  value,
  onChange,
  label = "Colour",
}: {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}) {
  const name = useId();
  return (
    <fieldset>
      <legend className="sr-only">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {LABEL_COLORS.map((color) => (
          <label key={color.value} title={color.name} className="relative cursor-pointer">
            <input
              type="radio"
              name={name}
              value={color.value}
              checked={value === color.value}
              onChange={() => onChange(color.value)}
              className="peer sr-only"
            />
            <span className="sr-only">{color.name}</span>
            <span
              aria-hidden="true"
              style={{ backgroundColor: color.value }}
              className="flex size-7 items-center justify-center rounded-full text-white ring-offset-2 ring-offset-surface transition-transform peer-checked:ring-2 peer-checked:ring-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-primary hover:scale-110"
            >
              {value === color.value && <Check className="size-3.5" />}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
