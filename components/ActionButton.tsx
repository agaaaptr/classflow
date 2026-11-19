"use client";

import { useTransition, useState } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/Toast";

const BASE =
  "inline-flex h-11 items-center justify-center rounded-card px-4 text-sm font-medium disabled:opacity-60";
const VARIANTS: Record<string, string> = {
  primary: "bg-navy text-white",
  secondary: "border border-cloud text-navy hover:bg-surface",
  danger: "border border-danger text-danger-ink hover:bg-danger/10",
  // Bayar/Setujui are primary actions; green #0AB848 can't hold white (2.6:1),
  // so the "success" variant renders as the brand primary (navy).
  success: "bg-navy text-white",
};

// Generic client wrapper for a server action. `action` is the imported server
// action reference (serializable); `args` are its serializable arguments.
export default function ActionButton({
  action,
  args = [],
  children,
  variant = "primary",
  className,
  confirmText,
  confirmTone = "default",
  successMessage,
}: {
  action: (...args: never[]) => Promise<{ ok: boolean; error: string | null }>;
  args?: unknown[];
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "success";
  className?: string;
  confirmText?: string;
  confirmTone?: "default" | "danger";
  successMessage?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function run() {
    setError(null);
    startTransition(async () => {
      const result = await action(...(args as never[]));
      if (result && !result.ok) setError(result.error);
      else if (result?.ok && successMessage) toast(successMessage);
    });
  }

  return (
    <span className="inline-flex flex-col">
      <button
        type="button"
        onClick={() => (confirmText ? setConfirmOpen(true) : run())}
        disabled={pending}
        aria-busy={pending}
        className={`${BASE} ${VARIANTS[variant]} ${className ?? ""}`}
      >
        {pending ? <span className="spinner" aria-hidden /> : children}
      </button>
      {error && (
        <span className="mt-1 text-xs text-danger-ink" role="alert">
          {error}
        </span>
      )}

      {confirmText && (
        <ConfirmDialog
          open={confirmOpen}
          title={confirmText}
          tone={confirmTone}
          onConfirm={() => {
            setConfirmOpen(false);
            run();
          }}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </span>
  );
}
