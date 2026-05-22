"use client";

import { useFormStatus } from "react-dom";

type FormSubmitButtonProps = {
  idleLabel?: string;
  pendingLabel?: string;
  className?: string;
};

export function FormSubmitButton({
  idleLabel = "登録する",
  pendingLabel = "登録中...",
  className = "min-h-12 rounded-2xl bg-leaf px-4 py-3 text-base font-black text-white shadow-sm transition active:scale-[0.98] disabled:bg-ink/20"
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button className={className} type="submit" disabled={pending} aria-busy={pending}>
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
