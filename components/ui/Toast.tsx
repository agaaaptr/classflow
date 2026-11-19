"use client";

import { useEffect, useState } from "react";

type ToastMsg = { id: number; message: string };
let listeners: ((m: ToastMsg) => void)[] = [];
let counter = 0;

export function toast(message: string) {
  const id = ++counter;
  listeners.forEach((l) => l({ id, message }));
}

export default function ToastHost() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  useEffect(() => {
    const l = (m: ToastMsg) => {
      setToasts((t) => [...t, m]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== m.id)), 3000);
    };
    listeners.push(l);
    return () => {
      listeners = listeners.filter((x) => x !== l);
    };
  }, []);

  return (
    <div aria-live="polite" className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="rounded-card border border-cloud bg-navy px-4 py-2 text-sm text-white shadow-lg"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
