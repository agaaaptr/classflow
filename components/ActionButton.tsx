"use client";

import { useTransition, useState } from "react";

export default function ActionButton({
  action,
  children,
  className = "",
  confirmText,
}: {
  action: () => Promise<{ ok: boolean; error: string | null }>;
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
      const result = await action();
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <span className="inline-flex flex-col">
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className={className || "rounded-card bg-navy px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"}
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
