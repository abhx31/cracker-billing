import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FormFieldProps = ComponentProps<typeof Input> & {
  label: string;
  name: string;
  errors?: string[];
  hint?: string;
};

/** Label + input + validation message, wired up for accessibility. */
export function FormField({ label, name, errors, hint, className, id, ...props }: FormFieldProps) {
  const fieldId = id ?? name;
  const error = errors?.[0];
  return (
    // content-start: when a sibling field is taller (hint/error text), keep the
    // label and input pinned to the top instead of spreading out.
    <div className={cn("grid content-start gap-1.5", className)}>
      <Label htmlFor={fieldId}>{label}</Label>
      <Input
        id={fieldId}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        {...props}
      />
      {error ? (
        <p id={`${fieldId}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
