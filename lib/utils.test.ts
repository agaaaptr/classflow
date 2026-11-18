import { describe, it, expect } from "vitest";
import {
  formatRupiah,
  formatMinutes,
  hoursLeft,
  lessonMinutes,
  wibToIso,
} from "./utils";

describe("formatRupiah", () => {
  it("formats whole rupiah without decimals", () => {
    // Intl id-ID inserts a non-breaking space between "Rp" and the amount.
    const norm = (s: string) => s.replace(/ /g, " ");
    expect(norm(formatRupiah(1200000))).toBe("Rp 1.200.000");
    expect(norm(formatRupiah(112500))).toBe("Rp 112.500");
    expect(norm(formatRupiah(0))).toBe("Rp 0");
  });
});

describe("formatMinutes", () => {
  it("renders whole hours and mixed hour/minute", () => {
    expect(formatMinutes(720)).toBe("12 jam");
    expect(formatMinutes(90)).toBe("1 jam 30 menit");
    expect(formatMinutes(45)).toBe("45 menit");
    expect(formatMinutes(450)).toBe("7 jam 30 menit");
  });
});

describe("lessonMinutes", () => {
  it("computes duration in whole minutes", () => {
    expect(lessonMinutes("2026-10-10T02:00:00Z", "2026-10-10T03:30:00Z")).toBe(90);
  });
});

describe("hoursLeft", () => {
  const lessons = [
    // ended before pay -> not deducted
    { starts_at: "2026-10-10T02:00:00Z", ends_at: "2026-10-10T03:30:00Z" },
    // ended after pay -> deducted
    { starts_at: "2026-11-10T02:00:00Z", ends_at: "2026-11-10T03:30:00Z" },
    // upcoming -> not deducted
    { starts_at: "2099-01-01T02:00:00Z", ends_at: "2099-01-01T03:30:00Z" },
  ];

  it("deducts only lessons that ended after paidAt", () => {
    const paidAt = "2026-11-01T00:00:00Z";
    // 720 - 90 (the Nov lesson) = 630
    expect(hoursLeft(720, lessons, paidAt)).toBe(630);
  });

  it("does not go negative", () => {
    const paidAt = "2026-01-01T00:00:00Z";
    expect(hoursLeft(60, lessons, paidAt)).toBe(0);
  });
});

describe("wibToIso", () => {
  it("appends the +07 offset", () => {
    expect(wibToIso("2026-11-20", "09:00")).toBe("2026-11-20T09:00:00+07:00");
  });
});
