"use client";

import { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, X } from "lucide-react";

const LEVELS = [
  {
    level: 0,
    title: "Tidak Memiliki Pengetahuan",
    color: "bg-gray-100 text-gray-700 border-gray-300",
    description: "Sama sekali belum memiliki pengetahuan, keterampilan, atau pengalaman terkait kompetensi ini. Belum pernah terpapar, belum menerima pelatihan, dan belum memahami konsep dasarnya.",
    indicators: [
      "Belum pernah mendengar atau terpapar dengan istilah atau konsep kompetensi ini",
      "Tidak memahami terminologi, definisi, atau ruang lingkup kompetensi",
      "Tidak dapat melakukan tugas atau aktivitas apapun yang berkaitan dengan kompetensi ini",
      "Membutuhkan pengenalan menyeluruh dan pelatihan dari tingkat paling dasar",
      "Mungkin baru pertama kali mendengar tentang kompetensi ini",
    ],
    example: "Seorang karyawan baru yang sebelumnya tidak pernah menggunakan Microsoft Excel dan tidak mengetahui fungsi dasarnya.",
    action: "Wajib mengikuti pelatihan dasar (Basic Training) sebelum dapat ditugaskan pada pekerjaan yang membutuhkan kompetensi ini.",
  },
  {
    level: 1,
    title: "Mengetahui Konsep Dasar & Teori",
    color: "bg-red-50 text-red-700 border-red-200",
    description: "Memiliki pengetahuan dasar berupa pemahaman teori, konsep, dan terminologi. Mengetahui 'apa' dan 'mengapa' dari kompetensi ini, namun belum dapat menerapkan secara praktis tanpa bimbingan intensif.",
    indicators: [
      "Memahami istilah, definisi, dan konsep dasar dari kompetensi ini",
      "Mengetahui teori, prinsip, dan kerangka kerja yang mendasarinya",
      "Dapat menjelaskan secara lisan atau tertulis tentang kompetensi ini",
      "Belum dapat mengaplikasikan pengetahuan ke dalam praktik kerja nyata",
      "Memerlukan bimbingan langkah-demi-langkah untuk memulai penerapan",
    ],
    example: "Seorang staf yang sudah membaca buku panduan Excel, mengetahui fungsi SUM, AVERAGE, dan VLOOKUP secara teori, tetapi belum pernah menggunakannya dalam pekerjaan sehari-hari.",
    action: "Disarankan mengikuti pelatihan praktik (Hands-on Training) dengan pendampingan intensif untuk mulai menerapkan pengetahuan ke dalam pekerjaan.",
  },
  {
    level: 2,
    title: "Dapat Melakukan dengan Bimbingan",
    color: "bg-orange-50 text-orange-700 border-orange-200",
    description: "Mampu melaksanakan tugas-tugas dasar yang berkaitan dengan kompetensi ini, namun masih memerlukan supervisi, arahan, dan pemeriksaan berkala dari atasan atau rekan yang lebih senior. Hasil kerja masih perlu diverifikasi.",
    indicators: [
      "Dapat melakukan tugas-tugas dasar terkait kompetensi ini dengan arahan",
      "Mengetahui prosedur dan langkah-langkah kerja standar",
      "Membutuhkan supervisi rutin dan bimbingan dari atasan atau mentor",
      "Hasil pekerjaan masih perlu diperiksa dan dikoreksi secara berkala",
      "Mulai memahami alur kerja praktis dan dapat mengikuti instruksi tertulis",
    ],
    example: "Seorang staf yang dapat membuat laporan sederhana di Excel dengan mengikuti template dan instruksi dari supervisor, namun masih sering bertanya dan perlu koreksi.",
    action: "Dapat ditugaskan pada pekerjaan rutin dengan pengawasan, sambil terus mengikuti pelatihan lanjutan untuk meningkatkan kemandirian.",
  },
  {
    level: 3,
    title: "Dapat Melakukan Secara Mandiri",
    color: "bg-yellow-50 text-yellow-700 border-yellow-200",
    description: "Mampu melaksanakan tugas secara mandiri tanpa memerlukan supervisi terus-menerus. Dapat diandalkan untuk menyelesaikan pekerjaan dengan kualitas yang konsisten. Mulai mampu memecahkan masalah yang umum terjadi.",
    indicators: [
      "Dapat menyelesaikan tugas secara mandiri tanpa supervisi langsung",
      "Mampu memecahkan masalah umum yang muncul dalam pekerjaan sehari-hari",
      "Hasil kerja konsisten, akurat, dan dapat diandalkan",
      "Mampu mengelola waktu dan prioritas pekerjaan secara efektif",
      "Mulai dapat berbagi pengetahuan dasar kepada rekan yang lebih junior",
      "Dapat bekerja dengan standar kualitas yang ditetapkan",
    ],
    example: "Seorang staf yang dapat membuat laporan keuangan bulanan lengkap di Excel secara mandiri, termasuk formula kompleks, pivot table, dan grafik, tanpa perlu bantuan.",
    action: "Layak diberikan tanggung jawab penuh pada area pekerjaan yang membutuhkan kompetensi ini. Dapat dijadikan mentor bagi level 1-2.",
  },
  {
    level: 4,
    title: "Mahir & Dapat Membimbing",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    description: "Sangat menguasai kompetensi ini. Mampu menangani situasi kompleks dan tidak rutin. Dapat melatih, membimbing, dan mentransfer pengetahuan kepada orang lain. Mulai berkontribusi pada pengembangan tim dan perbaikan proses.",
    indicators: [
      "Sangat menguasai seluruh aspek kompetensi ini, termasuk kasus kompleks",
      "Dapat melatih, membimbing, dan mengembangkan orang lain",
      "Mampu menangani situasi tidak rutin dan pengecualian dengan baik",
      "Dapat mengidentifikasi area perbaikan dan mengusulkan solusi",
      "Menjadi rujukan dan tempat bertanya bagi rekan kerja",
      "Mampu mengoptimalkan proses dan meningkatkan efisiensi kerja",
    ],
    example: "Seorang manajer yang tidak hanya mahir Excel, tetapi juga dapat mengajarkan teknik tingkat lanjut (macro, VBA, Power Query) kepada tim dan menciptakan dashboard yang digunakan seluruh departemen.",
    action: "Dapat ditunjuk sebagai trainer internal, mentor, atau coach. Layak dipertimbangkan untuk promosi ke posisi yang lebih tinggi.",
  },
  {
    level: 5,
    title: "Ahli, Inovator, & Pembuat Standar",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    description: "Diakui sebagai pakar dan rujukan utama untuk kompetensi ini di tingkat organisasi. Mampu menciptakan standar, metodologi, dan inovasi baru. Berkontribusi signifikan terhadap pengembangan organisasi secara keseluruhan.",
    indicators: [
      "Diakui sebagai pakar dan rujukan utama di seluruh organisasi",
      "Mampu menciptakan standar, kebijakan, dan best practice baru",
      "Dapat berinovasi dan mengembangkan metode, tools, atau pendekatan baru",
      "Berkontribusi pada pengembangan strategis organisasi",
      "Menjadi pembicara, penulis, atau pengajar di bidang kompetensi ini",
      "Mampu memprediksi tren dan mengantisipasi kebutuhan masa depan",
    ],
    example: "Seorang direktur atau kepala divisi yang menciptakan sistem pelaporan keuangan terintegrasi berbasis Excel dan Power BI yang menjadi standar di seluruh perusahaan, serta diundang sebagai pembicara di konferensi industri.",
    action: "Merupakan aset strategis organisasi. Dapat ditugaskan untuk proyek transformasi, inovasi, atau pengembangan kapabilitas organisasi. Layak mendapatkan program retensi dan pengembangan karir khusus.",
  },
];

