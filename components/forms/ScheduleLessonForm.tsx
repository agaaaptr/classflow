"use client";

import { useTransition, useState } from "react";
import { scheduleLesson } from "@/lib/actions/lessons";
import { wibToIso } from "@/lib/utils";

export default function ScheduleLessonForm({ classId }: { classId: string }) {
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await scheduleLesson(
        classId,
        wibToIso(startDate, startTime),
        wibToIso(endDate, endTime),
      );
      if (!result.ok) {
        setError(result.error);
      } else {
        setStartDate("");
        setStartTime("");
        setEndDate("");
        setEndTime("");
      }
    });
  }

  const input =
    "mt-1 h-11 w-full rounded-card border border-cloud px-3 py-2 text-base focus:border-navy focus:outline-none md:h-10 md:text-sm";

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium">Tanggal mulai</label>
          <input
            id="startDate"
            type="date"
            required
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              if (!endDate) setEndDate(e.target.value);
            }}
            className={input}
          />
        </div>
        <div>
          <label htmlFor="startTime" className="block text-sm font-medium">Jam mulai (WIB)</label>
          <input id="startTime" type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} className={input} />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium">Tanggal selesai</label>
          <input id="endDate" type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} className={input} />
        </div>
        <div>
          <label htmlFor="endTime" className="block text-sm font-medium">Jam selesai (WIB)</label>
          <input id="endTime" type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} className={input} />
        </div>
      </div>

      {error && <p className="text-sm text-danger" role="alert">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-card bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Menyimpan…" : "Tambah lesson"}
      </button>
    </form>
  );
}
