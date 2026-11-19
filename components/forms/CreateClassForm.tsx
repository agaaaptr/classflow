"use client";

import { useState, useTransition } from "react";
import { createClass } from "@/lib/actions/classes";
import Select from "@/components/ui/Select";

const inputClass =
  "mt-1 h-11 w-full rounded-card border border-cloud px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy md:h-10 md:text-sm";

export default function CreateClassForm({
  tutors,
}: {
  tutors: { id: string; full_name: string }[];
}) {
  const [name, setName] = useState("");
  const [tutorId, setTutorId] = useState(tutors[0]?.id ?? "");
  const [studentRate, setStudentRate] = useState("");
  const [tutorRate, setTutorRate] = useState("");
  const [capacity, setCapacity] = useState("");
  const [packageHours, setPackageHours] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createClass({
        name,
        tutorId,
        studentRate: Number(studentRate),
        tutorRate: Number(tutorRate),
        capacity: Number(capacity),
        packageHours: Number(packageHours),
      });
      if (result && !result.ok) setError(result.error);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-card border border-cloud bg-white p-5">
      <h2 className="text-base font-semibold">Buat kelas baru</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Nama kelas
          </label>
          <input
            id="name"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            className={inputClass}
            placeholder="Kelas Matematika SMP"
          />
        </div>

        <div>
          <span className="block text-sm font-medium">Tutor</span>
          <Select
            ariaLabel="Tutor"
            value={tutorId}
            onChange={(v) => {
              setTutorId(v);
              setError(null);
            }}
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
            type="number"
            required
            min={1}
            value={studentRate}
            onChange={(e) => {
              setStudentRate(e.target.value);
              setError(null);
            }}
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
            type="number"
            required
            min={1}
            value={tutorRate}
            onChange={(e) => {
              setTutorRate(e.target.value);
              setError(null);
            }}
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
            type="number"
            required
            min={1}
            value={capacity}
            onChange={(e) => {
              setCapacity(e.target.value);
              setError(null);
            }}
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
            type="number"
            required
            min={1}
            value={packageHours}
            onChange={(e) => {
              setPackageHours(e.target.value);
              setError(null);
            }}
            className={inputClass}
            placeholder="12"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-danger-ink" role="alert">
          {error}
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
