import { requireRole } from "@/lib/auth";
import AppShell from "@/components/AppShell";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("student");
  return (
    <AppShell role="Siswa" navItems={[{ href: "/student", label: "Dashboard" }]}>
      {children}
    </AppShell>
  );
}
