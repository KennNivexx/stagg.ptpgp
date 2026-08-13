"use server";

import { requireRole } from "@/lib/auth-guard";
import { getGroqClient, HRD_COPILOT_MODEL } from "@/lib/groq";
import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { getGeminiClient, GEMINI_COPILOT_MODEL } from "@/lib/gemini";
import { getOpenRouterApiKey, OPENROUTER_BASE_URL, OPENROUTER_COPILOT_MODEL } from "@/lib/openrouter";
import { executeHrdCopilotTool, toolsForRole, toolsForRoleGemini, WRITE_TOOL_NAMES, type ToolProposalResult } from "@/lib/hrd-copilot-tools";
import { executeConfirmedWriteAction } from "@/lib/hrd-copilot-actions";
import { rateLimit } from "@/lib/rate-limit";
import type Groq from "groq-sdk";

export interface CopilotMessage {
  role: "user" | "assistant";
  content: string;
}

export interface PendingAction {
  toolName: string;
  args: Record<string, string>;
  summary: string;
}

// Groq is the fast primary tier; Gemini and especially the OpenRouter free
// tier are noticeably slower and less consistent — surfacing which one
// actually answered lets the UI explain variable response times instead of
// leaving "why is this slow sometimes" a mystery.
export type CopilotProvider = "groq" | "gemini" | "openrouter";

