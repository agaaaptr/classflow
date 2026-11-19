"use server";
import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./enrollments";

export async function payInvoice(invoiceId: string): Promise<ActionResult> {
  await requireRole("student");

  const supabase = await createClient();
  const { error } = await supabase.rpc("pay_invoice", { p_invoice_id: invoiceId });
  if (error) {
    const msg =
      error.code === "P0001"
        ? "Invoice ini sudah tidak bisa dibayar."
        : "Pembayaran gagal.";
    return { ok: false, error: msg };
  }

  revalidatePath("/student");
  return { ok: true, error: null };
}

export async function cancelInvoice(invoiceId: string): Promise<ActionResult> {
  await requireRole("admin");

  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_invoice", { p_invoice_id: invoiceId });
  if (error) {
    const msg =
      error.code === "P0001"
        ? "Hanya invoice yang belum dibayar yang bisa dibatalkan."
        : "Gagal membatalkan invoice.";
    return { ok: false, error: msg };
  }

  revalidatePath("/admin");
  return { ok: true, error: null };
}
