"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { getGroqClient, HRD_COPILOT_MODEL } from "@/lib/groq";
import { getGeminiClient, GEMINI_COPILOT_MODEL } from "@/lib/gemini";
import { getOpenRouterApiKey, OPENROUTER_BASE_URL, OPENROUTER_COPILOT_MODEL } from "@/lib/openrouter";
import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import type Groq from "groq-sdk";

export interface PublicChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Public-facing FAQ chatbot for site visitors — deliberately separate from
// HRD Copilot (src/app/actions/hrd-copilot.ts): no auth required (this is
// for anonymous visitors), no tool-calling/DB access (must never be able to
// reach employee or internal data), and its only knowledge is the same
// public CMS content already rendered on the landing page. Reuses the same
// three-tier Groq → Gemini → OpenRouter fallback chain since that
// infrastructure is provider-generic, not HR-specific.

async function getCompanyContext(): Promise<string> {
  const { data } = await supabaseAdmin
    .from("karyawan")
    .select("address")
    .eq("email", "__settings__@ptpgp.co.id")
    .maybeSingle();

  let settings: Record<string, Record<string, unknown>> = {};
  try {
    if (data?.address) settings = JSON.parse(data.address as string);
  } catch {
    // Malformed settings blob — fall back to empty, prompt still works with generic knowledge.
  }

  const info = settings.info || {};
  const about = settings.about || {};
  const services = (settings.services?.services as { title: string; description: string }[]) || [];
  const industries = (settings.industries?.industries as { name: string }[]) || [];
  const coverage = settings.coverage || {};
  const domestic = (coverage.domestic as { region: string }[]) || [];
  const international = (coverage.international as { region: string }[]) || [];
  const faqs = (settings.faq?.faqs as { question: string; answer: string }[]) || [];
  const contact = settings.contact || {};
  const cta = settings.cta || {};

  const lines: string[] = [];
  lines.push(`Nama perusahaan: ${info.company_name || "PT Pratama Galuh Perkasa"}`);
  if (about.description) lines.push(`Tentang perusahaan: ${about.description}`);
  if (about.years_experience) lines.push(`Pengalaman: ${about.years_experience} tahun`);
  if (services.length) lines.push(`Layanan yang ditawarkan:\n${services.map((s) => `- ${s.title}: ${s.description}`).join("\n")}`);
  if (industries.length) lines.push(`Industri yang dilayani: ${industries.map((i) => i.name).join(", ")}`);
  if (domestic.length) lines.push(`Cakupan domestik: ${domestic.map((d) => d.region).join(", ")}`);
  if (international.length) lines.push(`Cakupan internasional: ${international.map((d) => d.region).join(", ")}`);
  if (contact.phone || info.company_phone) lines.push(`Telepon: ${contact.phone || info.company_phone}`);
  if (contact.email || info.company_email) lines.push(`Email: ${contact.email || info.company_email}`);
  if (contact.address1 || info.company_address) lines.push(`Alamat: ${contact.address1 || info.company_address}`);
  if (contact.hours_weekday) lines.push(`Jam operasional: Senin-Jumat ${contact.hours_weekday}, Sabtu ${contact.hours_saturday || "-"}, Minggu ${contact.hours_sunday || "Tutup"}`);
  const waNumber = (cta.whatsapp_number as string) || (info.company_phone as string);
  if (waNumber) lines.push(`Nomor WhatsApp untuk kontak lebih lanjut: ${waNumber}`);
  if (faqs.length) lines.push(`FAQ yang sudah tersedia:\n${faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n")}`);

  return lines.join("\n\n");
}