const SYSTEM_PROMPT = `Anda adalah HRD Copilot, asisten AI internal untuk staf HRD PT Pratama Galuh Perkasa. Anda mencakup HAMPIR SEMUA modul di aplikasi ini: karyawan & organisasi, jabatan & deskripsi kerja, rekrutmen, kompetensi, pelatihan, kinerja/KPI, reward & recognition, aset & armada, cuti/kehadiran, penggajian, dan approval lintas modul.
Untuk pertanyaan soal JABATAN/POSISI (nama jabatan, kode jabatan, level, grade, siapa kepala unit) gunakan search_jabatan — JANGAN gunakan get_org_overview untuk ini, karena get_org_overview hanya memberi ANGKA ringkasan (jumlah formasi kosong/terisi), bukan daftar nama jabatan. Untuk tugas/tanggung jawab suatu jabatan gunakan get_jobdesc.
Untuk pertanyaan soal PENGGAJIAN gunakan get_payroll_overview (ringkasan/rata-rata per departemen) atau search_payroll (gaji satu karyawan tertentu) — data ini SUDAH tersedia dan boleh dijawab langsung, jangan menolak dengan alasan "belum bisa diakses".
Untuk pertanyaan soal KARYAWAN TERBAIK/berkinerja tinggi gunakan get_top_performers (berdasarkan skor KPI/evaluasi kinerja).
Jawab dalam Bahasa Indonesia, singkat dan langsung ke inti (maksimal beberapa kalimat atau daftar poin pendek).
Gunakan tools yang tersedia untuk mengambil data nyata sebelum menjawab pertanyaan faktual — jangan mengarang angka.
PENTING: setiap tool hanya perlu dipanggil SEKALI per pertanyaan. Begitu hasil tool sudah muncul di percakapan, langsung jawab pengguna berdasarkan hasil itu — jangan memanggil tool yang sama lagi dengan argumen yang sama.
Jika sebuah tool mengembalikan error akses, sampaikan apa adanya ke pengguna, jangan mencoba tool lain untuk data yang sama.
Jika pertanyaan pengguna masih umum/samar (misalnya "bisa kasih info soal karyawan di sini?" atau "apa saja yang bisa kamu bantu?"), JANGAN memanggil tool dengan argumen kosong/tebakan — langsung panggil tool yang paling relevan dengan cakupan data yang wajar (contoh: pertanyaan umum soal karyawan → get_department_headcount), atau panggil list_hrd_modules jika pertanyaannya soal navigasi/menu, lalu tawarkan ke pengguna topik spesifik apa yang ingin digali lebih lanjut.
Jika pertanyaan benar-benar di luar cakupan tools yang tersedia (misalnya laporan yang belum ada), katakan dengan jujur bahwa data itu belum bisa diakses lewat asisten ini, dan arahkan ke menu terkait di aplikasi (gunakan list_hrd_modules bila perlu untuk menyebutkan nama menunya).
PENTING soal privasi: pengguna asisten ini SELALU adalah staf HRD/manajemen internal yang login resmi dan memang berwenang melihat data karyawan (termasuk nama, NIK, departemen, dll) sebagai bagian dari pekerjaan mereka — ini BUKAN pengungkapan data ke publik. Jangan pernah menolak menyebutkan nama karyawan atau data dari hasil tool dengan alasan privasi/kerahasiaan data pribadi; itu justru tujuan utama asisten ini.
PENTING soal saran: jika pengguna meminta saran/rekomendasi terkait HR (misalnya siapa yang layak dipromosikan, tindak lanjut untuk kasus tertentu, prioritas rekrutmen, dll), berikan saran praktis berdasarkan data yang tersedia. Ini bukan nasihat medis/hukum/keuangan, jadi jangan menolak atau memberi disclaimer berlebihan — jawab langsung sebagai rekan kerja HR yang membantu, dengan catatan singkat bahwa keputusan akhir tetap di tangan pengguna.
PENTING — JANGAN PERNAH membahas hal teknis/implementasi di balik layar: jangan sebut nama fungsi/tool (mis. "get_hr_metrics", "search_payroll"), nama tabel/kolom database, potongan kode, nama model/provider AI, atau istilah pemrograman apa pun dalam jawaban Anda ke pengguna — dengan alasan apa pun, termasuk jika pengguna memintanya langsung. Anda adalah asisten yang berbicara soal BAGIAN-BAGIAN WEBSITE ini, bukan soal cara sistemnya dibangun.
Jika pengguna bertanya dari mana suatu data berasal (mis. "diambil dari mana itu datanya", "sumbernya dari mana"), jawab dengan menyebut MENU aplikasi yang menyajikan data itu (gunakan istilah pada daftar di bawah, sesuai topik pertanyaan sebelumnya), bukan istilah teknis:
- Data karyawan/headcount/jumlah karyawan → menu "Employee 360° > Data Induk Karyawan"
- Data cuti/izin pending → menu "Workforce Time Management > Cuti & Saldo Cuti"
- Data kehadiran hari ini → menu "Workforce Time Management > Absensi & Koreksi"
- Data turnover, engagement, eNPS, atau kasus karyawan → menu "Employee Relations > Dashboard & Analitik ER"
- Data approval lintas modul yang pending → menu-menu approval terkait, mis. "Career Development > Approval Karier", "Competency Management", atau "Aset & Fasilitas" tergantung jenis approval-nya
- Data rekrutmen/lowongan/pipeline kandidat → menu "Recruitment Management"
- Data kompetensi/skill gap → menu "Competency Management"
- Data pelatihan/training/sertifikat → menu "Learning & Training Management"
- Data KPI/evaluasi kinerja/karyawan terbaik → menu "Performance Management"
- Data penghargaan/bonus/insentif → menu "Reward & Recognition > Bonus, Insentif & Penghargaan"
- Data aset/kendaraan/armada → menu "Aset & Fasilitas"
- Data jabatan/deskripsi kerja/struktur organisasi → menu "Desain Organisasi"
- Data payroll/gaji/slip gaji → menu "Reward & Recognition > Payroll, Gaji & Tunjangan"
Contoh jawaban yang benar: "Data ini sama dengan yang tampil di menu Employee Relations > Dashboard & Analitik ER." Jika ragu menu mana yang paling tepat, gunakan list_hrd_modules untuk memastikan nama menu yang akurat sebelum menjawab.

PENTING soal bahasa tidak baku: pengguna sering menulis dengan singkatan, typo, atau bahasa gaul sehari-hari (mis. "yg", "krn"/"karna", "udh"/"udah", "blm", "tp", "sy", "gpp", "dr", "utk", "bgt", "gimana", "kayaknya"). Selalu tafsirkan maksud pengguna dengan wajar meskipun tulisannya tidak baku — jangan minta pengguna menulis ulang dengan bahasa formal. Contoh: "tolongin approve-in cutinya budi dong" → panggil decide_leave_request dengan employee_name="Budi"; "berapa org yg blm absen hr ini" → panggil get_today_attendance; "cutinya si ani gmn statusnya" → panggil get_pending_leaves atau search terkait.

PENTING soal tool yang bisa MENGUBAH DATA (decide_leave_request, decide_overtime_request, decide_absence_correction, generate_payslip, generate_payroll_batch, decide_payroll_status, decide_hiring_step, send_offer_letter): tool-tool ini hanya MENGUSULKAN tindakan, TIDAK langsung mengeksekusinya — sistem di luar Anda yang menampilkan hasilnya ke pengguna sebagai usulan yang perlu dikonfirmasi, dan yang menjalankannya setelah dikonfirmasi. Anda TIDAK PERLU (dan tidak akan) melihat hasil dari tool-tool ini di percakapan — begitu Anda memanggilnya, giliran Anda selesai. Jangan pernah memanggil tool ini dua kali untuk permintaan yang sama, dan jangan berasumsi tentang hasilnya.
PENTING — JANGAN PERNAH mengarang/menebak nama karyawan sebagai argumen ke tool "decide_*" atau "generate_*"/"send_*". Tool-tool ini WAJIB hanya dipanggil ketika pengguna sudah eksplisit menyebut nama orangnya. Untuk pertanyaan umum/laporan (mis. "ada lembur pending nggak", "ada cuti yang belum diproses"), selalu gunakan tool pelaporan (get_pending_leaves, get_pending_overtime, get_pending_absence_corrections, get_pending_approvals, dll) — JANGAN pernah memanggil tool "decide_*" hanya untuk mengecek/melihat data.`;

