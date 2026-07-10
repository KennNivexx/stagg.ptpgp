/**
 * WhatsApp outbound dispatcher. Server-only — never import from client
 * components. Three providers exist: Meta's official Cloud API (this file),
 * Baileys, an unofficial QR-paired library (whatsapp-baileys.ts), and Fonnte
 * (whatsapp-fonnte.ts), a third-party Indonesian WhatsApp gateway that's
 * QR-based like Baileys but doesn't need a persistent self-hosted socket —
 * Fonnte hosts the connection on their own servers. `pengaturan_sistem.wa_provider`
 * ("meta" | "baileys" | "fonnte", defaults to "baileys" since that's usable
 * with zero setup) picks which one sendTextMessage/sendInteractiveButtons
 * actually use — callers (whatsapp-router.ts) never need to know which is active.
 *
 * Meta credentials follow the tiered pattern used by mailer.ts:
 * pengaturan_sistem (set by HRD via /hrd/admin/settings) first, falling back
 * to env vars, defaulting to empty string — failures surface only when a
 * send is actually attempted, with a friendly Indonesian error.
 *
 * No static import of whatsapp-baileys.ts here — dynamic import() is used
 * instead so the two files don't form a static circular dependency (baileys.ts
 * dynamically imports whatsapp-inbound.ts, which imports this file).
 */
import { supabaseAdmin } from "@/lib/supabase";

export type WaProvider = "meta" | "baileys" | "fonnte";

export async function getWaProvider(): Promise<WaProvider> {
  try {
    const { data } = await supabaseAdmin.from("pengaturan_sistem").select("value").eq("key", "wa_provider").maybeSingle();
    if (data?.value === "meta") return "meta";
    if (data?.value === "fonnte") return "fonnte";
    return "baileys";
  } catch {
    return "baileys";
  }
}

interface WaConfig {
  phoneNumberId: string;
  accessToken: string;
  apiVersion: string;
  templateName: string;
  templateLang: string;
  botNumber: string;
}

async function getWaConfig(): Promise<WaConfig> {
  try {
    const { data } = await supabaseAdmin
      .from("pengaturan_sistem")
      .select("key, value")
      .in("key", ["wa_phone_number_id", "wa_access_token", "wa_api_version", "wa_template_name", "wa_template_lang", "wa_bot_number"]);
    const map = Object.fromEntries((data || []).map((r: { key: string; value: string }) => [r.key, r.value]));
    return {
      phoneNumberId: map.wa_phone_number_id || process.env.WA_PHONE_NUMBER_ID || "",
      accessToken: map.wa_access_token || process.env.WA_ACCESS_TOKEN || "",
      apiVersion: map.wa_api_version || process.env.WA_API_VERSION || "v21.0",
      templateName: map.wa_template_name || process.env.WA_TEMPLATE_NAME || "",
      templateLang: map.wa_template_lang || process.env.WA_TEMPLATE_LANG || "id",
      botNumber: map.wa_bot_number || process.env.WA_BOT_NUMBER || "",
    };
  } catch {
    return {
      phoneNumberId: process.env.WA_PHONE_NUMBER_ID || "",
      accessToken: process.env.WA_ACCESS_TOKEN || "",
      apiVersion: process.env.WA_API_VERSION || "v21.0",
      templateName: process.env.WA_TEMPLATE_NAME || "",
      templateLang: process.env.WA_TEMPLATE_LANG || "id",
      botNumber: process.env.WA_BOT_NUMBER || "",
    };
  }
}

/**
 * Employee-initiates-first flow: Meta only requires a pre-approved template
 * for BUSINESS-initiated messages. If the employee sends the first message,
 * the bot can reply freely with no template and no messaging cost. This
 * builds a wa.me link (prefilled text, one tap to send) so the employee's
 * "first message" is a single click rather than typing from scratch.
 * Returns null if HRD hasn't configured the bot's public number yet.
 */
export async function getWaBotContactUrl(prefilledText = "Aktifkan Bot HRIS saya"): Promise<string | null> {
  const config = await getWaConfig();
  if (!config.botNumber) return null;
  return `https://wa.me/${config.botNumber}?text=${encodeURIComponent(prefilledText)}`;
}

