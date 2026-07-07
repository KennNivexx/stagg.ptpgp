"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { submitQuotation } from "@/app/actions/vendor";
import { X, User, Building, Mail, Phone, MapPin, Truck, Box, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function QuotationModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    origin: "",
    destination: "",
    serviceType: "Darat",
    cargoDesc: "",
    weight: "",
    volume: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const data = new FormData();
    data.append("company_name", formData.company);
    data.append("email", formData.email);
    data.append("phone", formData.phone);
    data.append("service_type", formData.serviceType);
    data.append("description", `Origin: ${formData.origin} | Destination: ${formData.destination} | Weight: ${formData.weight} | Volume: ${formData.volume} | Cargo: ${formData.cargoDesc}`);

    try {
      const result = await submitQuotation(data);
      if (result.error) {
        setError(result.error);
        setSubmitting(false);
      } else {
        setSuccess(true);
        setSubmitting(false);
        setTimeout(() => {
          setSuccess(false);
          onClose();
          setFormData({
            name: "",
            company: "",
            email: "",
            phone: "",
            origin: "",
            destination: "",
            serviceType: "Darat",
            cargoDesc: "",
            weight: "",
            volume: ""
          });
        }, 2000);
      }
    } catch {
      setError("Gagal mengirim permintaan. Silakan coba lagi.");
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!submitting && !success) onClose();
            }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden relative z-10 flex flex-col border border-gray-100"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-pgp-red">Layanan Logistik</span>
                <h3 className="text-xl font-bold text-pgp-navy mt-0.5">Permintaan Quotation Harga</h3>
              </div>
              <button
                disabled={submitting}
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-gray-200/80 text-gray-500 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form / Success Screen */}
            <div className="overflow-y-auto p-6 flex-1">
              {success ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4 animate-bounce" />
                  <h4 className="text-lg font-bold text-pgp-navy mb-2">Quotation Berhasil Dikirim!</h4>
                  <p className="text-sm text-gray-500 max-w-sm">Tim sales kami akan meninjau rincian kargo Anda dan mengirimkan penawaran harga terbaik dalam waktu 1x24 jam.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Error alert */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {error}
                    </div>
                  )}
                  {/* Personal info */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-xs text-pgp-red uppercase tracking-wider border-b border-gray-100 pb-1.5">Informasi Kontak</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Nama Lengkap</label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4.5 h-4.5" />
                          <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Nama Anda"
                            className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-pgp-red focus:ring-1 focus:ring-pgp-red/20 outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Nama Perusahaan</label>
                        <div className="relative">
                          <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4.5 h-4.5" />
                          <input
                            type="text"
                            required
                            value={formData.company}
                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                            placeholder="Nama Perusahaan Anda"
                            className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-pgp-red focus:ring-1 focus:ring-pgp-red/20 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Alamat Email</label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4.5 h-4.5" />
                          <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="email@perusahaan.com"
                            className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-pgp-red focus:ring-1 focus:ring-pgp-red/20 outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Nomor HP / WhatsApp</label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4.5 h-4.5" />
                          <input
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="Contoh: 0812..."
                            className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-pgp-red focus:ring-1 focus:ring-pgp-red/20 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Route Info */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-xs text-pgp-red uppercase tracking-wider border-b border-gray-100 pb-1.5">Rincian Rute & Kargo</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Kota Asal (Origin)</label>
                        <div className="relative">
                          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4.5 h-4.5" />
                          <input
                            type="text"
                            required
                            value={formData.origin}
                            onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                            placeholder="Kota pengambilan barang"
                            className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-pgp-red focus:ring-1 focus:ring-pgp-red/20 outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Kota Tujuan (Destination)</label>
                        <div className="relative">
                          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4.5 h-4.5" />
                          <input
                            type="text"
                            required
                            value={formData.destination}
                            onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                            placeholder="Kota pengiriman barang"
                            className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-pgp-red focus:ring-1 focus:ring-pgp-red/20 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Layanan Logistik</label>
                        <div className="relative">
                          <Truck className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4.5 h-4.5" />
                          <select
                            value={formData.serviceType}
                            onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                            className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-pgp-red focus:ring-1 focus:ring-pgp-red/20 outline-none transition-all bg-white appearance-none"
                          >
                            <option value="Darat">Darat (Land Transport)</option>
                            <option value="Laut">Laut (Sea Freight)</option>
                            <option value="Udara">Udara (Air Freight)</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Berat (Kg/Ton)</label>
                          <input
                            type="text"
                            required
                            value={formData.weight}
                            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                            placeholder="Berat"
                            className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-pgp-red focus:ring-1 focus:ring-pgp-red/20 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Volume (CBM)</label>
                          <input
                            type="text"
                            value={formData.volume}
                            onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                            placeholder="Volume"
                            className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-pgp-red focus:ring-1 focus:ring-pgp-red/20 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Deskripsi Barang / Kargo</label>
                      <div className="relative">
                        <Box className="absolute left-3.5 top-3 text-gray-400 w-4.5 h-4.5" />
                        <textarea
                          rows={2}
                          required
                          value={formData.cargoDesc}
                          onChange={(e) => setFormData({ ...formData, cargoDesc: e.target.value })}
                          placeholder="Deskripsi jenis kargo, dimensi, atau instruksi penanganan khusus..."
                          className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-pgp-red focus:ring-1 focus:ring-pgp-red/20 outline-none transition-all resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-pgp-red hover:bg-pgp-red-hover text-white text-sm font-bold py-3.5 rounded-full transition-all duration-300 shadow-md shadow-pgp-red/10 flex items-center justify-center gap-2 cursor-pointer mt-4"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4.5 h-4.5 animate-spin" />
                        Mengirim Penawaran...
                      </>
                    ) : (
                      "Kirim Permintaan Harga"
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
