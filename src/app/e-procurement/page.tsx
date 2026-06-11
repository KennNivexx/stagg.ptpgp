import { supabase } from "@/lib/supabase";
import NewNavbar from "@/components/public/NewNavbar";
import PGPFooter from "@/components/public/PGPFooter";
import { ShieldCheck, Receipt, FileText, BarChart3, Download, Mail, Phone, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export const revalidate = 60;

export default async function EProcurementPage() {
  const { data: tenders } = await supabase
    .from('tenders')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <main className="min-h-screen bg-[#F9F7F6] pt-[72px]">
      <NewNavbar />
      
      {/* Hero Section */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <span className="inline-block py-1 px-3 bg-red-50 text-pgp-red font-semibold text-xs tracking-wider uppercase rounded-sm mb-6">
                Peluang Kemitraan
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold text-pgp-navy leading-tight mb-6 tracking-tight">
                Pengadaan Strategis untuk Keunggulan Logistik Global
              </h1>
              <p className="text-gray-500 text-lg mb-8 leading-relaxed max-w-lg">
                Bergabunglah dengan ekosistem mitra terpercaya kami. Kami memelihara proses pengadaan yang transparan dan digital-first untuk memastikan keandalan operasional dan pertumbuhan bersama.
              </p>
              <div className="flex gap-4">
                <Link href="/e-procurement/register" className="bg-pgp-red text-white px-6 py-3 rounded-sm font-semibold hover:bg-pgp-red-hover transition-colors shadow-sm text-sm">
                  Daftar sebagai Vendor
                </Link>
                <Link href="#tenders" className="bg-white text-gray-700 border border-gray-300 px-6 py-3 rounded-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm text-sm">
                  Lihat Tender Saat Ini
                </Link>
              </div>
            </div>
            <div className="flex-1 w-full">
              <div className="aspect-[4/3] rounded-md overflow-hidden shadow-xl relative">
                <img src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=1000" className="object-cover w-full h-full" alt="Warehouse" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="bg-[#2A3140] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-white/10">
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">500+</div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Vendor Aktif</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">24h</div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Waktu Respons</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">100%</div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Tendering Digital</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">$10M+</div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Sumber Tahunan</div>
            </div>
          </div>
        </div>
      </section>

      {/* Guidelines & Partner section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Guidelines */}
          <div className="flex-1 bg-white p-10 rounded-md border border-gray-100 shadow-sm w-full">
            <h2 className="text-2xl font-bold text-pgp-navy mb-10 tracking-tight">Pedoman Pengadaan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-red-50 text-pgp-red flex items-center justify-center rounded-sm shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-pgp-navy mb-2">Standar Etika</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">Kami mematuhi kebijakan tanpa toleransi terhadap penyuapan dan korupsi. Semua vendor harus menandatangani Kode Etik kami.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-red-50 text-pgp-red flex items-center justify-center rounded-sm shrink-0">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-pgp-navy mb-2">Dokumentasi</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">Lisensi bisnis yang sah (NIB), catatan pajak (NPWP), dan sertifikasi khusus industri wajib untuk orientasi.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-red-50 text-pgp-red flex items-center justify-center rounded-sm shrink-0">
                  <Receipt size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-pgp-navy mb-2">Ketentuan Pembayaran</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">Siklus pembayaran standar kami adalah Net 30-45 hari dari verifikasi faktur melalui portal penagihan elektronik kami.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-red-50 text-pgp-red flex items-center justify-center rounded-sm shrink-0">
                  <BarChart3 size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-pgp-navy mb-2">Ulasan Kinerja</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">Vendor dievaluasi setiap kuartal berdasarkan ketepatan pengiriman, kualitas layanan, dan kepatuhan teknis.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Become a Partner */}
          <div id="become-partner" className="lg:w-1/3 w-full bg-[#2A3140] text-white p-10 rounded-md shadow-lg flex flex-col sticky top-24">
            <h2 className="text-xl font-bold mb-4 tracking-tight">Menjadi Mitra</h2>
            <p className="text-gray-400 text-xs mb-8 leading-relaxed">
              Siap bergabung dengan rantai pasokan kami? Mulai pendaftaran Anda hari ini. Prosesnya biasanya membutuhkan 5-7 hari kerja untuk verifikasi awal.
            </p>
            <ul className="space-y-4 mb-10 flex-1">
              <li className="flex items-center gap-3 text-xs font-semibold">
                <CheckCircle2 size={16} className="text-pgp-red" /> Isi formulir online
              </li>
              <li className="flex items-center gap-3 text-xs font-semibold">
                <CheckCircle2 size={16} className="text-pgp-red" /> Unggah kredensial
              </li>
              <li className="flex items-center gap-3 text-xs font-semibold">
                <CheckCircle2 size={16} className="text-pgp-red" /> Pemeriksaan kepatuhan
              </li>
            </ul>
            <Link href="/e-procurement/register" className="block text-center w-full bg-pgp-red hover:bg-pgp-red-hover text-white font-semibold py-3 rounded-sm transition-colors text-sm">
              Daftar sebagai Vendor
            </Link>
          </div>
        </div>
      </section>

      {/* Tenders Table */}
      <section id="tenders" className="pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-md border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
            <h2 className="text-xl font-bold text-pgp-navy tracking-tight">Tender Saat Ini</h2>
            <div className="relative hidden sm:block">
              <input type="text" placeholder="Cari tender..." className="pl-8 pr-4 py-2 border border-gray-200 rounded-sm text-xs font-medium focus:outline-none focus:border-pgp-red w-64 bg-gray-50" />
              <svg className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">ID Tender</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Subjek</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Kategori</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Batas Waktu</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(!tenders || tenders.length === 0) ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-gray-500 text-sm">
                      Tidak ada tender aktif saat ini.
                    </td>
                  </tr>
                ) : (
                  tenders.map((tender) => (
                    <tr key={tender.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-5 whitespace-nowrap text-xs text-gray-500">
                        {tender.id.substring(0, 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-5 text-sm text-pgp-navy font-semibold max-w-xs truncate">
                        {tender.title}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full">
                          {tender.description || 'Umum'}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-xs text-gray-500">
                        {tender.deadline ? new Date(tender.deadline).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-center">
                          <span className={`px-3 py-1 text-[10px] font-bold rounded-full ${(tender.status || '').toLowerCase() === 'open' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                            {tender.status || '-'}
                          </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-center">
                        {tender.document_url ? (
                          <a href={tender.document_url} target="_blank" rel="noopener noreferrer" className="text-pgp-red hover:text-pgp-red-hover text-xs font-semibold flex items-center justify-center gap-1">
                            Unduh Dokumen <Download size={12} />
                          </a>
                        ) : (
                          <span className="text-gray-400 text-[10px] uppercase tracking-wider font-semibold">Evaluasi</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {tenders && tenders.length > 0 && (
            <div className="p-4 border-t border-gray-100 text-center">
              <button className="text-xs font-semibold text-gray-500 hover:text-pgp-red transition-colors flex items-center justify-center gap-1 mx-auto">
                Muat Lebih Banyak Tender <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Need Assistance Section */}
      <section className="py-20 bg-[#F9F7F6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="w-full md:w-1/2 aspect-[4/3] rounded-md overflow-hidden relative shadow-sm">
              <img src="https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&q=80&w=800" className="object-cover w-full h-full" alt="Handshake" />
            </div>
            <div className="w-full md:w-1/2 md:pl-8">
              <h2 className="text-3xl font-bold text-pgp-navy mb-4 tracking-tight">Butuh Bantuan?</h2>
              <p className="text-gray-500 mb-10 leading-relaxed text-sm">
                Meja pengadaan kami tersedia untuk membantu calon vendor dengan masalah registrasi teknis atau klarifikasi persyaratan tender.
              </p>
              <div className="space-y-6">
                <div className="flex items-center gap-5 border border-gray-100 bg-white p-4 rounded-md shadow-sm">
                  <div className="w-12 h-12 bg-red-50 text-pgp-red flex items-center justify-center rounded-sm shrink-0">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Email Pengadaan</h4>
                    <a href="mailto:procurement@pgp-logistics.co.id" className="text-sm font-semibold text-pgp-navy hover:text-pgp-red">procurement@pgp-logistics.co.id</a>
                  </div>
                </div>
                <div className="flex items-center gap-5 border border-gray-100 bg-white p-4 rounded-md shadow-sm">
                  <div className="w-12 h-12 bg-red-50 text-pgp-red flex items-center justify-center rounded-sm shrink-0">
                    <Phone size={20} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Meja Bantuan Vendor</h4>
                    <p className="text-sm font-semibold text-pgp-navy">+62 (21) 555-0192 (Senin-Jumat, 9 Pagi-5 Sore)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PGPFooter />
    </main>
  );
}
