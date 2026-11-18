"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions/auth";

type NavItem = { href: string; label: string };

export default function AppShell({
  role,
  navItems,
  children,
}: {
  role: string;
  navItems: NavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const linkClass = (href: string) =>
    `rounded-card px-3 py-2 text-sm transition ${
      pathname === href || pathname.startsWith(href + "/")
        ? "bg-gold font-semibold text-navy"
        : "text-white/85 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="bg-navy text-white md:w-60 md:shrink-0">
        <div className="flex items-baseline justify-between px-5 py-5 md:block">
          <div>
            <div className="text-lg font-semibold tracking-tight">ClassFlow</div>
            <div className="mt-0.5 text-xs font-medium uppercase tracking-widest text-gold">
              {role}
            </div>
          </div>
        </div>
        <nav className="flex flex-wrap gap-1 px-3 pb-3 md:flex-col">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass(item.href)}>
              {item.label}
            </Link>
          ))}
          <form action={logout} className="md:mt-4">
            <button
              type="submit"
              className="w-full rounded-card px-3 py-2 text-left text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              Keluar
            </button>
          </form>
        </nav>
      </aside>

      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
