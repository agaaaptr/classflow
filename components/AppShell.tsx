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

  const desktopLink = (active: boolean) =>
    `flex min-h-11 items-center border-b-2 px-3 py-2 text-sm transition ${
      active
        ? "border-gold font-semibold text-white"
        : "border-transparent text-white/85 hover:text-white"
    }`;
  const drawerLink = (active: boolean) =>
    `block min-h-11 rounded-card px-3 py-2 text-sm transition ${
      active
        ? "bg-gold font-semibold text-navy"
        : "text-white/85 hover:bg-white/10 hover:text-white"
    }`;
  const logoutClass =
    "min-h-11 rounded-card px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white";

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-card focus:bg-navy focus:px-3 focus:py-2 focus:text-white"
      >
        Lewati ke konten
      </a>

      <header className="sticky top-0 z-30 bg-navy text-white">
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="flex items-baseline gap-3">
            <span className="text-lg font-semibold tracking-tight">ClassFlow</span>
            <span className="hidden text-xs font-medium text-white/60 sm:inline">{role}</span>
          </div>

          <nav aria-label="Navigasi utama" className="ml-auto hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item) ? "page" : undefined}
                className={desktopLink(isActive(item))}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <form action={logout} className="hidden md:block">
            <button type="submit" className={logoutClass}>
              Keluar
            </button>
          </form>

          <button
            ref={hamburgerRef}
            type="button"
            aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((o) => !o)}
            className="ml-auto grid min-h-11 place-items-center rounded-card px-2 text-white md:hidden"
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
        </div>

        {menuOpen && (
          <div
            ref={drawerRef}
            id="mobile-nav"
            role="dialog"
            aria-modal="true"
            className="border-t border-white/10 px-3 py-2 md:hidden"
          >
            <nav aria-label="Navigasi utama">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(item) ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={drawerLink(isActive(item))}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <form action={logout}>
              <button type="submit" className={`${logoutClass} block w-full text-left`}>
                Keluar
              </button>
            </form>
          </div>
        )}
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
