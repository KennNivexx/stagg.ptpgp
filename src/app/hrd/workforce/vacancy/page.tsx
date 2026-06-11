import { supabaseAdmin } from "@/lib/supabase";
import { Briefcase, Plus, MapPin, Clock, Users, CheckCircle2 } from "lucide-react";

export default async function PerencanaanLowongan() {
  const { data: jobs } = await supabaseAdmin
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: employees } = await supabaseAdmin
    .from("employees")
    .select("department")
    .neq("status", "Inactive");

  const jobList = (jobs || []) as Record<string, unknown>[];
  const openJobs = jobList.filter((j) => j.status === "Open");
  const closedJobs = jobList.filter((j) => j.status === "Closed");
  const draftJobs = jobList.filter((j) => j.status === "Draft");

  const deptCounts: Record<string, number> = {};
  (employees || []).forEach((e: Record<string, unknown>) => {
    const dept = e.department as string;
    if (dept) deptCounts[dept] = (deptCounts[dept] || 0) + 1;
  });

  const vacancySummary = Object.entries(deptCounts).map(([dept, count]) => {
    const planned = Math.max(Math.ceil(count * 0.15), 1);
    const active = jobList.filter((j) => j.department === dept && j.status === "Open").length;
    return { department: dept, totalEmployees: count, planned, active, remaining: planned - active };
  }).sort((a, b) => b.active - a.active);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Perencanaan Lowongan</h1>
        <p className="text-sm text-gray-500">Pantau lowongan aktif, rencanakan posisi baru, dan kelola status persetujuan.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Lowongan", value: jobList.length, icon: <Briefcase size={18} />, color: "bg-blue-50 text-blue-600" },
          { label: "Lowongan Aktif", value: openJobs.length, icon: <CheckCircle2 size={18} />, color: "bg-emerald-50 text-emerald-600" },
          { label: "Lowongan Tertutup", value: closedJobs.length, icon: <Clock size={18} />, color: "bg-slate-100 text-slate-500" },
          { label: "Draft / Rencana", value: draftJobs.length, icon: <Users size={18} />, color: "bg-amber-50 text-amber-600" },
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Plus size={16} className="text-[#CC0000]" />
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Rencana Lowongan Baru</h3>
                <p className="text-xs text-slate-400 mt-0.5">Ajukan persetujuan lowongan baru</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <form className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Judul Posisi</label>
                <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30" placeholder="Contoh: Staff Akuntansi" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Departemen</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30">
                  <option value="">Pilih Departemen</option>
                  {Object.keys(deptCounts).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Lokasi</label>
                <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30" placeholder="Contoh: Jakarta" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Status Persetujuan</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30">
                  <option value="Draft">Draft (Menunggu Review)</option>
                  <option value="Open">Disetujui - Langsung Buka</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Deskripsi</label>
                <textarea className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30" rows={3} placeholder="Deskripsikan kebutuhan lowongan..." />
              </div>
              <button type="submit" className="w-full px-4 py-2.5 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center justify-center gap-2">
                <Plus size={14} /> Simpan Lowongan
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Briefcase size={16} className="text-blue-600" />
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">Daftar Lowongan Aktif</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Lowongan yang sedang dibuka</p>
                </div>
              </div>
            </div>
            <div className="divide-y divide-slate-50">
              {openJobs.length === 0 ? (
                <div className="p-12 text-center">
                  <Briefcase size={40} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-sm text-slate-500">Belum ada lowongan aktif.</p>
                  <p className="text-xs text-slate-400 mt-1">Buat lowongan baru untuk memulai rekrutmen.</p>
                </div>
              ) : (
                openJobs.map((job: Record<string, unknown>) => (
                  <div key={job.id as string} className="p-5 hover:bg-slate-50/30 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{job.title as string}</p>
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1"><MapPin size={10} /> {job.location as string || "-"}</span>
                          <span className="flex items-center gap-1"><Users size={10} /> {job.department as string || "-"}</span>
                          <span className="flex items-center gap-1"><Clock size={10} /> {job.type as string || "-"}</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700">Aktif</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-amber-600" />
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">Ringkasan Perencanaan per Departemen</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Target lowongan vs yang sudah aktif</p>
                </div>
              </div>
            </div>
            <div className="divide-y divide-slate-50">
              {vacancySummary.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-xs text-slate-400">Belum ada data departemen.</p>
                </div>
              ) : (
                vacancySummary.map((vs) => (
                  <div key={vs.department} className="p-4 hover:bg-slate-50/30 transition-colors flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{vs.department}</p>
                      <p className="text-[10px] text-slate-400">{vs.totalEmployees} karyawan saat ini</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400">Rencana</p>
                        <p className="text-sm font-bold text-slate-700">{vs.planned}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400">Aktif</p>
                        <p className="text-sm font-bold text-emerald-600">{vs.active}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400">Sisa</p>
                        <p className={`text-sm font-bold ${vs.remaining > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                          {vs.remaining > 0 ? vs.remaining : "Penuh"}
                        </p>
                      </div>
                      <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${vs.planned > 0 && vs.active >= vs.planned ? "bg-emerald-500" : "bg-blue-500"}`}
                          style={{ width: `${vs.planned > 0 ? Math.min(Math.round((vs.active / vs.planned) * 100), 100) : 0}%` }} />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
