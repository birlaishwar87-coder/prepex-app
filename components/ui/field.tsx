"use client";

import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils/cn";

// --- Input ---
interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string;
  id?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, id, hint, error, className, containerClassName, ...rest },
  ref
) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <div className={cn("field", containerClassName)}>
      <input
        ref={ref}
        id={inputId}
        placeholder=" "
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${inputId}-hint` : undefined}
        className={className}
        {...rest}
      />
      <label htmlFor={inputId}>{label}</label>
      {(hint || error) && (
        <div
          id={`${inputId}-hint`}
          className="mt-1.5 text-xs"
          style={{ color: error ? "var(--error)" : "var(--text-tertiary)" }}
        >
          {error ?? hint}
        </div>
      )}
    </div>
  );
});

// --- Textarea (separate component for clarity) ---
interface FieldTextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> {
  label: string;
  id?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
}

export const FieldTextarea = forwardRef<HTMLTextAreaElement, FieldTextareaProps>(
  function FieldTextarea({ label, id, hint, error, className, containerClassName, ...rest }, ref) {
    const auto = useId();
    const inputId = id ?? auto;
    return (
      <div className={cn("field", containerClassName)}>
        <textarea
          ref={ref}
          id={inputId}
          placeholder=" "
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? `${inputId}-hint` : undefined}
          className={className}
          {...rest}
        />
        <label htmlFor={inputId}>{label}</label>
        {(hint || error) && (
          <div
            id={`${inputId}-hint`}
            className="mt-1.5 text-xs"
            style={{ color: error ? "var(--error)" : "var(--text-tertiary)" }}
          >
            {error ?? hint}
          </div>
        )}
      </div>
    );
  }
);
