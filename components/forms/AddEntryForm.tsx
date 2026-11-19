"use client";

import { useTransition, useState } from "react";
import { addLogbookEntry } from "@/lib/actions/logbooks";
import Select from "@/components/ui/Select";

const inputClass =
  "mt-1 w-full rounded-card border border-cloud px-3 py-2 text-base focus:border-navy focus:outline-none md:text-sm";

export default function AddEntryForm({
  logbookId,
  lessons,
}: {
  logbookId: string;
  lessons: { id: string; label: string }[];
}) {
  const [lessonId, setLessonId] = useState(lessons[0]?.id ?? "");
  const [topic, setTopic] = useState("");
  const [activities, setActivities] = useState("");
  const [observation, setObservation] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addLogbookEntry({
        logbookId,
        lessonId,
        topic,
        activities,
        observation,
        recommendation,
      });
      if (!result.ok) {
        setError(result.error);
      } else {
        setTopic("");
        setActivities("");
        setObservation("");
        setRecommendation("");
      }
    });
  }

  if (lessons.length === 0) {
    return (
      <p className="text-sm text-muted">
        Semua lesson yang sudah berakhir bulan ini sudah punya entry.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <span className="block text-sm font-medium">Lesson</span>
        <Select
          ariaLabel="Lesson"
          value={lessonId}
          onChange={setLessonId}
          options={lessons.map((l) => ({ value: l.id, label: l.label }))}
        />
      </div>
      <div>
        <label htmlFor={`topic-${logbookId}`} className="block text-sm font-medium">
          Topik
        </label>
        <input
          id={`topic-${logbookId}`}
          required
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor={`activities-${logbookId}`} className="block text-sm font-medium">
          Aktivitas
        </label>
        <textarea
          id={`activities-${logbookId}`}
          required
          rows={2}
          value={activities}
          onChange={(e) => setActivities(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor={`observation-${logbookId}`} className="block text-sm font-medium">
          Observasi tutor
        </label>
        <textarea
          id={`observation-${logbookId}`}
          required
          rows={2}
          value={observation}
          onChange={(e) => setObservation(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor={`recommendation-${logbookId}`} className="block text-sm font-medium">
          Rekomendasi ke depan
        </label>
        <textarea
          id={`recommendation-${logbookId}`}
          required
          rows={2}
          value={recommendation}
          onChange={(e) => setRecommendation(e.target.value)}
          className={inputClass}
        />
      </div>

      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="h-11 rounded-card bg-navy px-4 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Menyimpan…" : "Simpan entry"}
      </button>
    </form>
  );
}