/**
 * Indonesian mobile numbers may arrive as 08xx (local), 8xx (missing the
 * leading 0), or 62xx (already international) — normalize all to the
 * "62xxxxxxxxxx" form Meta's API and our `employees.wa_number` column expect.
 */
export function normalizeWaNumber(raw: string): { number: string } | { error: string } {
  const cleaned = raw.replace(/[^0-9]/g, "");
  const normalized = cleaned.startsWith("0") ? "62" + cleaned.slice(1)
    : cleaned.startsWith("62") ? cleaned
    : cleaned.startsWith("8") ? "62" + cleaned
    : cleaned;
  if (!/^62\d{8,13}$/.test(normalized)) {
    return { error: "Format nomor WhatsApp tidak valid." };
  }
  return { number: normalized };
}

async function logOutboundMessage(to: string, messageType: string, messageId: string, payload: Record<string, unknown>) {
  const { error } = await supabaseAdmin.from("log_pesan_wa").insert({
    id: "wamsg-" + crypto.randomUUID(),
    wa_message_id: messageId,
    wa_number: to,
    direction: "outbound",
    message_type: messageType,
    payload,
  });
  // 23505 = unique_violation on wa_message_id — a duplicate log entry is
  // harmless (idempotency is about processing, not logging). 42P01/PGRST205
  // = table not migrated yet — also non-fatal, everything else is worth
  // knowing about.
  if (error && error.code !== "23505" && error.code !== "42P01" && error.code !== "PGRST205") {
    console.error("[whatsapp] logOutboundMessage error:", error.message);
  }
}

async function callWaApi(payload: Record<string, unknown>): Promise<{ success: true; messageId: string } | { error: string }> {
  const config = await getWaConfig();
  if (!config.phoneNumberId || !config.accessToken) {
    return { error: "WhatsApp belum dikonfigurasi oleh admin. Hubungi HRD/Superadmin." };
  }

  try {
    const res = await fetch(`https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.accessToken}`,
      },
      body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
    });
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("[whatsapp] callWaApi error:", res.status, JSON.stringify(json));
      const message = json?.error?.message as string | undefined;
      return { error: message || "Gagal mengirim pesan WhatsApp. Silakan coba lagi." };
    }

    const messageId = json?.messages?.[0]?.id || "";
    if (messageId) {
      await logOutboundMessage(payload.to as string, payload.type as string, messageId, payload);
    }
    return { success: true, messageId };
  } catch (e) {
    console.error("[whatsapp] callWaApi network error:", (e as Error).message);
    return { error: "Gagal menghubungi WhatsApp API. Periksa koneksi server dan coba lagi." };
  }
}

/** First-contact / re-engagement message — the only type Meta allows a
 * business to send without the recipient having messaged first, and only
 * using a pre-approved Message Template. */
export async function sendTemplateMessage(
  to: string,
  params: string[] = [],
  templateName?: string,
  templateLang?: string,
): Promise<{ success: true; messageId: string } | { error: string }> {
  const config = await getWaConfig();
  const name = templateName || config.templateName;
  const lang = templateLang || config.templateLang;
  if (!name) {
    return { error: "Template pesan WhatsApp belum dikonfigurasi oleh admin." };
  }
  return callWaApi({
    to,
    type: "template",
    template: {
      name,
      language: { code: lang },
      ...(params.length > 0
        ? { components: [{ type: "body", parameters: params.map((p) => ({ type: "text", text: p })) }] }
        : {}),
    },
  });
}

/** Free-form text — only valid within Meta's 24h session window (i.e. after
 * the recipient has replied at least once). Meta-only implementation; use
 * the exported `sendTextMessage` dispatcher below for provider-agnostic sends. */
async function sendTextMessageMeta(to: string, body: string): Promise<{ success: true; messageId: string } | { error: string }> {
  return callWaApi({ to, type: "text", text: { body, preview_url: false } });
}

