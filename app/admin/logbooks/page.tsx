import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Badge from "@/components/Badge";
import EmptyState from "@/components/ui/EmptyState";

export default async function AdminLogbooksPage() {
  const supabase = await createClient();
  const [logbooksR, classesR] = await Promise.all([
    supabase.from("logbooks").select("id, class_id, period, status").order("period", { ascending: false }),
    supabase.from("classes").select("id, name"),
  ]);
  const logbooks = logbooksR.data ?? [];
  const classById = new Map((classesR.data ?? []).map((c) => [c.id, c]));

  return (
    <div className="space-y-section">
      <header>
        <h1 className="text-2xl font-semibold">Logbook</h1>
        <p className="mt-1 text-sm text-muted">Semua logbook bulanan per kelas.</p>
      </header>

      <section className="rounded-card border border-cloud bg-white" aria-labelledby="logbooks-heading">
        <h2 id="logbooks-heading" className="border-b border-cloud px-5 py-3 text-base font-semibold">
          Semua logbook
        </h2>
        <div className="divide-y divide-cloud/70">
          {logbooks.map((lb) => (
            <div key={lb.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
              <div className="flex items-center gap-3">
                <span className="font-medium">{classById.get(lb.class_id)?.name ?? "-"}</span>
                <span className="text-sm text-muted">Periode {lb.period}</span>
                <Badge status={lb.status} />
              </div>
              <Link
                href={`/admin/logbooks/${lb.id}`}
                className="rounded-card border border-cloud px-3 py-1.5 text-sm font-medium text-navy hover:bg-surface"
              >
                Lihat
              </Link>
            </div>
          ))}
          {logbooks.length === 0 && <EmptyState title="Belum ada logbook" />}
        </div>
      </section>
    </div>
  );
}
