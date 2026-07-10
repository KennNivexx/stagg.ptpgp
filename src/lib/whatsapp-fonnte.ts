/**
 * Fonnte provider adapter — a popular Indonesian unofficial WhatsApp gateway
 * (fonnte.com). Much simpler to activate than the Meta Cloud API: no
 * business verification, no app review — just scan a QR code on the Fonnte
 * dashboard once and copy the device token here. Trade-off: it's an
 * unofficial/unsupported integration (risk of the connected number being
 * blocked by WhatsApp) and Fonnte's webhook has no signature/HMAC to verify
 * requests actually came from them (unlike Meta's x-hub-signature-256) — see
 * the shared-secret query param check in the webhook route instead.
 *
 * Docs: https://docs.fonnte.com/api-send-message/ and
 * https://docs.fonnte.com/webhook-reply-message/
 */
import { supabaseAdmin } from "@/lib/supabase";

const FONNTE_SEND_URL = "https://api.fonnte.com/send";

export async function getFonnteToken(): Promise<string | null> {
  const { data } = await supabaseAdmin.from("pengaturan_sistem").select("value").eq("key", "wa_fonnte_token").maybeSingle();
  return (data?.value as string) || process.env.FONNTE_TOKEN || null;
}

export async function sendFonnteText(to: string, message: string): Promise<{ success: true } | { error: string }> {
  const token = await getFonnteToken();
  if (!token) return { error: "Token Fonnte belum diatur." };

  try {
    const body = new URLSearchParams({ target: to, message });
    const res = await fetch(FONNTE_SEND_URL, {
      method: "POST",
      headers: { Authorization: token, "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const json = await res.json().catch(() => null) as { status?: boolean; reason?: string } | null;
    if (!res.ok || !json?.status) {
      return { error: `Fonnte error: ${json?.reason || res.statusText}` };
    }
    return { success: true };
  } catch (e) {
    return { error: `Gagal mengirim via Fonnte: ${(e as Error).message}` };
  }
}
