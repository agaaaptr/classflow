import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BackLink from "@/components/BackLink";
import Badge from "@/components/Badge";
import ActionButton from "@/components/ActionButton";
import AddEntryForm from "@/components/forms/AddEntryForm";
import EmptyState from "@/components/ui/EmptyState";
import { submitLogbook } from "@/lib/actions/logbooks";
import { formatDateTimeWIB, periodOf } from "@/lib/utils";

export default async function TutorLogbookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: logbook } = await supabase
    .from("logbooks")
    .select("id, class_id, period, status")
    .eq("id", id)
    .single();
  if (!logbook) notFound();

  const [{ data: cls }, { data: entries }, { data: lessons }] = await Promise.all([
    supabase.from("classes").select("name").eq("id", logbook.class_id).single(),
    supabase
      .from("logbook_entries")
      .select("id, lesson_id, topic, activities, observation, recommendation")
      .eq("logbook_id", id),
    supabase.from("lessons").select("id, starts_at, ends_at").eq("class_id", logbook.class_id),
  ]);

  const lessonById = new Map((lessons ?? []).map((l) => [l.id, l]));
  const entryLessonIds = new Set((entries ?? []).map((e) => e.lesson_id));
  // "now" is request time; the page is dynamic via cookies.
  const now = Date.now(); // eslint-disable-line react-hooks/purity
  const missing = (lessons ?? []).filter(
    (l) =>
      new Date(l.ends_at).getTime() <= now &&
      periodOf(new Date(l.ends_at)) === logbook.period &&
      !entryLessonIds.has(l.id),
  );

  const card = "rounded-card border border-cloud bg-white";

  return (
    <div className="space-y-section">
      <BackLink href={`/tutor/classes/${logbook.class_id}`} label={cls?.name ?? "Kelas"} />

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            Logbook {cls?.name ?? "-"} · {logbook.period}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Isi entry untuk lesson yang sudah berakhir, lalu submit untuk direview admin.
          </p>
        </div>
        <Badge status={logbook.status} />
      </header>

      <section className={card} aria-labelledby="entries-heading">
        <div className="flex items-baseline justify-between gap-3 border-b border-cloud px-5 py-3">
          <h2 id="entries-heading" className="text-base font-semibold">Entri logbook</h2>
          <span className="text-sm text-muted">
            {(entries ?? []).length} entry{missing.length > 0 ? ` · ${missing.length} belum diisi` : ""}
          </span>
        </div>

        <div className="divide-y divide-cloud/70">
          {(entries ?? []).map((entry) => {
            const lesson = lessonById.get(entry.lesson_id);
            return (
              <article key={entry.id} className="px-5 py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-medium">{entry.topic}</h3>
                  <span className="text-xs text-muted">
                    {lesson ? formatDateTimeWIB(lesson.starts_at) : ""}
                  </span>
                </div>
                <dl className="mt-2 space-y-1 text-sm">
                  <div><dt className="inline font-medium">Aktivitas: </dt><dd className="inline">{entry.activities}</dd></div>
                  <div><dt className="inline font-medium">Observasi: </dt><dd className="inline">{entry.observation}</dd></div>
                  <div><dt className="inline font-medium">Rekomendasi: </dt><dd className="inline">{entry.recommendation}</dd></div>
                </dl>
              </article>
            );
          })}
          {(entries ?? []).length === 0 && (
            <EmptyState title="Belum ada entry" description="Tambahkan entry untuk lesson yang sudah berakhir." />
          )}
        </div>

        {logbook.status === "draft" && (
          <div className="border-t border-cloud p-5">
            {missing.length > 0 ? (
              <>
                <h3 className="text-sm font-semibold">Tambah entry</h3>
                <div className="mt-3">
                  <AddEntryForm
                    logbookId={logbook.id}
                    lessons={missing.map((l) => ({ id: l.id, label: formatDateTimeWIB(l.starts_at) }))}
                  />
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted">Semua lesson yang berakhir sudah terisi.</p>
                <ActionButton
                  action={submitLogbook}
                  args={[logbook.id]}
                  confirmText="Submit logbook ini untuk direview admin?"
                  className="rounded-card bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Submit logbook
                </ActionButton>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
