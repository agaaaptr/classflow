import { createClient } from "@/lib/supabase/server";
import BackLink from "@/components/BackLink";
import CreateClassForm from "@/components/forms/CreateClassForm";
import EmptyState from "@/components/ui/EmptyState";

export default async function NewClassPage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase.from("profiles").select("id, full_name, role");
  const tutors = (profiles ?? []).filter((p) => p.role === "tutor");

  return (
    <div className="space-y-section">
      <BackLink href="/admin/classes" label="Kelas" />
      <header>
        <h1 className="text-2xl font-semibold">Buat kelas baru</h1>
      </header>
      {tutors.length > 0 ? (
        <CreateClassForm tutors={tutors.map((t) => ({ id: t.id, full_name: t.full_name }))} />
      ) : (
        <EmptyState
          title="Belum ada tutor"
          description="Buat akun tutor terlebih dahulu sebelum membuat kelas."
        />
      )}
    </div>
  );
}
