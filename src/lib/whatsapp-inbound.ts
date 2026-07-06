/**
 * Provider-agnostic inbound message processing — shared by the Meta webhook
 * route and the Baileys listener, so dedup/employee-resolution/conversation
 * bookkeeping only exists once. Each provider adapter is responsible for
 * normalizing its own payload (including resolving any media into a data URL
 * BEFORE calling this, since Meta and Baileys download media completely
 * differently) into a NormalizedInboundMessage, then calling processInboundWaMessage.
 */
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { sendTextMessage } from "@/lib/whatsapp";
import { getEmployeeByWaNumber, markWaConnected } from "@/lib/whatsapp-data";
import { routeIncomingMessage, handleVerificationFlow, WaConversation, IncomingWaMessage } from "@/lib/whatsapp-router";

export interface NormalizedInboundMessage {
  /** Sender's WA number, digits only (e.g. "6281234567890"). */
  from: string;
  /** Provider-specific unique message id, used as the wa_message_log dedup key. */
  messageId: string;
  message: IncomingWaMessage;
}

export async function processInboundWaMessage(msg: NormalizedInboundMessage): Promise<void> {
  const { from, messageId, message } = msg;

  // Idempotency guard: a provider may redeliver the same message (Meta
  // retries on non-2xx/slow responses; Baileys can replay on reconnect).
  // wa_message_id is the provider's own id — a UNIQUE conflict here IS the
  // "already processed" signal.
  const { error: insertErr } = await supabaseAdmin.from("wa_message_log").insert({
    id: "wamsg-" + randomUUID(),
    wa_message_id: messageId,
    wa_number: from,
    direction: "inbound",
    message_type: message.type,
    payload: message as unknown as Record<string, unknown>,
  });
  if (insertErr?.code === "23505") {
    return; // already processed
  }
  if (insertErr && insertErr.code !== "42P01" && insertErr.code !== "PGRST205") {
    console.error("[wa inbound] log insert error:", insertErr.message);
  }

  const employee = await getEmployeeByWaNumber(from);
  if (!employee) {
    const text = (message.text || message.buttonId || "").trim();
    if (message.type !== "text" || !text) {
      await sendTextMessage(from, "Mohon kirim pesan teks untuk verifikasi.");
      return;
    }
    const verified = await handleVerificationFlow(from, text);
    if (!verified) return;

    const id = "wac-" + randomUUID();
    try {
      await supabaseAdmin.from("wa_conversations").upsert(
        { id, employee_id: verified.id, wa_number: from, current_menu: null, current_flow: null, flow_data: {} },
        { onConflict: "employee_id" },
      );
    } catch (e) {
      console.error("[wa inbound] conversation insert error:", (e as Error).message);
    }
    return;
  }

  if (employee.wa_opted_out) {
    await sendTextMessage(from, "Anda sudah berhenti berlangganan Bot WA HRIS. Hubungi HRD untuk mengaktifkan kembali.");
    return;
  }

  if (!employee.wa_connected_at) {
    try { await markWaConnected(employee.id); } catch { /* non-critical */ }
  }

  const { data: existingConv } = await supabaseAdmin
    .from("wa_conversations")
    .select("*")
    .eq("employee_id", employee.id)
    .maybeSingle();

  let conversation: WaConversation;
  if (existingConv) {
    conversation = existingConv as WaConversation;
  } else {
    const id = "wac-" + randomUUID();
    try {
      await supabaseAdmin.from("wa_conversations").upsert(
        { id, employee_id: employee.id, wa_number: from, current_menu: null, current_flow: null, flow_data: {} },
        { onConflict: "employee_id" },
      );
    } catch (e) {
      console.error("[wa inbound] conversation insert error:", (e as Error).message);
    }
    conversation = {
      id, employee_id: employee.id, wa_number: from,
      current_menu: null, current_flow: null, flow_data: {},
      last_message_at: new Date().toISOString(),
    };
  }

  await routeIncomingMessage(employee, conversation, message);
}
