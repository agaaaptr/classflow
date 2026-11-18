"use client";

import { useActionState } from "react";
import { createClass, type ClassActionState } from "@/lib/actions/classes";

const initialState: ClassActionState = { ok: false, error: null };

export default function CreateClassForm({ tutors }: { tutors: { id: string; full_name: string }[] }) {
  const [state, formAction, pending] = useActionState(createClass, initialState);

  const inputClass =
    "mt-1 w-full rounded-card border border-cloud px-3 py-2 text-sm focus:border-navy focus:outline-none";

  return (
    <form action={formAction} className="space-y-4 rounded-card border border-cloud bg-white p-5">
      <h2 className="text-base font-semibold">Buat kelas baru</h2>

      <div>
        <label htmlFor="name" className="block text-sm font-medium">Nama kelas</label>
        <input id="name" name="name" required className={inputClass} placeholder="Kelas Matematika SMP" />
      </div>

      <div>
        <label htmlFor="tutorId" className="block text-sm font-medium">Tutor</label>
        <select id="tutorId" name="tutorId" required className={inputClass}>
          {tutors.map((t) => (
            <option key={t.id} value={t.id}>{t.full_name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="studentRate" className="block text-sm font-medium">Student rate (Rp/jam)</label>
          <input id="studentRate" name="studentRate" type="number" required min={1} className={inputClass} placeholder="100000" />
        </div>
        <div>
          <label htmlFor="tutorRate" className="block text-sm font-medium">Tutor rate (Rp/jam)</label>
          <input id="tutorRate" name="tutorRate" type="number" required min={1} className={inputClass} placeholder="75000" />
        </div>
        <div>
          <label htmlFor="capacity" className="block text-sm font-medium">Kapasitas</label>
          <input id="capacity" name="capacity" type="number" required min={1} className={inputClass} placeholder="2" />
        </div>
        <div>
          <label htmlFor="packageHours" className="block text-sm font-medium">Paket (jam)</label>
          <input id="packageHours" name="packageHours" type="number" required min={1} className={inputClass} placeholder="12" />
        </div>
      </div>

      {state.error && <p className="text-sm text-danger" role="alert">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-card bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Menyimpan…" : "Simpan kelas"}
      </button>
    </form>
  );
}