export default function PanduanLevel() {
  const [open, setOpen] = useState(false);
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 rounded-xl text-xs font-bold transition-colors"
      >
        <BookOpen size={14} />
        Panduan Level Kompetensi (0-5)
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center p-4 pt-[5vh]">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Panduan Level Kompetensi</h2>
                <p className="text-xs text-slate-500 mt-0.5">Referensi lengkap untuk menentukan tingkat kompetensi karyawan (skala 0-5)</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-4 flex-1">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
                <p className="font-bold text-amber-800 mb-1">📌 Cara Menggunakan Panduan Ini</p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Panduan ini digunakan untuk menilai tingkat penguasaan kompetensi setiap karyawan secara objektif dan terstandarisasi. 
                  Penilaian dilakukan oleh Kepala Divisi/Department Manager terhadap anggota timnya. 
                  Setiap level bersifat kumulatif — karyawan harus memenuhi kriteria level sebelumnya sebelum naik ke level berikutnya. 
                  Hasil penilaian akan digunakan untuk analisis kesenjangan (gap analysis), perencanaan pelatihan, dan pengembangan karir.
                </p>
              </div>

              {LEVELS.map((lv) => (
                <div key={lv.level} className={`border rounded-xl overflow-hidden ${lv.color}`}>
                  <button
                    onClick={() => setExpandedLevel(expandedLevel === lv.level ? null : lv.level)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left hover:opacity-90 transition-opacity"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center font-black text-lg shadow-sm">
                          {lv.level}
                        </span>
                        <div>
                          <h3 className="font-extrabold text-sm">{lv.title}</h3>
                          <p className="text-xs opacity-80 mt-0.5">Level {lv.level}</p>
                        </div>
                      </div>
                    </div>
                    {expandedLevel === lv.level ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>

                  {expandedLevel === lv.level && (
                    <div className="px-5 pb-5 space-y-4 bg-white/60">
                      <div>
                        <p className="text-xs leading-relaxed opacity-90">{lv.description}</p>
                      </div>

                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider mb-2 opacity-70">Indikator</p>
                        <ul className="space-y-1.5">
                          {lv.indicators.map((ind, i) => (
                            <li key={i} className="text-xs flex gap-2 opacity-80 leading-relaxed">
                              <span className="shrink-0 mt-0.5">•</span>
                              {ind}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-white/80 rounded-xl p-3 border border-inherit">
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-60">Contoh</p>
                        <p className="text-xs leading-relaxed opacity-80">{lv.example}</p>
                      </div>

                      <div className="bg-white/80 rounded-xl p-3 border border-inherit">
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-60">Tindakan yang Direkomendasikan</p>
                        <p className="text-xs leading-relaxed opacity-80">{lv.action}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
