"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { logout } from "@/lib/actions/auth";

type NavItem = { href: string; label: string; exact?: boolean };

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
  const [menuOpen, setMenuOpen] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const isActive = (item: NavItem) =>
    item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(item.href + "/");

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        hamburgerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    drawerRef.current?.querySelector<HTMLElement>("a")?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const sidebarLink = (active: boolean) =>
    `flex min-h-11 items-center rounded-card px-3 py-2 text-sm transition ${
      active
        ? "bg-gold font-semibold text-navy"
        : "text-white/85 hover:bg-white/10 hover:text-white"
    }`;
  const logoutClass =
    "flex min-h-11 w-full items-center rounded-card px-3 py-2 text-left text-sm text-white/70 transition hover:bg-white/10 hover:text-white";

  return (
    <div className="min-h-screen md:flex">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-card focus:bg-navy focus:px-3 focus:py-2 focus:text-white"
      >
        Lewati ke konten
      </a>

      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-navy px-4 py-2 text-white md:hidden">
        <div className="flex items-baseline gap-3">
          <span className="text-lg font-semibold tracking-tight">ClassFlow</span>
          <span className="text-xs font-medium text-white/60">{role}</span>
        </div>
        <button
          ref={hamburgerRef}
          type="button"
          aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          onClick={() => setMenuOpen((o) => !o)}
          className="grid min-h-11 place-items-center rounded-card px-2 text-white"
        >
          <svg
            aria-hidden
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-navy/40"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <div
            ref={drawerRef}
            id="mobile-nav"
            role="dialog"
            aria-modal="true"
            className="absolute inset-y-0 right-0 w-72 bg-navy p-4 text-white"
          >
            <nav aria-label="Navigasi utama" className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(item) ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={sidebarLink(isActive(item))}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <form action={logout} className="mt-auto border-t border-white/10 pt-3">
              <button type="submit" className={logoutClass}>
                Keluar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 z-20 hidden h-screen w-60 shrink-0 flex-col bg-navy text-white md:flex">
        <div className="px-5 py-5">
          <div className="text-lg font-semibold tracking-tight">ClassFlow</div>
          <div className="mt-0.5 text-xs font-medium text-white/60">{role}</div>
        </div>
        <nav aria-label="Navigasi utama" className="flex flex-col gap-1 px-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item) ? "page" : undefined}
              className={sidebarLink(isActive(item))}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-white/10 p-3">
          <form action={logout}>
            <button type="submit" className={logoutClass}>
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