/** Interactive button prompt — Meta caps this at 3 buttons, 20 chars/title. */
async function sendInteractiveButtonsMeta(
  to: string,
  bodyText: string,
  buttons: { id: string; title: string }[],
): Promise<{ success: true; messageId: string } | { error: string }> {
  return callWaApi({
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: bodyText },
      action: {
        buttons: buttons.slice(0, 3).map((b) => ({ type: "reply", reply: { id: b.id, title: b.title.slice(0, 20) } })),
      },
    },
  });
}

/** Provider-agnostic — sends via whichever of Meta/Baileys/Fonnte is configured. */
export async function sendTextMessage(to: string, body: string): Promise<{ success: true } | { error: string }> {
  const provider = await getWaProvider();
  let result: { success: true } | { error: string };
  if (provider === "meta") {
    result = await sendTextMessageMeta(to, body);
  } else if (provider === "fonnte") {
    const { sendFonnteText } = await import("@/lib/whatsapp-fonnte");
    result = await sendFonnteText(to, body);
  } else {
    const { sendBaileysText } = await import("@/lib/whatsapp-baileys");
    result = await sendBaileysText(to, body);
  }
  if ("error" in result) {
    console.error("[whatsapp] sendTextMessage error:", result.error);
  }
  return result;
}

/** Provider-agnostic confirm/cancel-style prompt. Baileys and Fonnte have no
 * reliable interactive-button rendering for unofficial clients, so both fall
 * back to a numbered plain-text list — the router already accepts the
 * button's own id or its lowercased title as a reply (e.g. "ya"/"leave_yes"),
 * so this fallback needs no router changes. */
export async function sendInteractiveButtons(
  to: string,
  bodyText: string,
  buttons: { id: string; title: string }[],
): Promise<{ success: true } | { error: string }> {
  const provider = await getWaProvider();
  if (provider === "meta") return sendInteractiveButtonsMeta(to, bodyText, buttons);
  const optionsText = buttons.map((b, i) => `${i + 1}. ${b.title} (balas: *${b.title.toLowerCase()}*)`).join("\n");
  if (provider === "fonnte") {
    const { sendFonnteText } = await import("@/lib/whatsapp-fonnte");
    return sendFonnteText(to, `${bodyText}\n\n${optionsText}`);
  }
  const { sendBaileysText } = await import("@/lib/whatsapp-baileys");
  return sendBaileysText(to, `${bodyText}\n\n${optionsText}`);
}

/** Downloads a media attachment (e.g. a clock-in selfie) sent by the user
 * via Meta. Meta's API is two hops: resolve the media id to a short-lived
 * URL, then fetch that URL (both requests need the Bearer token). Returns a
 * data:image/... base64 string in the exact shape clockInForEmployee expects.
 * Meta-only — the webhook route is the only caller (Baileys resolves media
 * itself before it ever reaches shared/provider-agnostic code). */
export async function downloadMediaAsBase64Meta(mediaId: string): Promise<{ dataUrl: string } | { error: string }> {
  const config = await getWaConfig();
  if (!config.accessToken) return { error: "WhatsApp belum dikonfigurasi oleh admin." };

  try {
    const metaRes = await fetch(`https://graph.facebook.com/${config.apiVersion}/${mediaId}`, {
      headers: { Authorization: `Bearer ${config.accessToken}` },
    });
    const meta = await metaRes.json().catch(() => ({}));
    if (!metaRes.ok || !meta?.url) {
      console.error("[whatsapp] downloadMediaAsBase64 metadata error:", JSON.stringify(meta));
      return { error: "Gagal mengambil foto dari WhatsApp." };
    }

    const fileRes = await fetch(meta.url, { headers: { Authorization: `Bearer ${config.accessToken}` } });
    if (!fileRes.ok) return { error: "Gagal mengunduh foto dari WhatsApp." };
    const buffer = Buffer.from(await fileRes.arrayBuffer());
    const mimeType = (meta.mime_type as string) || "image/jpeg";
    return { dataUrl: `data:${mimeType};base64,${buffer.toString("base64")}` };
  } catch (e) {
    console.error("[whatsapp] downloadMediaAsBase64 error:", (e as Error).message);
    return { error: "Gagal mengunduh foto dari WhatsApp. Silakan coba lagi." };
  }
}
