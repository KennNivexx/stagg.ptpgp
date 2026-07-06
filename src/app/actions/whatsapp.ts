"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole, requireAuth } from "@/lib/auth-guard";
import { normalizeWaNumber, getWaBotContactUrl, getWaProvider, type WaProvider } from "@/lib/whatsapp";
import type { BaileysStatus } from "@/lib/whatsapp-baileys";

function isMissingWaSchema(code?: string) {
  return code === "42P01" || code === "PGRST204" || code === "PGRST205";
}

/**
 * Saves the employee's WhatsApp number only — does NOT send anything.
 * Per the employee-initiates-first flow, the bot never messages first, so
 * there's no template to send here. The employee activates the connection
 * themselves via the wa.me link from getContactBotUrl() (see profile page).
 * wa_connected_at is set later by the webhook once their first message
 * actually arrives (see src/app/api/wa/webhook/route.ts).
 */
export async function connectWhatsApp(formData: FormData): Promise<{ error: string } | { success: true }> {
  const user = await requireRole("employee", "hrd", "superadmin");

  const employeeId = (formData.get("employeeId") as string || "").trim();
  if (!employeeId) return { error: "ID karyawan tidak ditemukan." };

  // Ownership check, same pattern as saveContactProfile in profile.ts
  if (user.role === "employee") {
    const { data: emp } = await supabaseAdmin
      .from("employees")
      .select("id")
      .eq("id", employeeId)
      .eq("email", user.email)
      .maybeSingle();
    if (!emp) return { error: "Akses ditolak: data bukan milik Anda." };
  }

  const rawNumber = (formData.get("wa_number") as string || "").trim();
  if (!rawNumber) return { error: "Nomor WhatsApp wajib diisi." };

  const normalized = normalizeWaNumber(rawNumber);
  if ("error" in normalized) return normalized;

  const { data: conflict } = await supabaseAdmin
    .from("employees")
    .select("id")
    .eq("wa_number", normalized.number)
    .neq("id", employeeId)
    .maybeSingle();
  if (conflict) return { error: "Nomor WhatsApp ini sudah terhubung ke akun lain." };

  const { error: updateErr } = await supabaseAdmin
    .from("employees")
    .update({ wa_number: normalized.number, wa_opted_out: false, wa_connected_at: null })
    .eq("id", employeeId);
  if (isMissingWaSchema(updateErr?.code)) {
    return { error: "Jalankan migrasi 20260708001_whatsapp_bot.sql terlebih dahulu." };
  }
  if (updateErr) {
    console.error("[whatsapp] connectWhatsApp update error:", updateErr.message);
    return { error: "Gagal memproses. Silakan coba lagi." };
  }

  revalidatePath("/employee/profile");
  return { success: true };
}

export async function disconnectWhatsApp(employeeId: string): Promise<{ error: string } | { success: true }> {
  const user = await requireRole("employee", "hrd", "superadmin");
  if (user.role === "employee") {
    const { data: emp } = await supabaseAdmin
      .from("employees")
      .select("id")
      .eq("id", employeeId)
      .eq("email", user.email)
      .maybeSingle();
    if (!emp) return { error: "Akses ditolak: data bukan milik Anda." };
  }

  const { error } = await supabaseAdmin
    .from("employees")
    .update({ wa_number: null, wa_connected_at: null, wa_opted_out: false })
    .eq("id", employeeId);
  if (error) {
    console.error("[whatsapp] disconnectWhatsApp error:", error.message);
    return { error: "Gagal memproses. Silakan coba lagi." };
  }

  await supabaseAdmin.from("wa_conversations").delete().eq("employee_id", employeeId);

  revalidatePath("/employee/profile");
  return { success: true };
}

/** Public bot number as a one-tap wa.me link (prefilled text) — any
 * authenticated user may read this, it's not sensitive (like a support
 * phone number). Returns null if HRD hasn't configured it yet. */
export async function getContactBotUrl(): Promise<string | null> {
  await requireAuth();
  return getWaBotContactUrl();
}

export async function getWaProviderSetting(): Promise<WaProvider> {
  await requireRole("hrd", "superadmin");
  return getWaProvider();
}

export async function setWaProviderSetting(provider: WaProvider): Promise<{ error: string } | { success: true }> {
  await requireRole("hrd", "superadmin");
  if (provider !== "meta" && provider !== "baileys") return { error: "Mode tidak valid." };
  const { error } = await supabaseAdmin.from("system_settings").upsert({ key: "wa_provider", value: provider }, { onConflict: "key" });
  if (error) {
    console.error("[whatsapp] setWaProviderSetting error:", error.message);
    return { error: "Gagal menyimpan mode bot." };
  }
  revalidatePath("/hrd/admin/settings");
  return { success: true };
}

export async function getBaileysConnectionStatus(): Promise<{ status: BaileysStatus; qrDataUrl: string | null; number: string | null }> {
  await requireRole("hrd", "superadmin");
  const { getBaileysStatus } = await import("@/lib/whatsapp-baileys");
  return getBaileysStatus();
}

export async function startBaileysConnectionAction(): Promise<{ status: BaileysStatus; qrDataUrl: string | null; number: string | null }> {
  await requireRole("hrd", "superadmin");
  const { startBaileysConnection } = await import("@/lib/whatsapp-baileys");
  return startBaileysConnection();
}

export async function disconnectBaileysSessionAction(): Promise<{ success: true }> {
  await requireRole("hrd", "superadmin");
  const { disconnectBaileysSession } = await import("@/lib/whatsapp-baileys");
  await disconnectBaileysSession();
  return { success: true };
}
