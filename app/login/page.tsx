"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/lib/actions/auth";

const initialState: LoginState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-card border border-cloud bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold">Masuk ke ClassFlow</h1>
        <p className="mt-1 text-sm text-muted">
          Gunakan salah satu akun yang sudah di-seed.
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
              placeholder="student1@classflow.dev"
              className="mt-1 w-full rounded-card border border-cloud px-3 py-2 text-sm focus:border-navy focus:outline-none"
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
              placeholder="••••••••••••"
              className="mt-1 w-full rounded-card border border-cloud px-3 py-2 text-sm focus:border-navy focus:outline-none"
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
            className="w-full rounded-card bg-navy px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60"
          >
            {pending ? "Masuk…" : "Masuk"}
          </button>
        </form>
      </div>
    </main>
  );
}
