import { supabaseAdmin } from "@/lib/supabase";
import { FileText, Plus, Award, Briefcase, GraduationCap, Wrench, ShieldCheck, Save } from "lucide-react";

const SEED_JOBSPEC = [
  {
    id: 1,
    position: "Staff Akuntansi",
    department: "Finance",
    education: "D3/S1 Akuntansi",
    experience: "Min. 1 tahun",
    skills: ["Microsoft Excel", "Software Akuntansi", "Analisis Keuangan", "Pelaporan Keuangan"],
    certifications: ["Brevet A & B (nilai tambah)"],
  },
  {
    id: 2,
    position: "HR Officer",
    department: "HRD",
    education: "S1 Psikologi / Manajemen / Hukum",
    experience: "Min. 2 tahun",
    skills: ["Rekrutmen & Seleksi", "Hubungan Industrial", "Administrasi HR", "Komunikasi"],
    certifications: ["BNSP HR (nilai tambah)"],
  },
  {
    id: 3,
    position: "Software Developer",
    department: "IT",
    education: "S1 Teknik Informatika / Ilmu Komputer",
    experience: "Min. 2 tahun",
    skills: ["JavaScript/TypeScript", "React/Next.js", "Node.js", "Database SQL", "REST API", "Git"],
    certifications: ["Sertifikasi Cloud (AWS/GCP) - nilai tambah"],
  },
  {
    id: 4,
    position: "Operator Produksi",
    department: "Produksi",
    education: "SMA/SMK",
    experience: "Pengalaman di bidang produksi menjadi nilai tambah",
    skills: ["Pengoperasian Mesin", "Quality Control Dasar", "5S / K3", "Pencatatan Laporan"],
    certifications: ["Sertifikasi K3 (nilai tambah)"],
  },
  {
    id: 5,
    position: "Sales Representative",
    department: "Sales",
    education: "D3/S1 semua jurusan",
    experience: "Min. 2 tahun",
    skills: ["Negosiasi", "Presentasi", "CRM Software", "Komunikasi Persuasif", "Analisis Pasar"],
    certifications: ["SIM C", "Sertifikasi Sales (nilai tambah)"],
  },
  {
    id: 6,
    position: "Staff Gudang",
    department: "Logistik",
    education: "SMA/SMK",
    experience: "Min. 1 tahun di pergudangan",
    skills: ["Manajemen Inventaris", "Forklift Operation", "Warehouse Management System", "Pencatatan Stok"],
    certifications: ["Sertifikasi Operator Forklift"],
  },
];

export default async function SpesifikasiPekerjaan() {
  const { data: employees } = await supabaseAdmin
    .from("employees")
    .select("position, department")
    .neq("status", "Inactive");

  const uniquePositions = [...new Set((employees || []).map((e: Record<string, unknown>) => e.position as string).filter(Boolean))];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Spesifikasi Pekerjaan</h1>
        <p className="text-sm text-gray-500">Kelola spesifikasi dan persyaratan jabatan meliputi pendidikan, pengalaman, keterampilan, dan sertifikasi.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Jabatan Terisi", value: uniquePositions.length, icon: <Award size={18} />, color: "bg-blue-50 text-blue-600" },
          { label: "Spesifikasi Terdokumentasi", value: SEED_JOBSPEC.length, icon: <FileText size={18} />, color: "bg-emerald-50 text-emerald-600" },
          { label: "Belum Terspesifikasi", value: Math.max(uniquePositions.length - SEED_JOBSPEC.length, 0), icon: <Wrench size={18} />, color: "bg-amber-50 text-amber-600" },
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
                <h3 className="font-extrabold text-slate-800 text-sm">Tambah / Edit Spesifikasi</h3>
                <p className="text-xs text-slate-400 mt-0.5">Isi detail spesifikasi jabatan</p>
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
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Pendidikan Minimal</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30">
                  <option value="">Pilih Level Pendidikan</option>
                  <option>SMA/SMK</option>
                  <option>D3</option>
                  <option>S1</option>
                  <option>S2</option>
                  <option>S3</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Pengalaman (tahun)</label>
                <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30" placeholder="Contoh: Min. 2 tahun" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Keterampilan</label>
                <textarea className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30" rows={3} placeholder="Satu keterampilan per baris..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Sertifikasi</label>
                <textarea className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30" rows={2} placeholder="Satu sertifikasi per baris..." />
              </div>
              <button type="submit" className="w-full px-4 py-2.5 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center justify-center gap-2">
                <Save size={14} /> Simpan Spesifikasi
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-blue-600" />
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Daftar Spesifikasi Pekerjaan</h3>
                <p className="text-xs text-slate-400 mt-0.5">Persyaratan detail setiap jabatan</p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            {SEED_JOBSPEC.length === 0 ? (
              <div className="p-12 text-center">
                <Award size={40} className="mx-auto text-slate-300 mb-4" />
                <p className="text-sm text-slate-500">Belum ada spesifikasi pekerjaan.</p>
                <p className="text-xs text-slate-400 mt-1">Tambahkan spesifikasi untuk setiap jabatan.</p>
              </div>
            ) : (
              SEED_JOBSPEC.map((spec) => (
                <div key={spec.id} className="p-5 hover:bg-slate-50/30 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                        <Award size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-slate-800">{spec.position}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Briefcase size={10} /> {spec.department}
                        </p>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 hover:bg-slate-100 transition-colors">
                      Edit
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100">
                      <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <GraduationCap size={12} /> Pendidikan
                      </p>
                      <p className="text-[10px] text-blue-800">{spec.education}</p>
                    </div>

                    <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100">
                      <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <GraduationCap size={12} /> Pengalaman
                      </p>
                      <p className="text-[10px] text-emerald-800">{spec.experience}</p>
                    </div>

                    <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-100">
                      <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Wrench size={12} /> Keterampilan
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {spec.skills.map((s, i) => (
                          <span key={i} className="text-[9px] bg-white text-amber-800 px-1.5 py-0.5 rounded-full border border-amber-200">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-red-50/50 rounded-xl p-3 border border-red-100">
                      <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <ShieldCheck size={12} /> Sertifikasi
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {spec.certifications.map((s, i) => (
                          <span key={i} className="text-[9px] bg-white text-red-800 px-1.5 py-0.5 rounded-full border border-red-200">
                            {s}
                          </span>
                        ))}
                      </div>
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
