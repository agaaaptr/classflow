import { requireRole } from "@/lib/auth";
import AppShell from "@/components/AppShell";

export default async function TutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("tutor");
  return (
    <AppShell role="Tutor" navItems={[{ href: "/tutor", label: "Dashboard" }]}>
      {children}
    </AppShell>
  );
}
