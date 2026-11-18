"use client";

import { useTransition, useState } from "react";

// Generic client wrapper for a server action. `action` is the imported server
// action reference (serializable); `args` are its serializable arguments.
// Never pass a closure from a Server Component into this component.
export default function ActionButton({
  action,
  args = [],
  children,
  className = "",
  confirmText,
}: {
  action: (...args: never[]) => Promise<{ ok: boolean; error: string | null }>;
  args?: unknown[];
  children: React.ReactNode;
  className?: string;
  confirmText?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run() {
    if (confirmText && !window.confirm(confirmText)) return;
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
        onClick={run}
        disabled={pending}
        className={
          className || "rounded-card bg-navy px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
        }
      >
        {pending ? "…" : children}
      </button>
      {error && (
        <span className="mt-1 text-xs text-danger" role="alert">
          {error}
        </span>
      )}
    </span>
  );
}
