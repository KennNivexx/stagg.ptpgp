import { supabaseAdmin } from "@/lib/supabase";
import { FileText, Plus, Award, Briefcase, Save, ListChecks, BookOpen } from "lucide-react";

const SEED_JOBDESC = [
  {
    id: 1,
    position: "Staff Akuntansi",
    department: "Finance",
    responsibilities: [
      "Mencatat transaksi keuangan harian",
      "Menyusun laporan keuangan bulanan",
      "Melakukan rekonsiliasi bank",
      "Menyiapkan faktur dan tagihan",
    ],
    requirements: [
      "Pendidikan minimal D3/S1 Akuntansi",
      "Pengalaman min. 1 tahun di bidang akuntansi",
      "Menguasai Microsoft Excel",
    ],
    qualifications: [
      "Teliti dan akurat dalam bekerja",
      "Mampu bekerja dalam deadline ketat",
      "Memahami PSAK dan perpajakan",
    ],
  },
  {
    id: 2,
    position: "HR Officer",
    department: "HRD",
    responsibilities: [
      "Mengelola data dan arsip karyawan",
      "Menangani proses rekrutmen dan onboarding",
      "Mengelola absensi dan cuti karyawan",
      "Membantu pelaksanaan program training",
    ],
    requirements: [
      "Pendidikan minimal S1 Psikologi/Manajemen/Hukum",
      "Pengalaman min. 2 tahun di bidang HR",
      "Memahami UU Ketenagakerjaan",
    ],
    qualifications: [
      "Kemampuan komunikasi yang baik",
      "Mampu menjaga kerahasiaan data",
      "Terampil menggunakan HRIS",
    ],
  },
  {
    id: 3,
    position: "Software Developer",
    department: "IT",
    responsibilities: [
      "Mengembangkan dan memelihara aplikasi perusahaan",
      "Melakukan testing dan debugging",
      "Menyusun dokumentasi teknis",
      "Berkolaborasi dengan tim dalam pengembangan fitur",
    ],
    requirements: [
      "Pendidikan minimal S1 Teknik Informatika",
      "Pengalaman min. 2 tahun sebagai developer",
      "Menguasai JavaScript/TypeScript dan React atau Next.js",
    ],
    qualifications: [
      "Problem solving yang kuat",
      "Mampu bekerja dalam tim",
      "Memahami database SQL dan REST API",
    ],
  },
  {
    id: 4,
    position: "Operator Produksi",
    department: "Produksi",
    responsibilities: [
      "Mengoperasikan mesin produksi",
      "Memantau kualitas hasil produksi",
      "Melakukan perawatan mesin rutin",
      "Mencatat hasil produksi harian",
    ],
    requirements: [
      "Pendidikan minimal SMA/SMK",
      "Pengalaman di bidang produksi menjadi nilai tambah",
      "Mampu bekerja dalam sistem shift",
    ],
    qualifications: [
      "Disiplin dan bertanggung jawab",
      "Sehat jasmani",
      "Cepat belajar prosedur baru",
    ],
  },
  {
    id: 5,
    position: "Sales Representative",
    department: "Sales",
    responsibilities: [
      "Mencari dan mengembangkan klien baru",
      "Mempertahankan hubungan dengan klien existing",
      "Mencapai target penjualan bulanan",
      "Menyusun laporan aktivitas penjualan",
    ],
    requirements: [
      "Pendidikan minimal D3/S1 semua jurusan",
      "Pengalaman min. 2 tahun di bidang sales",
      "Memiliki SIM C dan kendaraan pribadi",
    ],
    qualifications: [
      "Kemampuan negosiasi yang baik",
      "Berorientasi pada target",
      "Kepribadian yang ramah dan persuasif",
    ],
  },
];

export default async function DeskripsiPekerjaan() {
  const { data: employees } = await supabaseAdmin
    .from("employees")
    .select("position, department")
    .neq("status", "Inactive");

  const uniquePositions = [...new Set((employees || []).map((e: Record<string, unknown>) => e.position as string).filter(Boolean))];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Deskripsi Pekerjaan</h1>
        <p className="text-sm text-gray-500">Kelola deskripsi pekerjaan untuk setiap posisi termasuk tanggung jawab, persyaratan, dan kualifikasi.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Jabatan Terisi", value: uniquePositions.length, icon: <Award size={18} />, color: "bg-blue-50 text-blue-600" },
          { label: "Deskripsi Pekerjaan", value: SEED_JOBDESC.length, icon: <FileText size={18} />, color: "bg-emerald-50 text-emerald-600" },
          { label: "Belum Didokumentasikan", value: Math.max(uniquePositions.length - SEED_JOBDESC.length, 0), icon: <BookOpen size={18} />, color: "bg-amber-50 text-amber-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${stat.color}`}>{stat.icon}</div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{stat.label}</p>
                <p className="text-xl font-extrabold text-slate-800">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Plus size={16} className="text-[#CC0000]" />
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Tambah / Edit Deskripsi</h3>
                <p className="text-xs text-slate-400 mt-0.5">Isi deskripsi pekerjaan</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <form className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Jabatan</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30">
                  <option value="">Pilih Jabatan</option>
                  {uniquePositions.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Departemen</label>
                <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30" placeholder="Nama departemen" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Tanggung Jawab</label>
                <textarea className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30" rows={4} placeholder="Satu tanggung jawab per baris..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Persyaratan</label>
                <textarea className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30" rows={3} placeholder="Satu persyaratan per baris..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Kualifikasi</label>
                <textarea className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30" rows={3} placeholder="Satu kualifikasi per baris..." />
              </div>
              <button type="submit" className="w-full px-4 py-2.5 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center justify-center gap-2">
                <Save size={14} /> Simpan Deskripsi
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-blue-600" />
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Daftar Deskripsi Pekerjaan</h3>
                <p className="text-xs text-slate-400 mt-0.5">Template job description per posisi</p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            {SEED_JOBDESC.length === 0 ? (
              <div className="p-12 text-center">
                <FileText size={40} className="mx-auto text-slate-300 mb-4" />
                <p className="text-sm text-slate-500">Belum ada deskripsi pekerjaan.</p>
                <p className="text-xs text-slate-400 mt-1">Tambahkan deskripsi untuk setiap jabatan yang ada.</p>
              </div>
            ) : (
              SEED_JOBDESC.map((jd) => (
                <div key={jd.id} className="p-6 hover:bg-slate-50/30 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                        <Award size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-slate-800">{jd.position}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Briefcase size={10} /> {jd.department}
                        </p>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 hover:bg-slate-100 transition-colors">
                      Edit
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <ListChecks size={12} /> Tanggung Jawab
                      </p>
                      <ul className="space-y-1">
                        {jd.responsibilities.map((r, i) => (
                          <li key={i} className="text-[10px] text-slate-600 flex items-start gap-1.5">
                            <span className="text-blue-500 mt-0.5 shrink-0">&bull;</span>
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <ListChecks size={12} /> Persyaratan
                      </p>
                      <ul className="space-y-1">
                        {jd.requirements.map((r, i) => (
                          <li key={i} className="text-[10px] text-slate-600 flex items-start gap-1.5">
                            <span className="text-emerald-500 mt-0.5 shrink-0">&bull;</span>
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <ListChecks size={12} /> Kualifikasi
                      </p>
                      <ul className="space-y-1">
                        {jd.qualifications.map((r, i) => (
                          <li key={i} className="text-[10px] text-slate-600 flex items-start gap-1.5">
                            <span className="text-amber-500 mt-0.5 shrink-0">&bull;</span>
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