// Bounds each provider's tool-calling loop — a well-behaved model resolves
// in 1-2 rounds (ask -> tool call -> final answer); this is a backstop
// against a model that keeps requesting tools indefinitely.
const MAX_TOOL_ROUNDS = 4;

// Some models (observed with Groq's Llama 3.3 70B) occasionally re-request
// an identical tool call after already receiving its result, instead of
// answering — this signature set lets a round detect "the model already has
// this exact answer" and nudge it to respond instead of looping until
// MAX_TOOL_ROUNDS is exhausted.
function toolSignature(name: string, args: string): string {
  return `${name}:${args}`;
}

// Deterministic confirm/cancel matching for a pending write-tool proposal —
// deliberately NOT another LLM call. Only matches short (<=5 word) messages
// so a longer/ambiguous reply falls through to a normal turn instead of
// silently executing or discarding something the user didn't clearly mean.
const CONFIRM_WORDS = ["ya", "iya", "yaa", "yap", "y", "ok", "oke", "oce", "okay", "siap", "gas", "gaskeun", "lanjut", "lanjutkan", "setuju", "boleh", "yuk", "sip", "betul", "benar", "confirm", "yes", "lakukan", "proses", "eksekusi"];
const CANCEL_WORDS = ["tidak", "gak", "ga", "nggak", "ngga", "jangan", "batal", "batalkan", "cancel", "engga", "enggak", "no", "stop", "gajadi"];

function matchConfirmIntent(message: string): "confirm" | "cancel" | null {
  const trimmed = message.trim().toLowerCase().replace(/[.,!?]+$/, "");
  if (!trimmed) return null;
  const words = trimmed.split(/\s+/);
  if (words.length > 5) return null;
  const first = words[0];
  if (CANCEL_WORDS.includes(first)) return "cancel";
  if (CONFIRM_WORDS.includes(first)) return "confirm";
  return null;
}

// Builds the deterministic (never LLM-authored) reply for a write-tool's
// proposal/error result — see WRITE_TOOL_NAMES short-circuit in each
// provider loop below.
function replyFromProposal(toolName: string, proposal: ToolProposalResult): { reply: string; pendingAction?: PendingAction } {
  switch (proposal.status) {
    case "AWAITING_USER_CONFIRMATION":
      return {
        reply: proposal.summary,
        pendingAction: { toolName: proposal.toolName, args: proposal.args, summary: proposal.summary },
      };
    case "NEEDS_DISAMBIGUATION":
      return { reply: `${proposal.message}\n${proposal.options.map((o) => `- ${o}`).join("\n")}` };
    case "NEEDS_INFO":
    case "NOT_ALLOWED":
    case "ERROR":
      return { reply: proposal.message };
  }
}

function parseToolProposal(toolName: string, rawResult: string): ToolProposalResult | null {
  try {
    const parsed = JSON.parse(rawResult);
    if (parsed && typeof parsed.status === "string") return parsed as ToolProposalResult;
  } catch {
    // fall through
  }
  return null;
}

function describeError(err: unknown): string {
  const e = err as { status?: number; message?: string; error?: unknown } | null;
  const parts = [e?.status ? `status=${e.status}` : null, e?.message, e?.error ? JSON.stringify(e.error) : null].filter(Boolean);
  return parts.join(" | ") || String(err);
}

