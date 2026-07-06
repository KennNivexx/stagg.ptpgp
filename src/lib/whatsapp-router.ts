/**
 * WhatsApp bot conversation router — menu dispatch + the two multi-step
 * flows (leave submission, clock-in/out). Pure logic, imported by the
 * webhook route so it stays testable without mocking HTTP.
 */
import { supabaseAdmin } from "@/lib/supabase";
import { sendTextMessage, sendInteractiveButtons } from "@/lib/whatsapp";
import {
  BotEmployee,
  getEmployeeProfileText,
  getMyPayslipsSummaryText,
  getMyTrainingsText,
  getMyLatestKpiText,
  getMyJobDescText,
  getMyWarningsText,
  submitLeaveViaBot,
  clockInViaBot,
  clockOutViaBot,
} from "@/lib/whatsapp-data";

const FLOW_TIMEOUT_MS = 10 * 60 * 1000;

export interface WaConversation {
  id: string;
  employee_id: string;
  wa_number: string;
  current_menu: string | null;
  current_flow: string | null;
  flow_data: Record<string, unknown>;
  last_message_at: string;
}

export interface IncomingWaMessage {
  type: string; // "text" | "interactive" | "image" | ...
  text?: string;
  buttonId?: string;
  // Media is resolved by the provider adapter (Meta webhook route / Baileys
  // listener) BEFORE this reaches the router — each provider downloads media
  // completely differently, so the router only ever sees the end result.
  imageDataUrl?: string;
  mediaError?: string;
}

const MAIN_MENU_TEXT = [
  "*Menu Utama HRIS PT Pratama Galuh Perkasa*",
  "",
  "1. Profil Saya",
  "2. Absen (Clock-in/out)",
  "3. Ajukan Cuti/Izin",
  "4. Slip Gaji",
  "5. Pelatihan Saya",
  "6. KPI & Performa",
  "7. Deskripsi Kerja",
  "8. Surat Peringatan (SP)",
  "",
  "Balas dengan angka 1-8. Ketik *menu* kapan saja untuk kembali ke sini, atau *berhenti* untuk berhenti berlangganan.",
].join("\n");

