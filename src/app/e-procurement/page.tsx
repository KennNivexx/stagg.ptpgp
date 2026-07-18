import NewNavbar from "@/components/public/NewNavbar";
import PGPFooter from "@/components/public/PGPFooter";
import { ShieldCheck, Receipt, FileText, BarChart3, Mail, Phone, CheckCircle2, ArrowRight, Building2, Clock } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

// Vendor/e-procurement hidden from the site per request — not linked from
// any nav/teaser, and this direct route is disabled too so it can't be
// reached even by a guessed/bookmarked URL. Remove this guard to re-enable.
export default function EProcurementPage() {
  redirect("/");
}

function _EProcurementPage() {
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
                Pengadaan Strategis untuk Keunggulan Logistik
              </h1>
              <p className="text-gray-500 text-lg mb-8 leading-relaxed max-w-lg">
                Bergabunglah dengan ekosistem mitra terpercaya kami. Kami menjalankan proses pengadaan yang transparan dan profesional untuk memastikan keandalan operasional dan pertumbuhan bersama.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/e-procurement/register" className="bg-pgp-red text-white px-6 py-3 rounded-sm font-semibold hover:bg-pgp-red/80 transition-colors shadow-sm text-sm text-center inline-flex items-center justify-center gap-2">
                  Daftar sebagai Vendor <ArrowRight size={16} />
                </Link>
                <a href="#guidelines" className="bg-white text-gray-700 border border-gray-300 px-6 py-3 rounded-sm font-semibold hover:bg-gray-50 transition-colors text-sm text-center">
                  Lihat Pedoman
                </a>
              </div>
            </div>
            <div className="flex-1 w-full">
              <div className="aspect-[4/3] rounded-md overflow-hidden shadow-xl relative bg-gradient-to-br from-pgp-navy to-[#2A3140] flex items-center justify-center">
                <div className="text-center p-8">
                  <Building2 size={48} className="text-pgp-red mx-auto mb-4" />
                  <p className="text-white font-bold text-xl mb-2">500+ Vendor Aktif</p>
                  <p className="text-gray-400 text-sm">Tergabung dalam ekosistem pengadaan kami</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="bg-[#2A3140] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center md:divide-x divide-white/10">
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">500+</div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Vendor Aktif</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">24 Jam</div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Waktu Respons</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">100%</div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Digital</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">7 Hari</div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Verifikasi</div>
            </div>
          </div>
        </div>
      </section>

      {/* Guidelines */}
      <section id="guidelines" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-pgp-navy mb-4 tracking-tight">Pedoman Pengadaan</h2>
          <p className="text-gray-500 max-w-xl mx-auto text-sm">Standar dan prosedur yang kami terapkan untuk menjamin kemitraan yang adil dan profesional.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-md border border-gray-100 shadow-sm flex gap-5 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-red-50 text-pgp-red flex items-center justify-center rounded-sm shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-pgp-navy mb-2">Standar Etika & Kepatuhan</h3>
              <p className="text-xs text-gray-500 leading-relaxed">Kami menerapkan kebijakan tanpa toleransi terhadap penyuapan dan korupsi. Semua vendor wajib menandatangani Kode Etik dan mematuhi regulasi yang berlaku.</p>
            </div>
          </div>
          <div className="bg-white p-8 rounded-md border border-gray-100 shadow-sm flex gap-5 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-red-50 text-pgp-red flex items-center justify-center rounded-sm shrink-0">
              <FileText size={22} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-pgp-navy mb-2">Dokumentasi & Legalitas</h3>
              <p className="text-xs text-gray-500 leading-relaxed">Lisensi bisnis yang sah (NIB), NPWP, dan sertifikasi khusus industri wajib diserahkan saat proses orientasi vendor baru.</p>
            </div>
          </div>
          <div className="bg-white p-8 rounded-md border border-gray-100 shadow-sm flex gap-5 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-red-50 text-pgp-red flex items-center justify-center rounded-sm shrink-0">
              <Receipt size={22} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-pgp-navy mb-2">Ketentuan Pembayaran</h3>
              <p className="text-xs text-gray-500 leading-relaxed">Siklus pembayaran standar Net 30-45 hari dari verifikasi faktur melalui portal penagihan elektronik kami yang terintegrasi.</p>
            </div>
          </div>
          <div className="bg-white p-8 rounded-md border border-gray-100 shadow-sm flex gap-5 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-red-50 text-pgp-red flex items-center justify-center rounded-sm shrink-0">
              <BarChart3 size={22} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-pgp-navy mb-2">Evaluasi & Ulasan Berkala</h3>
              <p className="text-xs text-gray-500 leading-relaxed">Vendor dievaluasi setiap kuartal berdasarkan ketepatan pengiriman, kualitas layanan, dan tingkat kepatuhan terhadap kontrak.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Become Partner CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="bg-pgp-navy rounded-md p-10 md:p-14 flex flex-col md:flex-row items-center gap-8 shadow-lg">
          <div className="flex-1 text-white">
            <h2 className="text-2xl font-bold mb-4 tracking-tight">Siap Menjadi Mitra Kami?</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-0">
              Mulai proses pendaftaran vendor Anda hari ini. Tim pengadaan kami akan memverifikasi dan merespons dalam 5-7 hari kerja.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link href="/e-procurement/register" className="bg-pgp-red hover:bg-pgp-red/80 text-white font-semibold px-8 py-3 rounded-sm transition-colors text-sm text-center whitespace-nowrap inline-flex items-center justify-center gap-2">
              Daftar Sekarang <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="flex items-center gap-3 bg-white p-4 rounded-md border border-gray-100 shadow-sm">
            <CheckCircle2 size={18} className="text-pgp-red shrink-0" />
            <span className="text-xs font-semibold text-pgp-navy">Isi formulir online</span>
          </div>
          <div className="flex items-center gap-3 bg-white p-4 rounded-md border border-gray-100 shadow-sm">
            <CheckCircle2 size={18} className="text-pgp-red shrink-0" />
            <span className="text-xs font-semibold text-pgp-navy">Unggah dokumen legalitas</span>
          </div>
          <div className="flex items-center gap-3 bg-white p-4 rounded-md border border-gray-100 shadow-sm">
            <CheckCircle2 size={18} className="text-pgp-red shrink-0" />
            <span className="text-xs font-semibold text-pgp-navy">Verifikasi & approval</span>
          </div>
        </div>
      </section>

      {/* Contact Assistance */}
      <section className="py-20 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="w-full md:w-1/2">
              <div className="aspect-[4/3] rounded-md overflow-hidden relative bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <div className="text-center p-8">
                  <Clock size={40} className="text-pgp-red mx-auto mb-3" />
                  <p className="text-pgp-navy font-bold text-lg mb-1">Butuh Bantuan?</p>
                  <p className="text-gray-500 text-sm">Tim kami siap membantu Anda</p>
                </div>
              </div>
            </div>
            <div className="w-full md:w-1/2 md:pl-4">
              <h2 className="text-3xl font-bold text-pgp-navy mb-4 tracking-tight">Hubungi Tim Pengadaan</h2>
              <p className="text-gray-500 mb-10 leading-relaxed text-sm">
                Meja pengadaan kami tersedia untuk membantu calon vendor dengan masalah registrasi atau pertanyaan seputar proses pengadaan.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-5 border border-gray-100 bg-[#F9F7F6] p-5 rounded-md">
                  <div className="w-12 h-12 bg-red-50 text-pgp-red flex items-center justify-center rounded-sm shrink-0">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Email Pengadaan</h4>
                    <a href="mailto:procurement@ptpgp.co.id" className="text-sm font-semibold text-pgp-navy hover:text-pgp-red transition-colors">procurement@ptpgp.co.id</a>
                  </div>
                </div>
                <div className="flex items-center gap-5 border border-gray-100 bg-[#F9F7F6] p-5 rounded-md">
                  <div className="w-12 h-12 bg-red-50 text-pgp-red flex items-center justify-center rounded-sm shrink-0">
                    <Phone size={20} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Telepon</h4>
                    <p className="text-sm font-semibold text-pgp-navy">(0254) 570700</p>
                    <p className="text-xs text-gray-400 mt-0.5">Senin - Jumat, 08:00 - 17:00</p>
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
