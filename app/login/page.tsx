"use client";

import { useActionState, useState } from "react";
import { login, type LoginState } from "@/lib/actions/auth";

const initialState: LoginState = { error: null };

const DEMO_ACCOUNTS = [
  { role: "Admin", email: "admin@classflow.dev" },
  { role: "Tutor", email: "tutor1@classflow.dev" },
  { role: "Siswa · paid", email: "student1@classflow.dev" },
  { role: "Siswa · unpaid", email: "student2@classflow.dev" },
  { role: "Siswa · belum enroll", email: "student3@classflow.dev" },
];

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const inputClass =
    "mt-1 h-11 w-full rounded-card border border-cloud px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy";

  function fillAccount(account: (typeof DEMO_ACCOUNTS)[number]) {
    setEmail(account.email);
    setPassword("Classflow123!");
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Brand panel */}
      <div className="flex flex-col justify-center gap-6 bg-navy px-8 py-12 text-white lg:w-1/2 lg:px-16">
        <div>
          <div className="text-2xl font-semibold tracking-tight">ClassFlow</div>
          <div className="mt-3 h-1 w-12 rounded-full bg-gold" />
        </div>
        <h1 className="max-w-md text-3xl font-semibold leading-tight">
          Kelola kelas, billing, dan logbook dalam satu tempat.
        </h1>
        <ul className="max-w-md space-y-2 text-sm text-white/75">
          <li>Siswa membeli paket jam dan membayar sebelum akses.</li>
          <li>Tutor mengisi logbook bulanan dan melihat slip earnings.</li>
          <li>Admin memantau margin, invoice, dan menyetujui logbook.</li>
        </ul>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold text-navy">Masuk ke ClassFlow</h2>
          <p className="mt-1 text-sm text-muted">
            Pilih akun demo di bawah, atau isi manual.
          </p>

          <form action={formAction} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@classflow.dev"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Classflow123!"
                className={inputClass}
              />
            </div>

            {state.error && (
              <p className="text-sm text-danger-ink" role="alert">
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              aria-busy={pending}
              className="h-11 w-full rounded-card bg-navy px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              {pending ? "Masuk…" : "Masuk"}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8 rounded-card border border-cloud bg-surface p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted">
              Akun demo
            </div>
            <ul className="mt-2 divide-y divide-cloud/70">
              {DEMO_ACCOUNTS.map((a) => (
                <li
                  key={a.email}
                  className="flex items-center justify-between gap-2 py-1.5 text-sm"
                >
                  <span className="text-muted">{a.role}</span>
                  <button
                    type="button"
                    onClick={() => fillAccount(a)}
                    className="font-medium text-navy hover:underline"
                  >
                    {a.email}
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted">
              Password: <span className="font-medium">Classflow123!</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
