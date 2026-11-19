"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-lg font-semibold">Terjadi kesalahan.</p>
      <p className="max-w-sm text-sm text-muted">
        Halaman gagal dimuat. Coba muat ulang; kalau masih gagal, periksa apakah
        Supabase lokal sedang berjalan.
      </p>
      <button
        onClick={reset}
        className="rounded-card bg-navy px-4 py-2 text-sm font-semibold text-white"
      >
        Coba lagi
      </button>
    </div>
  );
}
