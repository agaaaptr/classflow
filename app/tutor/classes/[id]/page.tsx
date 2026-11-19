import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BackLink from "@/components/BackLink";
import Badge from "@/components/Badge";
import ActionButton from "@/components/ActionButton";
import ScheduleLessonForm from "@/components/forms/ScheduleLessonForm";
import EmptyState from "@/components/ui/EmptyState";
import { ensureLogbook } from "@/lib/actions/logbooks";
import { formatDateTimeWIB, formatMinutes, currentPeriod } from "@/lib/utils";

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

  const now = Date.now(); // eslint-disable-line react-hooks/purity
  const upcoming = lessons.filter((l) => new Date(l.ends_at).getTime() > now);
  const ended = lessons.filter((l) => new Date(l.ends_at).getTime() <= now);
  const period = currentPeriod();
  const currentLogbook = logbooks.find((l) => l.period === period);

  const card = "rounded-card border border-cloud bg-white";

  return (
    <div className="space-y-section">
      <BackLink href="/tutor" label="Kelas saya" />

      <header>
        <h1 className="text-2xl font-semibold">{cls.name}</h1>
        <p className="mt-1 text-sm text-muted">
          Kapasitas {cls.capacity} · Paket {formatMinutes(cls.package_minutes)}
        </p>
      </header>

      {/* Schedule */}
      <section className={card} aria-labelledby="schedule-heading">
        <div className="border-b border-cloud px-5 py-3">
          <h2 id="schedule-heading" className="text-base font-semibold">Jadwal lesson</h2>
        </div>
        <div className="space-y-6 p-5">
          <ScheduleLessonForm classId={cls.id} />

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cloud text-left">
                  <th className="py-1.5 pr-4 text-xs font-semibold uppercase tracking-wider text-muted">Waktu (WIB)</th>
                  <th className="py-1.5 text-xs font-semibold uppercase tracking-wider text-muted">Status</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((l) => (
                  <tr key={l.id} className="border-b border-cloud last:border-0">
                    <td className="py-1.5 pr-4">{formatDateTimeWIB(l.starts_at)}</td>
                    <td className="py-1.5 text-muted">Akan datang</td>
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
        <div className="flex items-center justify-between gap-3 border-b border-cloud px-5 py-3">
          <h2 id="logbook-heading" className="text-base font-semibold">Logbook bulanan</h2>
          {!currentLogbook && (
            <ActionButton
              action={ensureLogbook}
              args={[cls.id, period]}
              className="rounded-card bg-navy px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
            >
              Buat logbook {period}
            </ActionButton>
          )}
        </div>

        <div className="divide-y divide-cloud/70">
          {logbooks.map((lb) => (
            <div key={lb.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="flex items-center gap-3">
                <span className="font-medium">Periode {lb.period}</span>
                <Badge status={lb.status} />
              </div>
              <Link
                href={`/tutor/logbooks/${lb.id}`}
                className="rounded-card border border-cloud px-3 py-1.5 text-sm font-medium text-navy hover:bg-surface"
              >
                {lb.status === "draft" ? "Isi logbook" : "Lihat"}
              </Link>
            </div>
          ))}
          {logbooks.length === 0 && (
            <EmptyState title="Belum ada logbook" description="Buat logbook bulan ini untuk mulai mengisi entry." />
          )}
        </div>
      </section>
    </div>
  );
}
