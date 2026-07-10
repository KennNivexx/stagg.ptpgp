import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { IncomingWaMessage, resolveFonntePollChoice } from "@/lib/whatsapp-router";
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
    if (!sender) return NextResponse.json({ success: true });

    const normalized = normalizeWaNumber(sender);
    if ("error" in normalized) return NextResponse.json({ success: true });

    // A poll vote (from sendFonntePoll — see whatsapp.ts/whatsapp-router.ts)
    // arrives with `pollname`+`choices` instead of a normal `message` body.
    // Resolve the tapped option's label back to the same value a typed reply
    // would produce, so routeIncomingMessage needs no poll-specific handling.
    const text = fields.choices && fields.pollname
      ? (resolveFonntePollChoice(fields.pollname, fields.choices) ?? fields.choices.trim())
      : (fields.message || fields.text || "").trim();

    let incoming: IncomingWaMessage;
    if (fields.url) {
      // `url` is only present on Fonnte plans that include media in the
      // webhook payload (documented as a paid-package feature) — attempt the
      // download so photo clock-in works wherever Fonnte does provide it.
      try {
        const mediaRes = await fetch(fields.url);
        if (!mediaRes.ok) throw new Error(String(mediaRes.status));
        const buffer = Buffer.from(await mediaRes.arrayBuffer());
        const contentType = mediaRes.headers.get("content-type") || "image/jpeg";
        incoming = { type: "image", imageDataUrl: `data:${contentType};base64,${buffer.toString("base64")}` };
      } catch (e) {
        console.error("[wa webhook-fonnte] media download error:", (e as Error).message);
        incoming = { type: "image", mediaError: "Gagal mengunduh foto dari Fonnte. Silakan coba lagi." };
      }
    } else {
      incoming = { type: "text", text };
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
