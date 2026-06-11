"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle } from "lucide-react";
import NewNavbar from "@/components/public/NewNavbar";
import PGPFooter from "@/components/public/PGPFooter";
import { registerVendor } from "@/app/actions/vendor";

export default function VendorRegistrationForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    const formData = new FormData(e.currentTarget);
    try {
      const res = await registerVendor(formData);
      if (res.error) {
        setError(res.error);
        setLoading(false);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError("Terjadi kesalahan sistem saat mendaftar.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F9F7F6] pt-[72px]">
      <NewNavbar />

      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/e-procurement" className="inline-flex items-center text-sm text-gray-500 hover:text-pgp-red transition-colors mb-6">
          <ArrowLeft size={16} className="mr-1" /> Kembali ke E-Procurement
        </Link>
        
        <div className="bg-white p-8 md:p-12 rounded-md shadow-sm border border-gray-100">
          <h1 className="text-3xl font-bold text-pgp-navy tracking-tight mb-2">Pendaftaran Vendor</h1>
          <p className="text-gray-500 mb-8 text-sm">Silakan lengkapi data perusahaan Anda untuk bergabung sebagai mitra resmi PT Pratama Galuh Perkasa.</p>

          {success ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-green-50 text-green-500 flex items-center justify-center rounded-full mx-auto mb-6">
                <CheckCircle size={40} />
              </div>
              <h2 className="text-2xl font-bold text-pgp-navy mb-4">Pendaftaran Berhasil!</h2>
              <p className="text-gray-500 mb-8">Data perusahaan Anda telah kami terima dan akan melalui proses verifikasi dalam 5-7 hari kerja. Kami akan menghubungi Anda melalui email.</p>
              <Link href="/e-procurement" className="inline-block bg-pgp-red text-white font-semibold px-8 py-3 rounded-sm hover:bg-pgp-red-hover transition-colors">
                Selesai
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {error && (
                <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-sm text-sm font-semibold">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Nama Perusahaan</label>
                  <input type="text" name="company_name" required className="w-full border border-gray-200 p-3 text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none transition-colors" placeholder="PT Contoh Vendor" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Email Perusahaan</label>
                  <input type="email" name="company_email" required className="w-full border border-gray-200 p-3 text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none transition-colors" placeholder="info@vendor.co.id" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Nomor Telepon Kantor</label>
                  <input type="tel" name="company_phone" required className="w-full border border-gray-200 p-3 text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none transition-colors" placeholder="021-xxxxxxx" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Nomor Pokok Wajib Pajak (NPWP)</label>
                  <input type="text" name="npwp" required className="w-full border border-gray-200 p-3 text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none transition-colors" placeholder="00.000.000.0-000.000" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Nomor Induk Berusaha (NIB)</label>
                  <input type="text" name="nib" required className="w-full border border-gray-200 p-3 text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none transition-colors" placeholder="1234567890123" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Kategori Bisnis/Layanan</label>
                  <select name="business_type" className="w-full border border-gray-200 p-3 text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none transition-colors bg-white">
                    <option>Penyedia Armada (Truk, Kapal, dll)</option>
                    <option>Suku Cadang & Perawatan Kendaraan</option>
                    <option>Layanan IT & Infrastruktur</option>
                    <option>Peralatan Keselamatan & Keamanan</option>
                    <option>Fasilitas Gudang & Penyimpanan</option>
                    <option>Lainnya</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Alamat Lengkap Perusahaan</label>
                  <textarea name="address" required rows={4} className="w-full border border-gray-200 p-3 text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none transition-colors" placeholder="Jalan Raya No. 123, Kota..."></textarea>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button type="submit" disabled={loading} className="w-full bg-[#CC0000] hover:bg-[#aa0000] text-white font-bold py-4 rounded-sm transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? "Mengirim Data..." : "Kirim Formulir Pendaftaran"}
                </button>
                <p className="text-[10px] text-gray-400 text-center mt-4">
                  Dengan mengirimkan formulir ini, Anda menyetujui Kebijakan Etika Pengadaan dan Syarat Kemitraan PT Pratama Galuh Perkasa.
                </p>
              </div>

            </form>
          )}

        </div>
      </div>

      <PGPFooter />
    </main>
  );
}
