import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { downloadMediaAsBase64Meta } from "@/lib/whatsapp";
import { IncomingWaMessage } from "@/lib/whatsapp-router";
import { processInboundWaMessage } from "@/lib/whatsapp-inbound";

async function getWebhookSecrets(): Promise<{ appSecret: string; verifyToken: string }> {
  try {
    const { data } = await supabaseAdmin
      .from("system_settings")
      .select("key, value")
      .in("key", ["wa_app_secret", "wa_webhook_verify_token"]);
    const map = Object.fromEntries((data || []).map((r: { key: string; value: string }) => [r.key, r.value]));
    return {
      appSecret: map.wa_app_secret || process.env.WA_APP_SECRET || "",
      verifyToken: map.wa_webhook_verify_token || process.env.WA_WEBHOOK_VERIFY_TOKEN || "",
    };
  } catch {
    return {
      appSecret: process.env.WA_APP_SECRET || "",
      verifyToken: process.env.WA_WEBHOOK_VERIFY_TOKEN || "",
    };
  }
}

/** Meta's verification handshake when the webhook URL is registered. */
export async function GET(request: NextRequest) {
  const { verifyToken } = await getWebhookSecrets();
  const mode = request.nextUrl.searchParams.get("hub.mode");
  const token = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge");

  // Fail closed: no verify token configured means the handshake can't be
  // trusted, not that it should auto-succeed.
  if (!verifyToken) {
    return new NextResponse("WhatsApp webhook belum dikonfigurasi.", { status: 403 });
  }
  if (mode === "subscribe" && token === verifyToken && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

/** Inbound message/status events from Meta. */
export async function POST(request: NextRequest) {
  // Read as raw text FIRST — signature verification must hash the exact
  // bytes Meta sent, not a re-serialized JSON object.
  const rawBody = await request.text();

  const { appSecret } = await getWebhookSecrets();
  if (!appSecret) {
    console.error("[wa webhook] wa_app_secret not configured — rejecting all requests (fail closed)");
    return NextResponse.json({ error: "Not configured" }, { status: 401 });
  }

  const signatureHeader = request.headers.get("x-hub-signature-256") || "";
  const expectedSignature = "sha256=" + createHmac("sha256", appSecret).update(rawBody).digest("hex");
  const sigBuf = Buffer.from(signatureHeader);
  const expBuf = Buffer.from(expectedSignature);
  const validSignature = sigBuf.length === expBuf.length && timingSafeEqual(sigBuf, expBuf);
  if (!validSignature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    // Malformed body — nothing we can do with it, but still ack so Meta
    // doesn't keep retrying a request that will never parse.
    return NextResponse.json({ success: true });
  }

  try {
    const entry = (payload?.entry as Array<Record<string, unknown>> | undefined)?.[0];
    const change = (entry?.changes as Array<Record<string, unknown>> | undefined)?.[0];
    const value = change?.value as Record<string, unknown> | undefined;

    // Delivery/read/failed status callbacks — acknowledge, no bot logic in v1.
    if ((value?.statuses as unknown[] | undefined)?.length) {
      return NextResponse.json({ success: true });
    }

    const msg = (value?.messages as Array<Record<string, unknown>> | undefined)?.[0];
    if (!msg) {
      return NextResponse.json({ success: true });
    }

    const waMessageId = msg.id as string;
    const from = msg.from as string;

    const incoming: IncomingWaMessage = { type: msg.type as string };
    const msgType = msg.type as string;
    if (msgType === "text") {
      incoming.text = (msg.text as Record<string, unknown> | undefined)?.body as string | undefined;
    } else if (msgType === "interactive") {
      incoming.buttonId = ((msg.interactive as Record<string, unknown> | undefined)?.button_reply as Record<string, unknown> | undefined)?.id as string | undefined;
    } else if (msgType === "button") {
      incoming.buttonId = (msg.button as Record<string, unknown> | undefined)?.payload as string | undefined;
    } else if (msgType === "image") {
      const mediaId = (msg.image as Record<string, unknown> | undefined)?.id as string | undefined;
      const media = mediaId ? await downloadMediaAsBase64Meta(mediaId) : { error: "Foto tidak ditemukan pada pesan." };
      if ("error" in media) {
        incoming.mediaError = media.error;
      } else {
        incoming.imageDataUrl = media.dataUrl;
      }
    }

    await processInboundWaMessage({ from, messageId: waMessageId, message: incoming });

    return NextResponse.json({ success: true });
  } catch (e) {
    // Ack anyway — a bug on our side shouldn't cause Meta to retry-storm
    // the same broken payload indefinitely.
    console.error("[wa webhook] processing error:", (e as Error).message);
    return NextResponse.json({ success: true });
  }
}
