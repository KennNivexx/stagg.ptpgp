import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { IncomingWaMessage } from "@/lib/whatsapp-router";
import { processInboundWaMessage } from "@/lib/whatsapp-inbound";
import { normalizeWaNumber } from "@/lib/whatsapp";

/**
 * Fonnte's inbound webhook. Unlike Meta, Fonnte has no verification
 * handshake and no request-signing (no x-hub-signature-256 equivalent) — see
 * https://docs.fonnte.com/webhook-reply-message/. The only hardening
 * available is a shared secret WE choose and put in the webhook URL we give
 * to Fonnte's dashboard (e.g. .../webhook-fonnte?secret=xxx), checked against
 * `pengaturan_sistem.wa_fonnte_webhook_secret`. If that setting is left
 * empty the check is skipped (fail-open) so the integration works with zero
 * setup — HRD can harden it later once the bot is confirmed working.
 */
async function getFonnteWebhookSecret(): Promise<string> {
  const { data } = await supabaseAdmin.from("pengaturan_sistem").select("value").eq("key", "wa_fonnte_webhook_secret").maybeSingle();
  return (data?.value as string) || "";
}

export async function POST(request: NextRequest) {
  const configuredSecret = await getFonnteWebhookSecret();
  if (configuredSecret) {
    const provided = request.nextUrl.searchParams.get("secret") || "";
    if (provided !== configuredSecret) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
    }
  }

  let fields: Record<string, string>;
  try {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = await request.json();
      fields = json as Record<string, string>;
    } else {
      const form = await request.formData();
      fields = Object.fromEntries(Array.from(form.entries()).map(([k, v]) => [k, String(v)]));
    }
  } catch {
    // Malformed body — ack anyway so Fonnte doesn't retry-storm it.
    return NextResponse.json({ success: true });
  }

  try {
    const sender = (fields.sender || "").trim();
    const text = (fields.message || fields.text || "").trim();
    if (!sender) return NextResponse.json({ success: true });

    const normalized = normalizeWaNumber(sender);
    if ("error" in normalized) return NextResponse.json({ success: true });

    const incoming: IncomingWaMessage = { type: "text", text };
    // Fonnte's free tier doesn't include media URLs in the webhook payload
    // (`url` is documented as premium-package-only) — image/selfie clock-in
    // via Fonnte isn't supported yet, same limitation noted in whatsapp-fonnte.ts.
    if (fields.url) {
      incoming.mediaError = "Lampiran media via Fonnte belum didukung.";
    }

    // Fonnte doesn't provide a stable per-message id in the base payload —
    // fall back to the timestamp+sender pair, which is unique enough for the
    // log_pesan_wa dedup check to still catch true duplicate webhook retries.
    const messageId = fields.inboxid || `fonnte-${sender}-${fields.timestamp || Date.now()}`;

    await processInboundWaMessage({ from: normalized.number, messageId, message: incoming });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[wa webhook-fonnte] processing error:", (e as Error).message);
    return NextResponse.json({ success: true });
  }
}
