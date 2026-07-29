"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Send, Bot, User } from "lucide-react";
import { askHrdCopilot, type CopilotMessage, type CopilotProvider } from "@/app/actions/hrd-copilot";

// Groq is the fast primary tier; these are only shown when a reply actually
// came from a slower fallback, so a user seeing lag has a concrete reason
// instead of it looking randomly inconsistent.
const PROVIDER_LABEL: Record<CopilotProvider, string> = {
  groq: "Groq",
  gemini: "Gemini (fallback)",
  openrouter: "OpenRouter (fallback, lebih lambat)",
};

const SUGGESTED_PROMPTS = [
  "Berapa jumlah karyawan per departemen?",
  "Ada berapa cuti yang masih pending?",
  "Bagaimana metrik turnover dan engagement saat ini?",
  "Apa saja approval yang menunggu saya?",
  "Berapa yang sudah hadir hari ini?",
];

// Failed turns are rendered as an assistant bubble like any other reply
// (via `isError`) instead of a single transient banner — a banner gets
// wiped by setError(null) on the very next send, so if several messages
// fail in a row (each waits for the disabled input to re-enable, so
// they're never concurrent — they just each fail independently), every
// failure before the last one silently vanished with no record of what
// happened. Keeping it in `messages` means every turn's outcome persists
// in the scrollback, whether it succeeded or not.
type DisplayMessage = CopilotMessage & { isError?: boolean; provider?: CopilotProvider };

export default function AssistantClient() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  // Synchronous guard against a double-send race: React state updates are
  // batched/async, so two sends fired in the same tick (double-click,
  // double-Enter) can both read `loading` as still-false before either
  // commits — a ref updates immediately, closing that window.
  const inFlightRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || inFlightRef.current) return;
    inFlightRef.current = true;
    const nextMessages: DisplayMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    try {
      // Don't feed prior error banners back in as fake conversation history —
      // they're UI-only records of a failed turn, not real assistant replies.
      const historyForModel: CopilotMessage[] = nextMessages
        .filter((m) => !m.isError)
        .map((m) => ({ role: m.role, content: m.content }));
      const result = await askHrdCopilot(historyForModel);
      if ("error" in result) {
        setMessages([...nextMessages, { role: "assistant", content: result.error, isError: true }]);
      } else {
        setMessages([...nextMessages, { role: "assistant", content: result.reply, provider: result.provider }]);
      }
    } catch {
      // The server action call itself failed (network drop, server
      // restarted mid-request, etc.) — surface it instead of leaving the
      // chat silently stuck with no reply and no visible error.
      setMessages([...nextMessages, { role: "assistant", content: "Koneksi ke server terputus saat memproses pertanyaan. Coba lagi.", isError: true }]);
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  }

  return (
    <div className="p-6 lg:p-8 h-[calc(100vh-56px)] flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-3 mb-6 shrink-0"
      >
        <motion.div
          className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#CC0000] to-orange-500 flex items-center justify-center shadow-md shadow-red-500/20"
          animate={{ rotate: [0, -6, 6, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles size={18} className="text-white" />
        </motion.div>
        <div>
          <h1 className="text-xl font-bold text-[#1A2530]">HRD Copilot</h1>
          <p className="text-xs text-gray-500">Tanya soal karyawan, cuti, approval, kehadiran, dan metrik HR — jawaban diambil langsung dari data sistem.</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="flex-1 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl overflow-hidden flex flex-col min-h-0 shadow-sm"
      >
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence>
            {messages.length === 0 && (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-center gap-4"
              >
                <motion.div
                  className="h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-100 flex items-center justify-center"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Bot size={24} className="text-slate-400" />
                </motion.div>
                <p className="text-sm text-slate-500 max-w-sm">Mulai percakapan atau coba salah satu pertanyaan berikut:</p>
                <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                  {SUGGESTED_PROMPTS.map((p, i) => (
                    <motion.button
                      key={p}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.05 * i }}
                      whileHover={{ scale: 1.04, backgroundColor: "#fff1f1" }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => send(p)}
                      className="text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 transition-colors"
                    >
                      {p}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${m.role === "user" ? "bg-slate-800" : m.isError ? "bg-red-100" : "bg-gradient-to-br from-[#CC0000] to-orange-500"}`}>
                  {m.role === "user" ? <User size={14} className="text-white" /> : <Bot size={14} className={m.isError ? "text-red-500" : "text-white"} />}
                </div>
                <div className={`flex flex-col gap-1 max-w-[75%] ${m.role === "user" ? "items-end" : "items-start"}`}>
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap shadow-sm ${
                      m.role === "user" ? "bg-slate-800 text-white" : m.isError ? "bg-red-50 text-red-600 border border-red-100" : "bg-slate-50 text-slate-800 border border-slate-100"
                    }`}
                  >
                    {m.content}
                  </div>
                  {m.provider && m.provider !== "groq" && (
                    <span className="text-[10px] text-slate-400 px-1">via {PROVIDER_LABEL[m.provider]}</span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <AnimatePresence>
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-3"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#CC0000] to-orange-500 flex items-center justify-center shrink-0">
                  <Bot size={14} className="text-white" />
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 flex items-center gap-1.5">
                  {[0, 1, 2].map((d) => (
                    <motion.span
                      key={d}
                      className="h-1.5 w-1.5 rounded-full bg-slate-400"
                      animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 0.9, repeat: Infinity, delay: d * 0.15, ease: "easeInOut" }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="border-t border-slate-100 p-4 flex items-center gap-2 shrink-0 bg-white/60"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tanya sesuatu tentang data HR..."
            disabled={loading}
            className="flex-1 text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#CC0000] disabled:opacity-50 transition-shadow"
          />
          <motion.button
            type="submit"
            disabled={loading || !input.trim()}
            whileHover={!loading && input.trim() ? { scale: 1.06 } : {}}
            whileTap={!loading && input.trim() ? { scale: 0.94 } : {}}
            className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-[#CC0000] to-orange-500 disabled:opacity-40 text-white flex items-center justify-center transition-opacity shadow-sm"
          >
            <Send size={16} />
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
