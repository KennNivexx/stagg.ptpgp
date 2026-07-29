"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X, Send, Bot, User } from "lucide-react";
import { askPublicChatbot, type PublicChatMessage } from "@/app/actions/public-chatbot";

const SUGGESTED_PROMPTS = [
  "Layanan apa saja yang tersedia?",
  "Bagaimana cara mendapatkan quotation?",
  "Apa saja area cakupan pengiriman?",
];

// Replaces the old FloatingWhatsApp button on the public landing page — a
// small popup chatbot for visitor FAQ instead of an external link straight
// to WhatsApp. Deliberately a compact corner popup (not a full page) since
// this is meant for quick general questions, not a full support session.
export default function PublicChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<PublicChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, isOpen]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || inFlightRef.current) return;
    inFlightRef.current = true;
    const nextMessages: PublicChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    try {
      const result = await askPublicChatbot(nextMessages);
      if ("error" in result) {
        setMessages([...nextMessages, { role: "assistant", content: result.error }]);
      } else {
        setMessages([...nextMessages, { role: "assistant", content: result.reply }]);
      }
    } catch {
      setMessages([...nextMessages, { role: "assistant", content: "Koneksi terputus. Silakan coba lagi." }]);
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  }

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? "Tutup asisten AI" : "Buka asisten AI"}
        className="fixed bottom-6 right-6 z-40 group"
        initial={{ opacity: 0, scale: 0, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 1, type: "spring", stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
      >
        {!isOpen && <span className="absolute inset-0 rounded-full bg-[#CC0000] animate-ping opacity-40" />}
        <span className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-[#CC0000] to-orange-500 text-white shadow-lg shadow-red-600/30">
          <AnimatePresence mode="wait" initial={false}>
            {isOpen ? (
              <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <X size={24} />
              </motion.span>
            ) : (
              <motion.span key="ai" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <Sparkles size={24} />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
        {!isOpen && (
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
            Tanya AI kami
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-24 right-6 z-40 w-[calc(100vw-3rem)] max-w-[360px] h-[480px] max-h-[70vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
          >
            <div className="flex items-center gap-2.5 px-4 py-3.5 bg-gradient-to-r from-[#CC0000] to-orange-500 text-white shrink-0">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Sparkles size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold leading-tight">Asisten PGP</p>
                <p className="text-[10px] text-white/80 leading-tight">Tanya apa saja soal layanan kami</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/50">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center gap-3 px-2">
                  <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                    <Bot size={18} className="text-slate-400" />
                  </div>
                  <p className="text-xs text-slate-500">Halo! Ada yang bisa saya bantu soal layanan PGP?</p>
                  <div className="flex flex-col gap-1.5 w-full">
                    {SUGGESTED_PROMPTS.map((p) => (
                      <button
                        key={p}
                        onClick={() => send(p)}
                        className="text-[11px] font-medium text-left text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 transition-colors"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${m.role === "user" ? "bg-slate-800" : "bg-gradient-to-br from-[#CC0000] to-orange-500"}`}>
                    {m.role === "user" ? <User size={11} className="text-white" /> : <Bot size={11} className="text-white" />}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-xl px-3 py-2 text-xs whitespace-pre-wrap ${
                      m.role === "user" ? "bg-slate-800 text-white" : "bg-white text-slate-800 border border-slate-100"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-2">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[#CC0000] to-orange-500 flex items-center justify-center shrink-0">
                    <Bot size={11} className="text-white" />
                  </div>
                  <div className="bg-white border border-slate-100 rounded-xl px-3 py-2.5 flex items-center gap-1">
                    {[0, 1, 2].map((d) => (
                      <motion.span
                        key={d}
                        className="h-1 w-1 rounded-full bg-slate-400"
                        animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 0.9, repeat: Infinity, delay: d * 0.15, ease: "easeInOut" }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="border-t border-slate-100 p-2.5 flex items-center gap-1.5 shrink-0 bg-white"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ketik pertanyaan..."
                disabled={loading}
                className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#CC0000] disabled:opacity-50 min-w-0"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br from-[#CC0000] to-orange-500 disabled:opacity-40 text-white flex items-center justify-center"
              >
                <Send size={14} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