function buildSystemPrompt(context: string): string {
  return `Anda adalah asisten AI di website PT Pratama Galuh Perkasa (perusahaan jasa transportasi & logistik), untuk menjawab pertanyaan umum pengunjung website (calon pelanggan, mitra, atau pencari kerja).
Jawab dalam Bahasa Indonesia, ramah, singkat, dan langsung ke inti.
Gunakan HANYA informasi di bawah ini sebagai sumber kebenaran. Jangan mengarang detail (harga pasti, SLA pasti, dll) yang tidak ada di sini — untuk hal spesifik yang tidak tercakup, arahkan pengunjung untuk menghubungi tim via WhatsApp/kontak yang tersedia atau mengisi form "Request Quotation" di halaman Kontak.
Jangan pernah membahas data internal karyawan, gaji, atau sistem HR — ini adalah chatbot PUBLIK untuk pengunjung, bukan staf internal. Jika ditanya hal semacam itu, arahkan untuk menghubungi HR perusahaan secara langsung.
Jangan pernah membahas hal teknis di balik layar (nama fungsi/kode, database, nama model/provider AI, dsb) — Anda hanya membahas bagian-bagian website dan layanan perusahaan ini.

=== INFORMASI PERUSAHAAN ===
${context}`;
}

function describeError(err: unknown): string {
  const e = err as { status?: number; message?: string; error?: unknown } | null;
  const parts = [e?.status ? `status=${e.status}` : null, e?.message, e?.error ? JSON.stringify(e.error) : null].filter(Boolean);
  return parts.join(" | ") || String(err);
}

async function runGroq(systemPrompt: string, history: PublicChatMessage[]): Promise<string> {
  const groq = getGroqClient();
  const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...history.map((m): Groq.Chat.Completions.ChatCompletionMessageParam => ({ role: m.role, content: m.content })),
  ];
  const completion = await groq.chat.completions.create({ model: HRD_COPILOT_MODEL, messages, temperature: 0.4 });
  return completion.choices[0].message.content || "Maaf, saya tidak bisa menjawab pertanyaan itu saat ini.";
}

async function runGemini(systemPrompt: string, history: PublicChatMessage[]): Promise<string> {
  const gemini = getGeminiClient();
  const model = gemini.getGenerativeModel({
    model: GEMINI_COPILOT_MODEL,
    systemInstruction: systemPrompt,
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    ],
  });
  const priorTurns = history.slice(0, -1).map((m) => ({ role: m.role === "user" ? "user" : "model", parts: [{ text: m.content }] }));
  const lastMessage = history[history.length - 1];
  const chat = model.startChat({ history: priorTurns });
  const result = await chat.sendMessage(lastMessage.content);
  return result.response.text() || "Maaf, saya tidak bisa menjawab pertanyaan itu saat ini.";
}

async function runOpenRouter(systemPrompt: string, history: PublicChatMessage[]): Promise<string> {
  const apiKey = getOpenRouterApiKey();
  const messages = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];
  const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: OPENROUTER_COPILOT_MODEL, messages, temperature: 0.4 }),
  });
  if (!res.ok) {
    const body = await res.text();
    let parsed: unknown;
    try { parsed = JSON.parse(body); } catch { parsed = { raw: body }; }
    throw { status: res.status, message: `OpenRouter ${res.status}`, error: { error: parsed } };
  }
  const completion = await res.json();
  return completion.choices[0].message.content || "Maaf, saya tidak bisa menjawab pertanyaan itu saat ini.";
}

export async function askPublicChatbot(history: PublicChatMessage[]): Promise<{ reply: string } | { error: string }> {
  const trimmedHistory = history.slice(-20);
  const context = await getCompanyContext();
  const systemPrompt = buildSystemPrompt(context);

  try {
    return { reply: await runGroq(systemPrompt, trimmedHistory) };
  } catch (groqErr) {
    console.error("[public-chatbot] Groq error, falling back to Gemini:", describeError(groqErr));
    try {
      return { reply: await runGemini(systemPrompt, trimmedHistory) };
    } catch (geminiErr) {
      console.error("[public-chatbot] Gemini fallback also failed, falling back to OpenRouter:", describeError(geminiErr));
      try {
        return { reply: await runOpenRouter(systemPrompt, trimmedHistory) };
      } catch (openRouterErr) {
        console.error("[public-chatbot] OpenRouter fallback also failed:", describeError(openRouterErr));
        return { error: "Maaf, asisten sedang tidak bisa diakses. Silakan hubungi kami langsung via WhatsApp atau form Kontak di bawah." };
      }
    }
  }
}
