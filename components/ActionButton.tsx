"use client";

import { useTransition, useState } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

// Generic client wrapper for a server action. `action` is the imported server
// action reference (serializable); `args` are its serializable arguments.
export default function ActionButton({
  action,
  args = [],
  children,
  className = "",
  confirmText,
  confirmTone = "default",
}: {
  action: (...args: never[]) => Promise<{ ok: boolean; error: string | null }>;
  args?: unknown[];
  children: React.ReactNode;
  className?: string;
  confirmText?: string;
  confirmTone?: "default" | "danger";
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function run() {
    setError(null);
    startTransition(async () => {
      const result = await action(...(args as never[]));
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <span className="inline-flex flex-col">
      <button
        type="button"
        onClick={() => (confirmText ? setConfirmOpen(true) : run())}
        disabled={pending}
        aria-busy={pending}
        className={
          className ||
          "rounded-card bg-navy px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
        }
      >
        {pending ? <span className="spinner" aria-hidden /> : children}
      </button>
      {error && (
        <span className="mt-1 text-xs text-danger" role="alert">
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
