/**
 * Unofficial WhatsApp provider for demo use before Meta business approval
 * comes through — pairs with a real WhatsApp account by scanning a QR code
 * (like WhatsApp Web), no Meta app/template/approval needed.
 *
 * This holds a persistent WebSocket connection, so it only makes sense as a
 * long-lived in-process singleton (works for this app's single-instance
 * self-hosted deployment; would NOT work across multiple serverless
 * instances). State is kept on `globalThis` so Next.js's dev-mode module
 * reloading (Turbopack HMR) doesn't spawn a second competing socket.
 *
 * Deliberately has NO static import of whatsapp.ts or whatsapp-inbound.ts —
 * those import from here (dispatcher pattern), so any static cross-import
 * would form a cycle. The inbound processor is loaded with a dynamic
 * import() inside the message handler instead, which sidesteps that.
 */
import path from "path";
import fs from "fs/promises";
import QRCode from "qrcode";
import { supabaseAdmin } from "@/lib/supabase";
import type { NormalizedInboundMessage } from "@/lib/whatsapp-inbound";
import type { IncomingWaMessage } from "@/lib/whatsapp-router";

const AUTH_DIR = path.join(process.cwd(), ".baileys_auth");

export type BaileysStatus = "disconnected" | "connecting" | "qr" | "connected";

interface BaileysState {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sock: any;
  status: BaileysStatus;
  qrDataUrl: string | null;
  connectedNumber: string | null;
  starting: Promise<void> | null;
}

function getGlobalState(): BaileysState {
  const g = globalThis as unknown as { __waBaileysState?: BaileysState };
  if (!g.__waBaileysState) {
    g.__waBaileysState = { sock: null, status: "disconnected", qrDataUrl: null, connectedNumber: null, starting: null };
  }
  return g.__waBaileysState;
}

async function saveBotNumber(number: string): Promise<void> {
  const { data } = await supabaseAdmin.from("system_settings").select("value").eq("key", "wa_bot_number").maybeSingle();
  if (data?.value) return;
  await supabaseAdmin.from("system_settings").upsert({ key: "wa_bot_number", value: number }, { onConflict: "key" });
}

/** Digits-only JID -> "628xxxxxxx" (strips the ":device" suffix and @domain). */
function jidToDigits(jid: string): string {
  return jid.split("@")[0].split(":")[0];
}

async function handleIncomingMessages(messages: unknown[]): Promise<void> {
  const { processInboundWaMessage } = await import("@/lib/whatsapp-inbound");
  const state = getGlobalState();

  for (const raw of messages) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const m = raw as any;
    if (!m?.message || m.key?.fromMe) continue; // ignore our own echoed messages
    const remoteJid = m.key?.remoteJid as string | undefined;
    if (!remoteJid || remoteJid.endsWith("@g.us") || remoteJid === "status@broadcast") continue; // groups/status not supported

    const from = jidToDigits(remoteJid);
    const messageId = m.key?.id as string;
    if (!messageId) continue;

    const incoming: IncomingWaMessage = { type: "text" };
    const content = m.message;
    if (content.conversation) {
      incoming.text = content.conversation as string;
    } else if (content.extendedTextMessage?.text) {
      incoming.text = content.extendedTextMessage.text as string;
    } else if (content.buttonsResponseMessage?.selectedButtonId) {
      incoming.type = "interactive";
      incoming.buttonId = content.buttonsResponseMessage.selectedButtonId as string;
    } else if (content.imageMessage) {
      incoming.type = "image";
      try {
        const { downloadMediaMessage } = await import("@whiskeysockets/baileys");
        const buffer = (await downloadMediaMessage(m, "buffer", {}, {
          reuploadRequest: state.sock?.updateMediaMessage,
          logger: state.sock?.logger,
        })) as Buffer;
        const mimeType = (content.imageMessage.mimetype as string) || "image/jpeg";
        incoming.imageDataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;
      } catch (e) {
        console.error("[wa baileys] media download error:", (e as Error).message);
        incoming.mediaError = "Gagal mengunduh foto dari WhatsApp.";
      }
    } else {
      continue; // unsupported message type (audio/video/document/location/...)
    }

    const normalized: NormalizedInboundMessage = { from, messageId, message: incoming };
    try {
      await processInboundWaMessage(normalized);
    } catch (e) {
      console.error("[wa baileys] processInboundWaMessage error:", (e as Error).message);
    }
  }
}