// Distinguishes "both providers are quota/rate-limited right now" (transient,
// resolves on its own) from a genuine failure — the two need different
// messaging so a daily-quota hit doesn't read like a broken feature.
function isRateLimitError(err: unknown): boolean {
  const e = err as { status?: number; error?: { error?: { code?: string; type?: string } } } | null;
  if (e?.status === 429) return true;
  const code = e?.error?.error?.code;
  const type = e?.error?.error?.type;
  return code === "rate_limit_exceeded" || type === "tokens" || type === "requests";
}

// Groq's Llama 3.3 70B occasionally can't encode a tool call in its proper
// structured format — usually when calling search_employees with an empty
// query — and instead emits a pseudo-XML fragment like
// `<function=search_employees{"query": ""}</function>`, which the Groq API
// itself rejects with a 400 "tool_use_failed" before it ever reaches us.
// The rejected call is still readable from the error body, so instead of
// treating this as a hard failure (and burning the Gemini fallback on
// something Groq itself could have answered), we parse the intended call
// out of `failed_generation` and execute it ourselves, feeding the result
// back into the conversation as if Groq had called it correctly.
function parseFailedToolCall(err: unknown): { name: string; args: string } | null {
  // The Groq SDK wraps the API's JSON error body one level deeper than you'd
  // expect: err.error is itself `{ error: { code, failed_generation, ... } }`.
  const e = err as { error?: { error?: { code?: string; failed_generation?: string } } } | null;
  const inner = e?.error?.error;
  if (inner?.code !== "tool_use_failed" || !inner.failed_generation) return null;
  const match = inner.failed_generation.match(/<function=(\w+)\s*(\{[\s\S]*?\})\s*<\/function>/);
  if (!match) return null;
  return { name: match[1], args: match[2] };
}

async function runGroq(history: CopilotMessage[], role: string): Promise<{ reply: string; provider: CopilotProvider; pendingAction?: PendingAction } | { error: string }> {
  const groq = getGroqClient();
  const tools = toolsForRole(role);
  const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((m): Groq.Chat.Completions.ChatCompletionMessageParam => ({ role: m.role, content: m.content })),
  ];

  const seenSignatures = new Set<string>();

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const isLastRound = round === MAX_TOOL_ROUNDS - 1;
    let completion;
    try {
      completion = await groq.chat.completions.create({
        model: HRD_COPILOT_MODEL,
        messages,
        tools,
        // Force a text answer on the final round instead of allowing yet
        // another tool call — guarantees the loop ends with a real reply
        // rather than the generic "terlalu kompleks" bailout.
        tool_choice: isLastRound ? "none" : "auto",
        temperature: 0.3,
      });
    } catch (err) {
      const recovered = parseFailedToolCall(err);
      if (!recovered) throw err;
      const fakeCallId = `recovered-${round}`;
      const result = await executeHrdCopilotTool(recovered.name, recovered.args);
      if (WRITE_TOOL_NAMES.has(recovered.name)) {
        const proposal = parseToolProposal(recovered.name, result);
        if (proposal) return { ...replyFromProposal(recovered.name, proposal), provider: "groq" };
      }
      messages.push({
        role: "assistant", content: "",
        tool_calls: [{ id: fakeCallId, type: "function", function: { name: recovered.name, arguments: recovered.args } }],
      });
      messages.push({ role: "tool", tool_call_id: fakeCallId, content: result });
      continue;
    }

    const message = completion.choices[0].message;
    if (!message.tool_calls || message.tool_calls.length === 0) {
      return { reply: message.content || "Maaf, saya tidak bisa memproses pertanyaan itu.", provider: "groq" };
    }

    messages.push({ role: "assistant", content: message.content || "", tool_calls: message.tool_calls });
    let repeatedCall = false;
    for (const toolCall of message.tool_calls) {
      const signature = toolSignature(toolCall.function.name, toolCall.function.arguments);
      if (seenSignatures.has(signature)) repeatedCall = true;
      seenSignatures.add(signature);
      const result = await executeHrdCopilotTool(toolCall.function.name, toolCall.function.arguments);
      if (WRITE_TOOL_NAMES.has(toolCall.function.name)) {
        const proposal = parseToolProposal(toolCall.function.name, result);
        if (proposal) return { ...replyFromProposal(toolCall.function.name, proposal), provider: "groq" };
      }
      messages.push({ role: "tool", tool_call_id: toolCall.id, content: result });
    }
    if (repeatedCall) {
      messages.push({
        role: "system",
        content: "Anda sudah memanggil tool ini sebelumnya dengan argumen yang sama dan hasilnya sudah tersedia di atas. Jangan panggil tool yang sama lagi — jawab pengguna sekarang juga berdasarkan hasil yang sudah ada.",
      });
    }
  }

  return { error: "Permintaan terlalu kompleks untuk diproses saat ini. Coba pertanyaan yang lebih spesifik." };
}

