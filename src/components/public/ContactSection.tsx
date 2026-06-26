"use client";

import { useState, useRef } from "react";
import { MapPin, Phone, Mail, Send, CheckCircle, AlertCircle } from "lucide-react";
import { submitContact } from "@/app/actions/contact";

interface ContactProps {
  contact_title?: string;
  address1_label?: string;
  address1?: string;
  address2_label?: string;
  address2?: string;
  phone?: string;
  email?: string;
  hours_weekday?: string;
  hours_saturday?: string;
  hours_sunday?: string;
  map_city?: string;
  map_address?: string;
}

export default function ContactSection({
  contact_title = "Kirim Pesan",
  address1_label = "Kantor Pusat",
  address1 = "Jl. Raya Anyer KM. 10, Cilegon, Banten",
  address2_label = "Kantor Operasional",
  address2 = "Jakarta Utara, Indonesia",
  phone = "(0254) 570700",
  email = "admin@ptpgp.co.id",
  hours_weekday = "08:00 - 17:00",
  hours_saturday = "08:00 - 12:00",
  hours_sunday = "Tutup",
  map_city = "Cilegon, Banten",
  map_address = "Jl. Raya Anyer KM. 10",
}: ContactProps) {
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
    <section id="contact" className="w-full font-sans scroll-mt-[72px]">
      <div className="bg-[#FFFDFB] py-20 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-[60%] bg-white p-8 md:p-10 border border-[#EBE5DE] shadow-sm">
              <h2 className="text-pgp-navy text-xl font-bold mb-8">
                {contact_title}
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
                      className="w-full border border-[#EBE5DE] p-3 text-sm text-[#333] focus:outline-none focus:border-pgp-red transition-colors"
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
                      className="w-full border border-[#EBE5DE] p-3 text-sm text-[#333] focus:outline-none focus:border-pgp-red transition-colors"
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
                      className="w-full border border-[#EBE5DE] p-3 text-sm text-[#333] focus:outline-none focus:border-pgp-red transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[#666] text-sm mb-2" htmlFor="contact-subject">
                      Subjek
                    </label>
                    <select
                      id="contact-subject"
                      name="subject"
                      className="w-full border border-[#EBE5DE] p-3 text-sm text-[#333] focus:outline-none focus:border-pgp-red transition-colors appearance-none bg-white"
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
                    className="w-full border border-[#EBE5DE] p-3 text-sm text-[#333] focus:outline-none focus:border-pgp-red transition-colors resize-none"
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
                    className="bg-pgp-red hover:bg-pgp-red/80 disabled:opacity-60 text-white font-bold text-sm px-8 py-3.5 flex items-center justify-center gap-2 transition-colors"
                  >
                    {status === "loading" ? "Mengirim..." : "Kirim Pesan"}
                    <Send size={14} />
                  </button>
                </div>
              </form>
            </div>

            <div className="lg:w-[40%] flex flex-col gap-8">
              <div className="bg-white p-8 border border-[#EBE5DE] shadow-sm flex-1">
                <h2 className="text-pgp-navy text-xl font-bold mb-8">
                  Informasi Kontak
                </h2>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <MapPin className="text-pgp-red shrink-0 mt-0.5" size={20} />
                    <div>
                      <h3 className="text-pgp-navy text-sm font-bold mb-1">{address1_label}</h3>
                      <p className="text-[#666] text-sm leading-relaxed">{address1}</p>
                    </div>
                  </div>

                  {address2 && (
                    <div className="flex items-start gap-4">
                      <MapPin className="text-pgp-red shrink-0 mt-0.5" size={20} />
                      <div>
                        <h3 className="text-pgp-navy text-sm font-bold mb-1">{address2_label}</h3>
                        <p className="text-[#666] text-sm leading-relaxed">{address2}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    <Phone className="text-pgp-red shrink-0 mt-0.5" size={20} />
                    <div>
                      <h3 className="text-pgp-navy text-sm font-bold mb-1">Telepon</h3>
                      <p className="text-[#666] text-sm">{phone}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Mail className="text-pgp-red shrink-0 mt-0.5" size={20} />
                    <div>
                      <h3 className="text-pgp-navy text-sm font-bold mb-1">Email</h3>
                      <p className="text-[#666] text-sm">{email}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-pgp-navy p-8 text-white">
                <h2 className="text-xl font-bold mb-6">Jam Operasional</h2>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center border-b border-white/10 pb-3">
                    <span className="text-gray-300">Senin - Jumat</span>
                    <span className="font-bold">{hours_weekday}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/10 pb-3">
                    <span className="text-gray-300">Sabtu</span>
                    <span className="font-bold">{hours_saturday}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Minggu</span>
                    <span className="font-bold text-pgp-red">{hours_sunday}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative h-[400px] w-full bg-pgp-navy overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <MapPin size={32} className="text-pgp-red mx-auto mb-4" />
          <h3 className="text-white font-bold text-lg mb-2">{map_city}</h3>
          <p className="text-gray-400 text-sm">{map_address}</p>
        </div>
      </div>
    </section>
  );
}
