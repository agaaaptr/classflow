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
    `flex min-h-11 items-center rounded-card px-3 py-2 text-sm transition ${
      pathname === href
        ? "bg-gold font-semibold text-navy"
        : "text-white/85 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-card focus:bg-navy focus:px-3 focus:py-2 focus:text-white"
      >
        Lewati ke konten
      </a>

      <aside className="flex flex-col bg-navy text-white md:w-60 md:shrink-0">
        <div className="px-5 py-5">
          <div className="text-lg font-semibold tracking-tight">ClassFlow</div>
          <div className="mt-0.5 text-xs font-medium uppercase tracking-widest text-gold">
            {role}
          </div>
        </div>

        <nav
          aria-label="Navigasi utama"
          className="flex gap-1 overflow-x-auto whitespace-nowrap px-3 pb-3 md:flex-col md:overflow-visible md:whitespace-normal"
        >
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={linkClass(item.href)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/10 p-3">
          <form action={logout}>
            <button
              type="submit"
              className="flex min-h-11 w-full items-center rounded-card px-3 py-2 text-left text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              Keluar
            </button>
          </form>
        </div>
      </aside>

      <main id="main" className="min-w-0 flex-1 p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
