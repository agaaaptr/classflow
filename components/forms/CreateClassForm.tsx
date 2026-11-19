"use client";

import { useActionState, useState } from "react";
import { createClass, type ClassActionState } from "@/lib/actions/classes";
import Select from "@/components/ui/Select";

const initialState: ClassActionState = { ok: false, error: null };

const inputClass =
  "mt-1 h-11 w-full rounded-card border border-cloud px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy md:h-10 md:text-sm";

export default function CreateClassForm({
  tutors,
}: {
  tutors: { id: string; full_name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createClass, initialState);
  const [tutorId, setTutorId] = useState(tutors[0]?.id ?? "");

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-card border border-cloud bg-white p-5"
    >
      <h2 className="text-base font-semibold">Buat kelas baru</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Nama kelas
          </label>
          <input
            id="name"
            name="name"
            required
            className={inputClass}
            placeholder="Kelas Matematika SMP"
          />
        </div>

        <div>
          <span className="block text-sm font-medium">Tutor</span>
          <Select
            name="tutorId"
            ariaLabel="Tutor"
            value={tutorId}
            onChange={setTutorId}
            options={tutors.map((t) => ({ value: t.id, label: t.full_name }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="studentRate" className="block text-sm font-medium">
            Student rate (Rp/jam)
          </label>
          <input
            id="studentRate"
            name="studentRate"
            type="number"
            required
            min={1}
            className={inputClass}
            placeholder="100000"
          />
        </div>
        <div>
          <label htmlFor="tutorRate" className="block text-sm font-medium">
            Tutor rate (Rp/jam)
          </label>
          <input
            id="tutorRate"
            name="tutorRate"
            type="number"
            required
            min={1}
            className={inputClass}
            placeholder="75000"
          />
        </div>
        <div>
          <label htmlFor="capacity" className="block text-sm font-medium">
            Kapasitas
          </label>
          <input
            id="capacity"
            name="capacity"
            type="number"
            required
            min={1}
            className={inputClass}
            placeholder="2"
          />
        </div>
        <div>
          <label htmlFor="packageHours" className="block text-sm font-medium">
            Paket (jam)
          </label>
          <input
            id="packageHours"
            name="packageHours"
            type="number"
            required
            min={1}
            className={inputClass}
            placeholder="12"
          />
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-danger-ink" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !tutorId}
        aria-busy={pending}
        className="h-11 w-full rounded-card bg-navy px-4 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Menyimpan…" : "Simpan kelas"}
      </button>
    </form>
  );
}
