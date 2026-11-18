import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Badge from "@/components/Badge";
import ActionButton from "@/components/ActionButton";
import ScheduleLessonForm from "@/components/forms/ScheduleLessonForm";
import AddEntryForm from "@/components/forms/AddEntryForm";
import { ensureLogbook, submitLogbook } from "@/lib/actions/logbooks";
import {
  formatDateTimeWIB,
  formatMinutes,
  periodOf,
  currentPeriod,
} from "@/lib/utils";

export default async function TutorClassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: cls } = await supabase
    .from("classes")
    .select("id, name, capacity, package_minutes")
    .eq("id", id)
    .single();
  if (!cls) notFound();

  const [lessonsR, logbooksR] = await Promise.all([
    supabase.from("lessons").select("id, starts_at, ends_at").eq("class_id", id).order("starts_at"),
    supabase.from("logbooks").select("id, period, status").eq("class_id", id).order("period", { ascending: false }),
  ]);
  const lessons = lessonsR.data ?? [];
  const logbooks = logbooksR.data ?? [];

  const logbookIds = logbooks.map((l) => l.id);
  let entries: {
    id: string;
    logbook_id: string;
    lesson_id: string;
    topic: string;
    activities: string;
    observation: string;
    recommendation: string;
  }[] = [];
  if (logbookIds.length) {
    const { data } = await supabase
      .from("logbook_entries")
      .select("id, logbook_id, lesson_id, topic, activities, observation, recommendation")
      .in("logbook_id", logbookIds);
    entries = data ?? [];
  }
  const entriesByLogbook = new Map<string, typeof entries>();
  for (const e of entries ?? []) {
    const list = entriesByLogbook.get(e.logbook_id) ?? [];
    list.push(e);
    entriesByLogbook.set(e.logbook_id, list);
  }

  const lessonById = new Map(lessons.map((l) => [l.id, l]));
  const now = Date.now();
  const ended = lessons.filter((l) => new Date(l.ends_at).getTime() <= now);
  const upcoming = lessons.filter((l) => new Date(l.ends_at).getTime() > now);

  const period = currentPeriod();
  const currentLogbook = logbooks.find((l) => l.period === period);

  const missingFor = (logbookId: string, lbPeriod: string) => {
    const entryLessonIds = new Set((entriesByLogbook.get(logbookId) ?? []).map((e) => e.lesson_id));
    return ended.filter(
      (l) => periodOf(new Date(l.ends_at)) === lbPeriod && !entryLessonIds.has(l.id),
    );
  };

  const card = "rounded-card border border-cloud bg-white";

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold">{cls.name}</h1>
        <p className="mt-1 text-sm text-muted">
          Kapasitas {cls.capacity} · Paket {formatMinutes(cls.package_minutes)}
        </p>
      </header>

      {/* Schedule */}
      <section className={card} aria-labelledby="schedule-heading">
        <h2 id="schedule-heading" className="border-b border-cloud px-5 py-3 text-sm font-semibold">
          Jadwal lesson
        </h2>
        <div className="space-y-6 p-5">
          <ScheduleLessonForm classId={cls.id} />

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cloud text-left text-muted">
                  <th className="py-1.5 pr-4 font-medium">Waktu (WIB)</th>
                  <th className="py-1.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((l) => (
                  <tr key={l.id} className="border-b border-cloud last:border-0">
                    <td className="py-1.5 pr-4">{formatDateTimeWIB(l.starts_at)}</td>
                    <td className="py-1.5"><Badge status="submitted" /> <span className="text-xs text-muted">Akan datang</span></td>
                  </tr>
                ))}
                {ended.map((l) => (
                  <tr key={l.id} className="border-b border-cloud last:border-0">
                    <td className="py-1.5 pr-4">{formatDateTimeWIB(l.starts_at)}</td>
                    <td className="py-1.5 text-muted">Selesai</td>
                  </tr>
                ))}
                {lessons.length === 0 && (
                  <tr><td colSpan={2} className="py-2 text-muted">Belum ada lesson.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Logbooks */}
      <section className={card} aria-labelledby="logbook-heading">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cloud px-5 py-3">
          <h2 id="logbook-heading" className="text-sm font-semibold">Logbook bulanan</h2>
          {!currentLogbook && (
            <ActionButton
              action={() => ensureLogbook(cls.id, period)}
              className="rounded-card bg-navy px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
            >
              Buat logbook {period}
            </ActionButton>
          )}
        </div>

        <div className="divide-y divide-cloud">
          {logbooks.map((lb) => {
            const lbEntries = entriesByLogbook.get(lb.id) ?? [];
            const missing = missingFor(lb.id, lb.period);
            const isDraft = lb.status === "draft";
            return (
              <div key={lb.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Periode {lb.period}</span>
                    <Badge status={lb.status} />
                  </div>
                  {isDraft && missing.length === 0 && (
                    <ActionButton
                      action={() => submitLogbook(lb.id)}
                      confirmText="Submit logbook untuk direview admin?"
                      className="rounded-card bg-navy px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
                    >
                      Submit logbook
                    </ActionButton>
                  )}
                </div>

                {isDraft && missing.length > 0 && (
                  <p className="mt-2 text-sm text-muted">
                    {missing.length} lesson sudah berakhir dan belum ada entry.
                  </p>
                )}

                <div className="mt-3 space-y-2">
                  {lbEntries.map((e) => (
                    <div key={e.id} className="rounded-card border border-cloud bg-surface px-3 py-2">
                      <div className="text-sm font-medium">{e.topic}</div>
                      <div className="text-xs text-muted">
                        {lessonById.get(e.lesson_id) ? formatDateTimeWIB(lessonById.get(e.lesson_id)!.starts_at) : ""}
                      </div>
                    </div>
                  ))}
                  {lbEntries.length === 0 && (
                    <p className="text-sm text-muted">Belum ada entry.</p>
                  )}
                </div>

                {isDraft && missing.length > 0 && (
                  <div className="mt-4 rounded-card border border-cloud p-4">
                    <h3 className="text-sm font-semibold">Tambah entry</h3>
                    <div className="mt-3">
                      <AddEntryForm
                        logbookId={lb.id}
                        lessons={missing.map((l) => ({
                          id: l.id,
                          label: formatDateTimeWIB(l.starts_at),
                        }))}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {logbooks.length === 0 && !currentLogbook && (
            <p className="px-5 py-4 text-sm text-muted">
              Belum ada logbook. Buat logbook bulan ini untuk mulai mengisi.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
