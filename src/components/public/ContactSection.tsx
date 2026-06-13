"use client";

import { useState, useRef } from "react";
import { MapPin, Phone, Mail, Send, CheckCircle, AlertCircle } from "lucide-react";
import { submitContact } from "@/app/actions/contact";

export default function ContactSection() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    const result = await submitContact(formData);

    if (result.error) {
      setStatus("error");
      setErrorMsg(result.error);
      return;
    }

    setStatus("success");
    formRef.current?.reset();
    setTimeout(() => setStatus("idle"), 5000);
  };

  return (
    <section id="contact" className="w-full font-sans">
      <div className="bg-[#FFFDFB] py-20 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-[60%] bg-white p-8 md:p-10 border border-[#EBE5DE] shadow-sm">
              <h2 className="text-[#1A2530] text-xl font-bold mb-8">
                Kirim Pesan
              </h2>

              <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[#666] text-sm mb-2" htmlFor="contact-name">
                      Nama Lengkap
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      name="name"
                      required
                      placeholder="John Doe"
                      className="w-full border border-[#EBE5DE] p-3 text-sm text-[#333] focus:outline-none focus:border-[#CC0000] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[#666] text-sm mb-2" htmlFor="contact-email">
                      Email
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      name="email"
                      required
                      placeholder="john@company.com"
                      className="w-full border border-[#EBE5DE] p-3 text-sm text-[#333] focus:outline-none focus:border-[#CC0000] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[#666] text-sm mb-2" htmlFor="contact-company">
                      Perusahaan
                    </label>
                    <input
                      id="contact-company"
                      type="text"
                      name="company"
                      placeholder="Nama Perusahaan"
                      className="w-full border border-[#EBE5DE] p-3 text-sm text-[#333] focus:outline-none focus:border-[#CC0000] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[#666] text-sm mb-2" htmlFor="contact-subject">
                      Subjek
                    </label>
                    <select
                      id="contact-subject"
                      name="subject"
                      className="w-full border border-[#EBE5DE] p-3 text-sm text-[#333] focus:outline-none focus:border-[#CC0000] transition-colors appearance-none bg-white"
                    >
                      <option value="General Inquiry">Pertanyaan Umum</option>
                      <option value="Request Quote">Permintaan Penawaran</option>
                      <option value="Support">Dukungan</option>
                      <option value="Partnership">Kemitraan</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[#666] text-sm mb-2" htmlFor="contact-message">
                    Pesan
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    rows={5}
                    placeholder="Bagaimana kami dapat membantu bisnis Anda?"
                    className="w-full border border-[#EBE5DE] p-3 text-sm text-[#333] focus:outline-none focus:border-[#CC0000] transition-colors resize-none"
                  />
                </div>

                {status === "success" && (
                  <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-3 rounded-sm text-sm font-medium">
                    <CheckCircle size={16} />
                    Pesan berhasil dikirim! Tim kami akan menghubungi Anda segera.
                  </div>
                )}

                {status === "error" && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-sm text-sm font-medium">
                    <AlertCircle size={16} />
                    {errorMsg}
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="bg-[#CC0000] hover:bg-[#aa0000] disabled:opacity-60 text-white font-bold text-sm px-8 py-3.5 flex items-center justify-center gap-2 transition-colors"
                  >
                    {status === "loading" ? "Mengirim..." : "Kirim Pesan"}
                    <Send size={14} />
                  </button>
                </div>
              </form>
            </div>

            <div className="lg:w-[40%] flex flex-col gap-8">
              <div className="bg-white p-8 border border-[#EBE5DE] shadow-sm flex-1">
                <h2 className="text-[#1A2530] text-xl font-bold mb-8">
                  Informasi Kontak
                </h2>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <MapPin className="text-[#CC0000] shrink-0 mt-0.5" size={20} />
                    <div>
                      <h3 className="text-[#1A2530] text-sm font-bold mb-1">Kantor Pusat</h3>
                      <p className="text-[#666] text-sm leading-relaxed">
                        Jl. Raya Anyer KM. 10, Cilegon, Banten
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <MapPin className="text-[#CC0000] shrink-0 mt-0.5" size={20} />
                    <div>
                      <h3 className="text-[#1A2530] text-sm font-bold mb-1">Kantor Operasional</h3>
                      <p className="text-[#666] text-sm leading-relaxed">
                        Jakarta Utara, Indonesia
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Phone className="text-[#CC0000] shrink-0 mt-0.5" size={20} />
                    <div>
                      <h3 className="text-[#1A2530] text-sm font-bold mb-1">Telepon</h3>
                      <p className="text-[#666] text-sm">(0254) 570700</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Mail className="text-[#CC0000] shrink-0 mt-0.5" size={20} />
                    <div>
                      <h3 className="text-[#1A2530] text-sm font-bold mb-1">Email</h3>
                      <p className="text-[#666] text-sm">admin@ptpgp.co.id</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#1A2530] p-8 text-white">
                <h2 className="text-xl font-bold mb-6">Jam Operasional</h2>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center border-b border-white/10 pb-3">
                    <span className="text-gray-300">Senin - Jumat</span>
                    <span className="font-bold">08:00 - 17:00</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/10 pb-3">
                    <span className="text-gray-300">Sabtu</span>
                    <span className="font-bold">08:00 - 12:00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Minggu</span>
                    <span className="font-bold text-[#CC0000]">Tutup</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative h-[400px] w-full bg-[#1A2530] overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <MapPin size={32} className="text-[#CC0000] mx-auto mb-4" />
          <h3 className="text-white font-bold text-lg mb-2">Cilegon, Banten</h3>
          <p className="text-gray-400 text-sm">Jl. Raya Anyer KM. 10</p>
        </div>
      </div>
    </section>
  );
}
