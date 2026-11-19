"use client";

import { useEffect, useId, useRef } from "react";

// Confirmation dialog built on native <dialog> (top layer, Escape, focus
// restore, and page inertness come free). Explicit buttons only — no backdrop
// click-through, so a destructive action can't be dismissed by accident.
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Ya",
  cancelLabel = "Batal",
  tone = "default",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onCancel}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      className="m-auto w-[min(92vw,26rem)] rounded-card border border-cloud bg-white p-0 text-navy backdrop:bg-navy/40"
    >
      <div className="p-5">
        <h2 id={titleId} className="text-base font-semibold">
          {title}
        </h2>
        {description && (
          <p id={descId} className="mt-2 text-sm text-muted">
            {description}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            autoFocus
            onClick={onCancel}
            className="h-10 rounded-card border border-cloud px-4 text-sm font-medium text-navy hover:bg-surface"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`h-10 rounded-card px-4 text-sm font-semibold text-white ${
              tone === "danger" ? "bg-danger-ink hover:bg-danger-ink/90" : "bg-navy hover:bg-navy/90"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