// Fallback for when Groq is rate-limited (free-tier quotas reset fast under
// real usage) — same tools, same dispatcher, different provider. Gemini's
// SDK wants strict user/model-alternating history and returns function
// calls via response.functionCalls() instead of OpenAI-style tool_calls.
async function runGemini(history: CopilotMessage[], role: string): Promise<{ reply: string; provider: CopilotProvider; pendingAction?: PendingAction } | { error: string }> {
  const gemini = getGeminiClient();
  const model = gemini.getGenerativeModel({
    model: GEMINI_COPILOT_MODEL,
    systemInstruction: SYSTEM_PROMPT,
    tools: [{ functionDeclarations: toolsForRoleGemini(role) }],
    // Default thresholds can false-positive-block ordinary internal HR
    // discussion (employee names, disciplinary cases, warnings) under the
    // harassment/hate-speech categories. Relaxed since this is an
    // authenticated internal tool, not public-facing content.
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    ],
  });

  const priorTurns = history.slice(0, -1).map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));
  const lastMessage = history[history.length - 1];

  const chat = model.startChat({ history: priorTurns });
  let result = await chat.sendMessage(lastMessage.content);

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const calls = result.response.functionCalls();
    if (!calls || calls.length === 0) {
      return { reply: result.response.text() || "Maaf, saya tidak bisa memproses pertanyaan itu.", provider: "gemini" };
    }

    const responseParts = [];
    for (const call of calls) {
      const toolResult = await executeHrdCopilotTool(call.name, JSON.stringify(call.args || {}));
      if (WRITE_TOOL_NAMES.has(call.name)) {
        const proposal = parseToolProposal(call.name, toolResult);
        if (proposal) return { ...replyFromProposal(call.name, proposal), provider: "gemini" };
      }
      let parsed: unknown;
      try { parsed = JSON.parse(toolResult); } catch { parsed = { raw: toolResult }; }
      responseParts.push({ functionResponse: { name: call.name, response: parsed as object } });
    }
    result = await chat.sendMessage(responseParts);
  }

  return { error: "Permintaan terlalu kompleks untuk diproses saat ini. Coba pertanyaan yang lebih spesifik." };
}

type OpenRouterToolCall = { id: string; function: { name: string; arguments: string } };
type OpenRouterMessage = {
  role: string;
  content: string | null;
  tool_calls?: OpenRouterToolCall[];
  tool_call_id?: string;
};

// Third fallback tier — a different upstream from both Groq and Google, so
// all three being rate-limited at once is far less likely than just two.
// Talks to OpenRouter directly via fetch (see src/lib/openrouter.ts for why
// this doesn't go through an SDK) using the same OpenAI-style
// chat-completions + tool-calling shape as Groq, so the round-loop logic
// mirrors runGroq's.
async function runOpenRouter(history: CopilotMessage[], role: string): Promise<{ reply: string; provider: CopilotProvider; pendingAction?: PendingAction } | { error: string }> {
  const apiKey = getOpenRouterApiKey();
  const tools = toolsForRole(role);
  const messages: OpenRouterMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((m): OpenRouterMessage => ({ role: m.role, content: m.content })),
  ];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const isLastRound = round === MAX_TOOL_ROUNDS - 1;
    const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OPENROUTER_COPILOT_MODEL,
        messages,
        tools,
        tool_choice: isLastRound ? "none" : "auto",
        temperature: 0.3,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw { status: res.status, message: `OpenRouter ${res.status}`, error: { error: safeJsonParse(body) } };
    }
    const completion = await res.json();
    const message: OpenRouterMessage = completion.choices[0].message;

    if (!message.tool_calls || message.tool_calls.length === 0) {
      return { reply: message.content || "Maaf, saya tidak bisa memproses pertanyaan itu.", provider: "openrouter" };
    }

    messages.push({ role: "assistant", content: message.content, tool_calls: message.tool_calls });
    for (const toolCall of message.tool_calls) {
      const result = await executeHrdCopilotTool(toolCall.function.name, toolCall.function.arguments);
      if (WRITE_TOOL_NAMES.has(toolCall.function.name)) {
        const proposal = parseToolProposal(toolCall.function.name, result);
        if (proposal) return { ...replyFromProposal(toolCall.function.name, proposal), provider: "openrouter" };
      }
      messages.push({ role: "tool", tool_call_id: toolCall.id, content: result });
    }
  }

  return { error: "Permintaan terlalu kompleks untuk diproses saat ini. Coba pertanyaan yang lebih spesifik." };
}

