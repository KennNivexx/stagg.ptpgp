import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
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
// Cached briefly — this almost never changes, and it was previously the
// first of several sequential DB round trips on every single webhook call,
// pure added latency before any actual message processing even started.
let secretCache: { value: string; expiresAt: number } | null = null;
const SECRET_CACHE_MS = 60_000;

async function getFonnteWebhookSecret(): Promise<string> {
  if (secretCache && secretCache.expiresAt > Date.now()) return secretCache.value;
  const { data } = await supabaseAdmin.from("pengaturan_sistem").select("value").eq("key", "wa_fonnte_webhook_secret").maybeSingle();
  const value = (data?.value as string) || "";
  secretCache = { value, expiresAt: Date.now() + SECRET_CACHE_MS };
  return value;
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

    const text = (fields.message || fields.text || "").trim();

    // Fonnte fires this same webhook URL for non-message events too (device
    // status pings, delivery/read receipts, and — per Fonnte's own device
    // config — sometimes the bot's own outgoing sends echoed back). None of
    // those carry real message text or media, but there was previously no
    // guard rejecting them: an empty-text payload fell all the way through
    // the router to its default branch, which sends the main menu — an
    // outbound send that itself can trigger another status callback to this
    // same URL, causing the bot to message the same person over and over
    // with no user input in between ("ngirim pesan terus menerus"). Reject
    // anything that isn't an actual inbound message before it reaches the
    // router. `fromMe`/`from_me`/`status` are checked defensively in case
    // Fonnte's payload for self-echo/status events includes any of them —
    // exact field names aren't documented, so this errs toward dropping
    // ambiguous non-message payloads rather than risking another loop.
    const isSelfOrStatusEvent =
      String(fields.fromMe ?? fields.from_me ?? "").toLowerCase() === "true" ||
      !!fields.status;
    if (isSelfOrStatusEvent || (!text && !fields.url)) {
      return NextResponse.json({ success: true });
    }

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

    // Dedup key is ALWAYS derived from message content (sender+text, or
    // sender+image for photos) rather than fields.inboxid/timestamp. Two
    // things were tried and both still let duplicates through in practice:
    // (1) Date.now() as a last-resort fallback — different on every HTTP
    // call, so a slow-response retry got a fresh "unique" id every time; (2)
    // trusting fields.inboxid/timestamp when present — WhatsApp multi-device
    // can deliver the SAME user message to this webhook multiple times with
    // genuinely different inboxid/timestamp values per delivery (it's not a
    // naive HTTP retry, it's distinct delivery events for one logical
    // message), so keying on those still bypassed the log_pesan_wa unique
    // check and caused the bot to process — and reply to — the same message
    // 2-3+ times ("ngespam chat terus"). Content hashing sidesteps both:
    // identical content always yields the identical key regardless of which
    // volatile envelope field Fonnte attaches to a given delivery. Tradeoff:
    // a user sending the exact same text twice in a row within the same
    // processing window has the second one dropped as a false-positive
    // duplicate — rare, and far better than a reply loop.
    const contentKey = text || (incoming.type === "image" ? incoming.imageDataUrl || incoming.mediaError || "" : "");
    const messageId = `fonnte-${sender}-${createHash("sha1").update(contentKey).digest("hex").slice(0, 16)}`;

    await processInboundWaMessage({ from: normalized.number, messageId, message: incoming });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[wa webhook-fonnte] processing error:", (e as Error).message);
    return NextResponse.json({ success: true });
  }
}
