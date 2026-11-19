import { test, expect, type Page } from "@playwright/test";

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("Classflow123!");
  await page.getByRole("button", { name: "Masuk" }).click();
}

// Declaration order matters (workers: 1). Read-only checks run first; the two
// mutating flows (student2 pays, admin approves) run last.

test("admin sees dashboard queues and stats", async ({ page }) => {
  await login(page, "admin@classflow.dev");
  await page.waitForURL("**/admin");

  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("Margin total")).toBeVisible();
  await expect(page.getByText(/975\.000/).first()).toBeVisible(); // margin
  await expect(page.getByText("Siswa Dua").first()).toBeVisible(); // unpaid queue
  await expect(page.getByText("Menunggu").first()).toBeVisible(); // pending logbook
});

test("only one sidebar item is active at a time", async ({ page }) => {
  await login(page, "admin@classflow.dev");
  await page.waitForURL("**/admin");
  await expect(page.getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");

  await page.getByRole("link", { name: "Kelas" }).click();
  await page.waitForURL("**/admin/classes");
  await expect(page.getByRole("link", { name: "Kelas" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute("aria-current");
});

test("tutor sees assigned class and logbook list", async ({ page }) => {
  await login(page, "tutor1@classflow.dev");
  await page.waitForURL("**/tutor");

  await expect(page.getByText("Kelas Matematika SMP").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Slip earnings" })).toBeVisible();
  await expect(page.getByText(/112\.500/).first()).toBeVisible(); // Oct earnings

  await page.getByRole("link", { name: /Kelola/ }).click();
  await page.waitForURL("**/tutor/classes/**");
  await expect(page.getByRole("heading", { name: "Jadwal lesson" })).toBeVisible();
  await expect(page.getByText("Periode 2026-11").first()).toBeVisible();
  await expect(page.getByText("Menunggu").first()).toBeVisible();
});

test("student1 sees paid class, hours left, and approved logbook", async ({ page }) => {
  await login(page, "student1@classflow.dev");
  await page.waitForURL("**/student");

  await expect(page.getByText("Lunas").first()).toBeVisible();
  await expect(page.getByText(/Sisa jam/).first()).toBeVisible();
  await expect(page.getByText("Periode 2026-10").first()).toBeVisible();
  await expect(page.getByText("Aljabar dasar").first()).toBeVisible();
});

test("student3 sees the class is full", async ({ page }) => {
  await login(page, "student3@classflow.dev");
  await page.waitForURL("**/student");

  await page.getByRole("link", { name: "Lihat kelas tersedia" }).first().click();
  await page.waitForURL("**/student/classes");
  await page.getByRole("button", { name: "Daftar" }).click();
  await page.getByRole("button", { name: "Ya", exact: true }).click();
  await expect(page.getByText("Kelas sudah penuh")).toBeVisible();
});

test("student2 pays and unlocks access", async ({ page }) => {
  await login(page, "student2@classflow.dev");
  await page.waitForURL("**/student");

  await expect(page.getByText("Belum bayar").first()).toBeVisible();
  await page.getByRole("button", { name: "Bayar" }).click();
  await page.getByRole("button", { name: "Ya", exact: true }).click();
  await expect(page.getByText("Lunas").first()).toBeVisible();
  await expect(page.getByText(/Sisa jam/).first()).toBeVisible();
});

test("admin approves the logbook and returns to dashboard", async ({ page }) => {
  await login(page, "admin@classflow.dev");
  await page.waitForURL("**/admin");

  await page.getByRole("link", { name: /Tinjau & setujui/ }).click();
  await page.waitForURL("**/admin/logbooks/**");
  await expect(page.getByRole("heading", { name: "Preview earnings tutor" })).toBeVisible();
  await expect(page.getByText(/225\.000/).first()).toBeVisible();

  await page.getByRole("button", { name: "Setujui logbook" }).click();
  await page.getByRole("button", { name: "Ya", exact: true }).click();
  await page.waitForURL("**/admin");
  await expect(page.getByText("Tidak ada logbook menunggu")).toBeVisible();
});