async function connect(): Promise<void> {
  const state = getGlobalState();
  const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason,
  } = await import("@whiskeysockets/baileys");

  await fs.mkdir(AUTH_DIR, { recursive: true });
  // Not a React hook — Baileys names its auth-state loader with a "use" prefix,
  // which trips the react-hooks lint rule as a false positive.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { state: authState, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  state.status = "connecting";
  const sock = makeWASocket({
    version,
    auth: authState,
    printQRInTerminal: false,
    syncFullHistory: false,
  });
  state.sock = sock;

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update: Record<string, unknown>) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      state.status = "qr";
      state.qrDataUrl = await QRCode.toDataURL(qr as string);
    }

    if (connection === "open") {
      state.status = "connected";
      state.qrDataUrl = null;
      const rawId = sock.user?.id as string | undefined;
      if (rawId) {
        const number = jidToDigits(rawId);
        state.connectedNumber = number;
        await saveBotNumber(number);
      }
    }

    if (connection === "close") {
      const statusCode = (lastDisconnect as { error?: unknown } | undefined)?.error
        ? ((lastDisconnect as { error: { output?: { statusCode?: number } } }).error?.output?.statusCode)
        : undefined;
      const loggedOut = statusCode === (DisconnectReason?.loggedOut ?? 401);
      state.sock = null;
      state.qrDataUrl = null;
      state.connectedNumber = null;
      if (loggedOut) {
        state.status = "disconnected";
        await fs.rm(AUTH_DIR, { recursive: true, force: true }).catch(() => {});
      } else {
        // Transient disconnect (network blip, server restart) — auto-reconnect
        // using the same saved credentials, no new QR scan needed.
        state.status = "connecting";
        connect().catch((e) => console.error("[wa baileys] reconnect error:", (e as Error).message));
      }
    }
  });

  sock.ev.on("messages.upsert", (upsert: { messages: unknown[]; type: string }) => {
    if (upsert.type !== "notify") return;
    handleIncomingMessages(upsert.messages).catch((e) => console.error("[wa baileys] message handling error:", (e as Error).message));
  });
}

export async function getBaileysStatus(): Promise<{ status: BaileysStatus; qrDataUrl: string | null; number: string | null }> {
  const state = getGlobalState();
  return { status: state.status, qrDataUrl: state.qrDataUrl, number: state.connectedNumber };
}

/** Idempotent — if a connection attempt is already in flight or connected, just returns current status. */
export async function startBaileysConnection(): Promise<{ status: BaileysStatus; qrDataUrl: string | null; number: string | null }> {
  const state = getGlobalState();
  if (state.status === "connected" || state.status === "connecting" || state.status === "qr") {
    return getBaileysStatus();
  }
  if (!state.starting) {
    state.starting = connect().finally(() => { state.starting = null; });
  }
  await state.starting;
  return getBaileysStatus();
}

export async function disconnectBaileysSession(): Promise<void> {
  const state = getGlobalState();
  try {
    await state.sock?.logout();
  } catch {
    // already disconnected / socket gone — fine, we clear state regardless
  }
  state.sock = null;
  state.status = "disconnected";
  state.qrDataUrl = null;
  state.connectedNumber = null;
  await fs.rm(AUTH_DIR, { recursive: true, force: true }).catch(() => {});
}

/** `to` must already be digits-only (e.g. "6281234567890") — no @s.whatsapp.net suffix. */
export async function sendBaileysText(to: string, body: string): Promise<{ success: true } | { error: string }> {
  const state = getGlobalState();
  if (state.status !== "connected" || !state.sock) {
    return { error: "Bot WhatsApp (mode demo) belum terhubung. Scan QR code di halaman Pengaturan Admin." };
  }
  try {
    await state.sock.sendMessage(`${to}@s.whatsapp.net`, { text: body });
    return { success: true };
  } catch (e) {
    console.error("[wa baileys] send error:", (e as Error).message);
    return { error: "Gagal mengirim pesan WhatsApp (mode demo)." };
  }
}
