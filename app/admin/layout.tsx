import { requireRole } from "@/lib/auth";
import AppShell from "@/components/AppShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("admin");
  return (
    <AppShell
      role="Admin"
      navItems={[
        { href: "/admin", label: "Dashboard", exact: true },
        { href: "/admin/classes", label: "Kelas" },
        { href: "/admin/invoices", label: "Invoice" },
        { href: "/admin/logbooks", label: "Logbook" },
        { href: "/admin/students", label: "Siswa" },
      ]}
    >
      {children}
    </AppShell>
  );
}
