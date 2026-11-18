import { execFileSync } from "node:child_process";

// Reset the local Supabase DB to a known demo state before each E2E run.
export default function globalSetup(): void {
  execFileSync("supabase", ["db", "reset"], { stdio: "inherit" });
}
