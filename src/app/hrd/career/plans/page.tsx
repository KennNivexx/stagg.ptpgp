import { supabaseAdmin } from "@/lib/supabase";
import { Clipboard, Plus, User, Target, Calendar, BookOpen, CheckCircle, Clock } from "lucide-react";

export default async function CareerPlansPage() {
  const { data: employees } = await supabaseAdmin
    .from("employees")
    .select("id, full_name, department, position")
    .limit(100);

  const developmentPlans = [
    {
      id: 1, employee: "Budi Santoso", department: "Operasional", position: "Supervisor Gudang",
      goals: "Menjadi Manager Operasional dalam 2 tahun",
      trainings: ["Leadership Training", "Supply Chain Management", "Risk Management"],
      timeline: "Jan 2026 - Des 2027",
      mentor: "Rudi Hartono (Manager Operasional)",
      progress: 45,
    },
    {
      id: 2, employee: "Siti Rahayu", department: "Keuangan", position: "Staff Accounting",
      goals: "Menjadi Supervisor Accounting dan mengambil sertifikasi CPA",
      trainings: ["Advanced Accounting", "Brevet Pajak A&B", "Financial Analysis"],
      timeline: "Mar 2026 - Des 2027",
      mentor: "Sari Indah (Supervisor Finance)",
      progress: 30,
    },
    {
      id: 3, employee: "Ahmad Fauzi", department: "Operasional", position: "Staff Logistik",
      goals: "Menjadi Supervisor Distribusi",
      trainings: ["Logistics Management", "Warehouse Management System", "Safety Leadership"],
      timeline: "Jun 2026 - Jun 2028",
      mentor: "Budi Santoso (Supervisor Gudang)",
      progress: 15,
    },
    {
      id: 4, employee: "Dian Permata", department: "SDM", position: "HR Officer",
      goals: "Menjadi HR Manager dengan spesialisasi Talent Management",
      trainings: ["Talent Management", "Industrial Relations", "HR Analytics"],
      timeline: "Jan 2026 - Des 2028",
      mentor: "-",
      progress: 10,
    },
    {
      id: 5, employee: "Dewi Lestari", department: "IT", position: "System Analyst",
      goals: "Menjadi IT Manager fokus pada digital transformation",
      trainings: ["Cloud Architecture", "ITIL Certification", "Project Management"],
      timeline: "Apr 2026 - Apr 2028",
      mentor: "Hendra Gunawan (IT Support)",
      progress: 25,
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Rencana Pengembangan</h1>
          <p className="text-sm text-gray-500">Rencana pengembangan karir dan kompetensi karyawan.</p>
        </div>
        <button className="px-4 py-2 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2">
          <Plus size={14} /> Tambah Rencana
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Clipboard size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Rencana</p>
              <p className="text-xl font-extrabold text-slate-800">{developmentPlans.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><Target size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Rata-rata Progres</p>
              <p className="text-xl font-extrabold text-slate-800">
                {Math.round(developmentPlans.reduce((sum, p) => sum + p.progress, 0) / developmentPlans.length)}%
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><User size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Karyawan Terlibat</p>
              <p className="text-xl font-extrabold text-slate-800">{developmentPlans.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {developmentPlans.map((plan) => (
            <div key={plan.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#1A2530] to-slate-700 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {plan.employee.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800">{plan.employee}</h3>
                    <p className="text-[10px] text-slate-400">{plan.position} - {plan.department}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-extrabold text-[#CC0000]">{plan.progress}%</div>
                  <p className="text-[9px] text-slate-400">Progres</p>
                </div>
              </div>

              <div className="w-full bg-slate-100 rounded-full h-2 mb-4 overflow-hidden">
                <div className="bg-[#CC0000] h-2 rounded-full" style={{ width: `${plan.progress}%` }}></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px]">
                <div>
                  <p className="font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><Target size={10} /> Tujuan</p>
                  <p className="text-slate-700 font-medium">{plan.goals}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><Calendar size={10} /> Timeline</p>
                  <p className="text-slate-700 font-medium">{plan.timeline}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><BookOpen size={10} /> Pelatihan</p>
                  <div className="flex flex-wrap gap-1">
                    {plan.trainings.map((t) => (
                      <span key={t} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[9px] font-semibold">{t}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><User size={10} /> Mentor</p>
                  <p className="text-slate-700 font-medium">{plan.mentor}</p>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-50">
                <button className="px-3 py-1.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">Detail</button>
                <button className="px-3 py-1.5 text-[10px] font-bold bg-[#CC0000]/10 text-[#CC0000] rounded-lg hover:bg-[#CC0000]/20 transition-colors">Edit</button>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">Tambah Rencana Pengembangan</h3>
              <p className="text-xs text-slate-400 mt-0.5">Buat rencana pengembangan baru</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Karyawan</label>
                <select className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] bg-white">
                  <option value="">Pilih Karyawan</option>
                  {employees?.map((e: Record<string, unknown>) => (
                    <option key={e.id as string} value={e.id as string}>{e.full_name as string}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tujuan Pengembangan</label>
                <textarea rows={2} placeholder="Target karir yang ingin dicapai..." className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] resize-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pelatihan Dibutuhkan</label>
                <textarea rows={2} placeholder="Jenis pelatihan, pisahkan dengan koma..." className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] resize-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Timeline</label>
                <input type="text" placeholder="Jan 2026 - Des 2027" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mentor</label>
                <select className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] bg-white">
                  <option value="">Pilih Mentor (opsional)</option>
                  {employees?.slice(0, 10).map((e: Record<string, unknown>) => (
                    <option key={e.id as string} value={e.id as string}>{e.full_name as string}</option>
                  ))}
                </select>
              </div>
              <button className="w-full px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center justify-center gap-2">
                <Plus size={14} /> Simpan Rencana
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#1A2530] to-slate-800 rounded-2xl p-6 text-white shadow-sm">
            <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-400" />
              Mengapa Perlu Rencana Pengembangan?
            </h4>
            <ul className="space-y-2 text-[11px] text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">&#9679;</span>
                <span>Memetakan jalur karir yang jelas untuk setiap karyawan</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">&#9679;</span>
                <span>Mengidentifikasi kebutuhan pelatihan dan pengembangan</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">&#9679;</span>
                <span>Meningkatkan retensi karyawan melalui prospek karir</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">&#9679;</span>
                <span>Membangun suksesi kepemimpinan yang berkelanjutan</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