function safeJsonParse(text: string): unknown {
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

// Internal tier bookkeeping (provider) never crosses to the client — the
// product must never reveal which AI vendor answered. `slow` is the only
// signal the UI gets, and it's provider-agnostic by construction.
function toClientResult(
  result: { reply: string; provider: CopilotProvider; pendingAction?: PendingAction } | { error: string }
): { reply: string; slow: boolean; pendingAction?: PendingAction } | { error: string } {
  if ("error" in result) return result;
  return { reply: result.reply, slow: result.provider !== "groq", pendingAction: result.pendingAction };
}

export async function askHrdCopilot(
  history: CopilotMessage[],
  pendingAction?: PendingAction | null,
  confirmed?: boolean
): Promise<{ reply: string; slow: boolean; pendingAction?: PendingAction } | { error: string }> {
  const user = await requireRole("hrd", "superadmin", "director", "department_manager");

  const rl = await rateLimit(`hrd-copilot:${user.email}`, 30, 5 * 60 * 1000);
  if (rl.limited) return { error: "Terlalu banyak permintaan ke asisten dalam waktu singkat. Coba lagi dalam beberapa menit." };

  const trimmedHistory = history.slice(-20); // cap context sent per turn

  // A pendingAction from a prior turn is only ever acted on deterministically
  // here — never by asking the LLM to decide. The client always echoes back
  // the exact {toolName,args} it was shown; a stale/replayed confirmation
  // still can't double-apply because every underlying write action re-checks
  // current DB state (idempotency guards) before mutating.
  if (pendingAction) {
    const lastUserMessage = [...trimmedHistory].reverse().find((m) => m.role === "user")?.content || "";
    const intent = confirmed === true ? "confirm" : matchConfirmIntent(lastUserMessage);

    if (intent === "cancel") {
      return { reply: "Baik, dibatalkan. Tidak ada perubahan yang dilakukan.", slow: false };
    }
    if (intent === "confirm") {
      const execRl = await rateLimit(`hrd-copilot-execute:${user.email}`, 10, 10 * 60 * 1000);
      if (execRl.limited) return { error: "Terlalu banyak tindakan dieksekusi dalam waktu singkat. Coba lagi dalam beberapa menit." };
      const result = await executeConfirmedWriteAction(pendingAction.toolName, pendingAction.args, user);
      return "error" in result ? { reply: result.error, slow: false } : { reply: result.message, slow: false };
    }
    // Ambiguous reply — drop the stale pendingAction and fall through to a
    // normal turn instead of guessing; the user can just ask again naturally.
  }

  try {
    return toClientResult(await runGroq(trimmedHistory, user.role));
  } catch (groqErr) {
    // Fall back to Gemini on ANY Groq failure, not just rate-limit (429) —
    // "heavier" questions (broader tool results, longer combined context)
    // are exactly the ones more likely to hit a DIFFERENT failure mode
    // (context-length limit, a transient 5xx, model overload), and those
    // were previously going straight to a dead-end error with no retry path
    // at all, which is the "tugas berat = gagal" gap this fixes.
    console.error("[hrd-copilot] Groq error, falling back to Gemini:", describeError(groqErr));
    try {
      return toClientResult(await runGemini(trimmedHistory, user.role));
    } catch (geminiErr) {
      console.error("[hrd-copilot] Gemini fallback also failed, falling back to OpenRouter:", describeError(geminiErr));
      // Third tier — a different upstream from both Groq and Google, so all
      // three being rate-limited at once is far less likely than just two.
      try {
        return toClientResult(await runOpenRouter(trimmedHistory, user.role));
      } catch (openRouterErr) {
        console.error("[hrd-copilot] OpenRouter fallback also failed:", describeError(openRouterErr));
        if (isRateLimitError(groqErr) || isRateLimitError(geminiErr) || isRateLimitError(openRouterErr)) {
          return { error: "Kuota harian AI (Groq, Gemini & OpenRouter) sedang habis. Ini bukan bug — coba lagi dalam beberapa menit, atau besok jika kuota harian sudah reset." };
        }
        return { error: "Asisten AI sedang tidak bisa diakses (Groq, Gemini, dan OpenRouter ketiganya gagal). Coba lagi sebentar lagi." };
      }
    }
  }
}
