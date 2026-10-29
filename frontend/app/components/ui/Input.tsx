
"use client";

import type { InputHTMLAttributes } from "react";
import { useId } from "react";

type InputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size"
> & {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
};

export default function Input({
  label,
  error,
  helperText,
  id,
  className = "",
  containerClassName = "",
  required,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;

  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-semibold text-slate-700"
        >
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      <input
        id={inputId}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error || helperText ? messageId : undefined}
        className={[
          "w-full rounded-xl border bg-white px-3.5 py-3 text-sm text-slate-900",
          "outline-none transition placeholder:text-slate-400",
          "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400",
          error
            ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
            : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />

      {(error || helperText) && (
        <p
          id={messageId}
          className={`mt-1.5 text-xs ${
            error ? "text-red-600" : "text-slate-500"
          }`}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
}
