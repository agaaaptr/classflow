// Pure formatting + derived-balance helpers. Server- and client-safe.

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (m === 0) return `${h} jam`;
  if (h === 0) return `${m} menit`;
  return `${h} jam ${m} menit`;
}

// Matches the SQL expression round(extract(epoch from (ends_at - starts_at)) / 60).
export function lessonMinutes(startsAt: string, endsAt: string): number {
  return Math.round((new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60000);
}

// "Hours left" = package minutes minus lessons that have ended after the
// student paid. Derived, never stored.
export function hoursLeft(
  packageMinutes: number,
  lessons: { starts_at: string; ends_at: string }[],
  paidAt: string | null,
): number {
  const now = Date.now();
  const consumed = lessons
    .filter((l) => {
      const ended = new Date(l.ends_at).getTime() <= now;
      const afterPay = !paidAt || new Date(l.ends_at).getTime() >= new Date(paidAt).getTime();
      return ended && afterPay;
    })
    .reduce((sum, l) => sum + lessonMinutes(l.starts_at, l.ends_at), 0);
  return Math.max(0, packageMinutes - consumed);
}

export function formatDateTimeWIB(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function formatDateWIB(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatTimeWIB(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

// Assemble a WIB wall-clock date/time into an ISO-8601 instant with the +07
// offset so Postgres stores the correct timestamptz (UTC).
export function wibToIso(date: string, time: string): string {
  return `${date}T${time}:00+07:00`;
}

// Logbook period (YYYY-MM) of an instant, in WIB.
export function periodOf(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
  }).format(date);
}

// Current logbook period: the WIB month of "now" as YYYY-MM.
export function currentPeriod(): string {
  return periodOf(new Date());
}