async function updateConversation(id: string, patch: Record<string, unknown>): Promise<void> {
  await supabaseAdmin
    .from("wa_conversations")
    .update({ ...patch, last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id);
}

async function resetToIdle(conversation: WaConversation): Promise<void> {
  await updateConversation(conversation.id, { current_menu: null, current_flow: null, flow_data: {} });
}

async function optOut(employee: BotEmployee, conversation: WaConversation): Promise<void> {
  await supabaseAdmin.from("employees").update({ wa_opted_out: true }).eq("id", employee.id);
  await sendTextMessage(conversation.wa_number, "Anda telah berhenti berlangganan Bot WA HRIS. Daftarkan kembali kapan saja di Profil Saya pada website.");
}

export async function routeIncomingMessage(
  employee: BotEmployee,
  conversationIn: WaConversation,
  message: IncomingWaMessage,
): Promise<void> {
  let conversation = conversationIn;
  const text = (message.text || message.buttonId || "").trim().toLowerCase();

  if (text === "berhenti" || text === "stop") {
    await optOut(employee, conversation);
    return;
  }
  if (text === "menu") {
    await resetToIdle(conversation);
    await sendTextMessage(conversation.wa_number, MAIN_MENU_TEXT);
    return;
  }
  if ((text === "batal" || text === "cancel") && conversation.current_flow) {
    await resetToIdle(conversation);
    await sendTextMessage(conversation.wa_number, "Dibatalkan.\n\n" + MAIN_MENU_TEXT);
    return;
  }

  // A flow abandoned mid-way shouldn't trap the user forever — reset to idle
  // and treat this message as a fresh main-menu selection instead.
  if (conversation.current_flow) {
    const elapsed = Date.now() - new Date(conversation.last_message_at).getTime();
    if (elapsed > FLOW_TIMEOUT_MS) {
      await resetToIdle(conversation);
      conversation = { ...conversation, current_flow: null, current_menu: null, flow_data: {} };
    }
  }

  if (conversation.current_flow === "leave_submit") {
    await handleLeaveFlow(employee, conversation, text);
    return;
  }
  if (conversation.current_flow === "clock_in") {
    await handleClockInFlow(employee, conversation, message);
    return;
  }

  await handleMainMenu(employee, conversation, text);
}

async function handleMainMenu(employee: BotEmployee, conversation: WaConversation, text: string): Promise<void> {
  const to = conversation.wa_number;
  switch (text) {
    case "1":
    case "profil":
      await sendTextMessage(to, await getEmployeeProfileText(employee.id));
      break;

    case "2":
    case "absen":
      await updateConversation(conversation.id, { current_flow: "clock_in", current_menu: "clockin_photo", flow_data: {} });
      await sendTextMessage(to, "Kirim foto selfie Anda sekarang untuk absen (sistem otomatis mendeteksi clock-in atau clock-out). Ketik *batal* untuk membatalkan.");
      break;

    case "3":
    case "cuti":
    case "izin":
      await updateConversation(conversation.id, { current_flow: "leave_submit", current_menu: "leave_type", flow_data: {} });
      await sendTextMessage(to, "Pilih jenis cuti:\n1. Cuti Tahunan\n2. Sakit\n3. Izin\n\nBalas dengan angka 1-3.");
      break;

    case "4":
    case "gaji":
      await sendTextMessage(to, await getMyPayslipsSummaryText(employee.id));
      break;

    case "5":
    case "pelatihan":
      await sendTextMessage(to, await getMyTrainingsText(employee.id));
      break;

    case "6":
    case "kpi":
    case "performa":
      await sendTextMessage(to, await getMyLatestKpiText(employee.id));
      break;

    case "7":
    case "jobdesc":
    case "deskripsi kerja":
      await sendTextMessage(to, await getMyJobDescText(employee.id));
      break;

    case "8":
    case "sp":
      await sendTextMessage(to, await getMyWarningsText(employee.id));
      break;

    default:
      await sendTextMessage(to, MAIN_MENU_TEXT);
  }
}

const LEAVE_TYPE_OPTIONS: Record<string, string> = { "1": "Cuti Tahunan", "2": "Sakit", "3": "Izin" };
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

async function handleLeaveFlow(employee: BotEmployee, conversation: WaConversation, text: string): Promise<void> {
  const to = conversation.wa_number;
  const step = conversation.current_menu;
  const flowData = conversation.flow_data || {};

  if (step === "leave_type") {
    const type = LEAVE_TYPE_OPTIONS[text];
    if (!type) {
      await sendTextMessage(to, "Pilih jenis cuti dengan angka 1-3, atau ketik *batal*.");
      return;
    }
    await updateConversation(conversation.id, { current_menu: "leave_start", flow_data: { ...flowData, type } });
    await sendTextMessage(to, "Tanggal mulai cuti? (format: YYYY-MM-DD)");
    return;
  }

  if (step === "leave_start") {
    if (!DATE_RE.test(text) || isNaN(new Date(text).getTime())) {
      await sendTextMessage(to, "Format tanggal tidak valid. Gunakan YYYY-MM-DD, contoh: 2026-07-10");
      return;
    }
    await updateConversation(conversation.id, { current_menu: "leave_end", flow_data: { ...flowData, start_date: text } });
    await sendTextMessage(to, "Tanggal selesai cuti? (format: YYYY-MM-DD)");
    return;
  }

  if (step === "leave_end") {
    if (!DATE_RE.test(text) || isNaN(new Date(text).getTime())) {
      await sendTextMessage(to, "Format tanggal tidak valid. Gunakan YYYY-MM-DD.");
      return;
    }
    if (new Date(text) < new Date(flowData.start_date as string)) {
      await sendTextMessage(to, "Tanggal selesai harus setelah tanggal mulai. Coba lagi.");
      return;
    }
    await updateConversation(conversation.id, { current_menu: "leave_reason", flow_data: { ...flowData, end_date: text } });
    await sendTextMessage(to, "Alasan cuti/izin?");
    return;
  }

  if (step === "leave_reason") {
    const updated: Record<string, unknown> = { ...flowData, reason: text };
    await updateConversation(conversation.id, { current_menu: "leave_confirm", flow_data: updated });
    await sendInteractiveButtons(
      to,
      `Konfirmasi pengajuan:\n*Jenis:* ${updated.type as string}\n*Mulai:* ${updated.start_date as string}\n*Selesai:* ${updated.end_date as string}\n*Alasan:* ${text}`,
      [{ id: "leave_yes", title: "Ya, Kirim" }, { id: "leave_no", title: "Batal" }],
    );
    return;
  }

  if (step === "leave_confirm") {
    if (text === "leave_yes" || text === "ya") {
      const result = await submitLeaveViaBot(employee.id, employee.email, employee.full_name, {
        type: flowData.type as string,
        start_date: flowData.start_date as string,
        end_date: flowData.end_date as string,
        reason: flowData.reason as string,
      });
      await resetToIdle(conversation);
      if ("error" in result) {
        await sendTextMessage(to, `Gagal mengajukan cuti: ${result.error}`);
        return;
      }
      await sendTextMessage(to, "Pengajuan cuti berhasil dikirim! HRD akan meninjau permintaan Anda.");
    } else {
      await resetToIdle(conversation);
      await sendTextMessage(to, "Pengajuan cuti dibatalkan.");
    }
    return;
  }
}

async function handleClockInFlow(employee: BotEmployee, conversation: WaConversation, message: IncomingWaMessage): Promise<void> {
  const to = conversation.wa_number;

  if (message.type !== "image") {
    await sendTextMessage(to, "Mohon kirim foto selfie (bukan teks) untuk melanjutkan, atau ketik *batal*.");
    return;
  }
  if (message.mediaError) {
    await sendTextMessage(to, message.mediaError);
    return;
  }
  if (!message.imageDataUrl) {
    await sendTextMessage(to, "Gagal memproses foto. Silakan coba lagi.");
    return;
  }

  // Try clock-in first; if already clocked in today, treat this same photo
  // as a clock-out instead — this is the "automatic" redirect: the employee
  // doesn't have to say which action they mean, the bot infers it.
  const inResult = await clockInViaBot(employee.id, employee.email, employee.full_name, message.imageDataUrl);
  if ("success" in inResult) {
    await resetToIdle(conversation);
    await sendTextMessage(to, `Clock-in berhasil pada ${new Date(inResult.time).toLocaleTimeString("id-ID")}.`);
    return;
  }

  if (inResult.error === "Sudah clock-in hari ini.") {
    const outResult = await clockOutViaBot(employee.id, message.imageDataUrl);
    await resetToIdle(conversation);
    if ("success" in outResult) {
      await sendTextMessage(to, `Clock-out berhasil pada ${new Date(outResult.time).toLocaleTimeString("id-ID")}.`);
    } else {
      await sendTextMessage(to, `Gagal: ${outResult.error}`);
    }
    return;
  }

  await resetToIdle(conversation);
  await sendTextMessage(to, `Gagal memproses absen: ${inResult.error}`);
}
