"use client";

import { MapPin, Phone, Mail, Send } from "lucide-react";

export default function ContactSection() {
  return (
    <section id="contact" className="w-full font-sans">
      {/* Top Part: Form & Info */}
      <div className="bg-[#FFFDFB] py-20 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left: Kirim Pesan Form */}
            <div className="lg:w-[60%] bg-white p-8 md:p-10 border border-[#EBE5DE] shadow-sm">
              <h2 className="text-[#1A2530] text-xl font-bold mb-8">
                Kirim Pesan
              </h2>

              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[#666] text-sm mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      className="w-full border border-[#EBE5DE] p-3 text-sm text-[#333] focus:outline-none focus:border-[#CC0000] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[#666] text-sm mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="john@company.com"
                      className="w-full border border-[#EBE5DE] p-3 text-sm text-[#333] focus:outline-none focus:border-[#CC0000] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[#666] text-sm mb-2">
                      Company
                    </label>
                    <input
                      type="text"
                      placeholder="Corporation Name"
                      className="w-full border border-[#EBE5DE] p-3 text-sm text-[#333] focus:outline-none focus:border-[#CC0000] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[#666] text-sm mb-2">
                      Subject
                    </label>
                    <div className="relative">
                      <select className="w-full border border-[#EBE5DE] p-3 text-sm text-[#333] focus:outline-none focus:border-[#CC0000] transition-colors appearance-none bg-white">
                        <option>General Inquiry</option>
                        <option>Request Quote</option>
                        <option>Support</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#666]">
                        <svg
                          className="fill-current h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[#666] text-sm mb-2">
                    Message
                  </label>
                  <textarea
                    rows={5}
                    placeholder="How can we help your business?"
                    className="w-full border border-[#EBE5DE] p-3 text-sm text-[#333] focus:outline-none focus:border-[#CC0000] transition-colors resize-none"
                  ></textarea>
                </div>

                <div>
                  <button
                    type="button"
                    className="bg-[#CC0000] hover:bg-[#aa0000] text-white font-bold text-sm px-8 py-3.5 flex items-center justify-center gap-2 transition-colors"
                  >
                    Send Message <Send size={14} className="ml-1" />
                  </button>
                </div>
              </form>
            </div>

            {/* Right: Info & Hours */}
            <div className="lg:w-[40%] flex flex-col gap-8">
              {/* Info Card */}
              <div className="bg-white p-8 border border-[#EBE5DE] shadow-sm flex-1">
                <h2 className="text-[#1A2530] text-xl font-bold mb-8">
                  Informasi Kontak
                </h2>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <MapPin
                      className="text-[#CC0000] shrink-0 mt-0.5"
                      size={20}
                    />
                    <div>
                      <h3 className="text-[#1A2530] text-sm font-bold mb-1">
                        Head Office
                      </h3>
                      <p className="text-[#666] text-sm leading-relaxed">
                        JL Logistik Utama No. 88,
                        <br />
                        Jakarta Utara, Indonesia
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <MapPin
                      className="text-[#CC0000] shrink-0 mt-0.5"
                      size={20}
                    />
                    <div>
                      <h3 className="text-[#1A2530] text-sm font-bold mb-1">
                        Cilegon Operational Hub
                      </h3>
                      <p className="text-[#666] text-sm leading-relaxed">
                        JL Raya Anyer, Cilegon, Banten
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Phone
                      className="text-[#CC0000] shrink-0 mt-0.5"
                      size={20}
                    />
                    <div>
                      <h3 className="text-[#1A2530] text-sm font-bold mb-1">
                        Phone
                      </h3>
                      <p className="text-[#666] text-sm">(0524) 570700</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Mail
                      className="text-[#CC0000] shrink-0 mt-0.5"
                      size={20}
                    />
                    <div>
                      <h3 className="text-[#1A2530] text-sm font-bold mb-1">
                        Email
                      </h3>
                      <p className="text-[#666] text-sm">admin@ptpgp.com</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Operational Hours */}
              <div className="bg-[#1A2530] p-8 text-white">
                <h2 className="text-xl font-bold mb-6">Operational Hours</h2>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center border-b border-white/10 pb-3">
                    <span className="text-gray-300">Monday - Friday</span>
                    <span className="font-bold">08:00 - 17:00</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/10 pb-3">
                    <span className="text-gray-300">Saturday</span>
                    <span className="font-bold">08:00 - 12:00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Sunday</span>
                    <span className="font-bold text-[#CC0000]">Closed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Part: Map Area */}
      <div className="relative h-[400px] w-full bg-[#5A6065] overflow-hidden">
        {/* Abstract Map Background (Using a dark map image overlay) */}
        <div className="absolute inset-0 opacity-40">
          <img
            src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=2000"
            className="w-full h-full object-cover grayscale"
            alt="Map background"
          />
        </div>
        <div className="absolute inset-0 bg-[#3f454a]/80 mix-blend-multiply"></div>

        {/* Map Pin Box */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white px-8 py-6 shadow-xl flex flex-col items-center pointer-events-auto">
            <h3 className="text-[#1A2530] text-xs font-bold tracking-widest uppercase mb-2">
              Jakarta Headquarters
            </h3>
            <p className="text-[#666] text-[10px] uppercase tracking-wider mb-4">
              North Jakarta Logistic Center
            </p>
            <div className="w-8 h-8 bg-[#1A2530] text-white rounded flex items-center justify-center">
              <MapPin size={16} />
            </div>
          </div>
        </div>

        {/* Map Controls Mockup */}
        <div className="absolute right-4 bottom-4 flex flex-col gap-1 pointer-events-auto">
          <button className="w-8 h-8 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-100 shadow-sm font-bold">
            +
          </button>
          <button className="w-8 h-8 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-100 shadow-sm font-bold">
            -
          </button>
        </div>
      </div>
    </section>
  );
}
