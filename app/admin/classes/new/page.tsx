import { createClient } from "@/lib/supabase/server";
import BackLink from "@/components/BackLink";
import CreateClassForm from "@/components/forms/CreateClassForm";

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
      <div className="max-w-xl">
        <CreateClassForm tutors={tutors.map((t) => ({ id: t.id, full_name: t.full_name }))} />
      </div>
    </div>
  );
}
