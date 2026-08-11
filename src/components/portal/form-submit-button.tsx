"use client";

import { useFormStatus } from "react-dom";

type FormSubmitButtonProps = {
  disabled?: boolean;
  label: string;
  pendingLabel: string;
};

export function FormSubmitButton({
  disabled = false,
  label,
  pendingLabel,
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="inline-flex h-11 items-center justify-center rounded-md bg-brand-red px-5 text-sm font-bold text-white transition hover:bg-[#a90d27] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
