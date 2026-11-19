import { createClient } from "@/lib/supabase/server";
import Badge from "@/components/Badge";
import ActionButton from "@/components/ActionButton";
import EmptyState from "@/components/ui/EmptyState";
import { cancelInvoice } from "@/lib/actions/invoices";
import { formatRupiah } from "@/lib/utils";

export default async function AdminInvoicesPage() {
  const supabase = await createClient();

  const [invoicesR, enrollmentsR, classesR, profilesR] = await Promise.all([
    supabase.from("invoices").select("id, enrollment_id, student_id, amount_rp, status").order("created_at", { ascending: false }),
    supabase.from("enrollments").select("id, class_id"),
    supabase.from("classes").select("id, name"),
    supabase.from("profiles").select("id, full_name"),
  ]);

  const invoices = invoicesR.data ?? [];
  const enrollmentById = new Map((enrollmentsR.data ?? []).map((e) => [e.id, e]));
  const classById = new Map((classesR.data ?? []).map((c) => [c.id, c]));
  const nameById = new Map((profilesR.data ?? []).map((p) => [p.id, p.full_name]));

  return (
    <div className="space-y-section">
      <header>
        <h1 className="text-2xl font-semibold">Invoice</h1>
        <p className="mt-1 text-sm text-muted">Semua invoice siswa dan status pembayarannya.</p>
      </header>

      <section className="rounded-card border border-cloud bg-white" aria-labelledby="invoices-heading">
        <h2 id="invoices-heading" className="border-b border-cloud px-5 py-3 text-base font-semibold">
          Semua invoice
        </h2>
        <div className="divide-y divide-cloud/70">
          {invoices.map((inv) => {
            const enr = enrollmentById.get(inv.enrollment_id);
            const cls = enr ? classById.get(enr.class_id) : null;
            return (
              <div key={inv.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <div className="truncate font-medium">{nameById.get(inv.student_id) ?? "-"}</div>
                  <div className="truncate text-sm text-muted">
                    {cls?.name ?? "-"} · {formatRupiah(inv.amount_rp)}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge status={inv.status} />
                  {inv.status === "unpaid" && (
                    <ActionButton
                      action={cancelInvoice}
                      args={[inv.id]}
                      variant="danger"
                      confirmText="Batalkan invoice ini? Kursinya akan dilepas."
                      confirmTone="danger"
                      successMessage="Invoice dibatalkan"
                    >
                      Batalkan
                    </ActionButton>
                  )}
                </div>
              </div>
            );
          })}
          {invoices.length === 0 && <EmptyState title="Belum ada invoice" />}
        </div>
      </section>
    </div>
  );
}
