import { supabaseAdmin } from "@/lib/supabase";
import { Users, UserCheck, FileText, ShieldCheck } from "lucide-react";
import SectionQuickLinks from "@/components/hrd/SectionQuickLinks";
import EmptyState from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function Employee360Hub() {
  const [{ data: employees }, { data: contracts }, { data: licenses }] = await Promise.all([
    supabaseAdmin.from("karyawan").select("id, full_name, position, department, status, nik, emergency_phone, marital_status, ktp_address").neq("status", "Inactive"),
    supabaseAdmin.from("kontrak_kerja").select("id"),
    supabaseAdmin.from("sim_sertifikasi_karyawan").select("id"),
  ]);

  const empList = (employees || []) as Record<string, unknown>[];
  const complete = empList.filter(e => e.nik && e.emergency_phone && e.marital_status && e.ktp_address).length;
  const completePct = empList.length > 0 ? Math.round((complete / empList.length) * 100) : 0;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Employee 360°</h1>
        <p className="text-sm text-gray-500">Profil terpadu karyawan — data personal, kepegawaian, performa, kompensasi, hingga aset perusahaan dalam satu tempat.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Karyawan Aktif", value: empList.length, icon: Users, color: "bg-blue-50 text-blue-600" },
          { label: "Data Personal Lengkap", value: `${completePct}%`, icon: UserCheck, color: "bg-emerald-50 text-emerald-600" },
          { label: "Kontrak Terdaftar", value: (contracts || []).length, icon: FileText, color: "bg-amber-50 text-amber-600" },
          { label: "SIM & Sertifikasi", value: (licenses || []).length, icon: ShieldCheck, color: "bg-purple-50 text-purple-600" },
        ].map(s => (
          <div key={s.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${s.color}`}><s.icon size={18} /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p>
                <p className="text-xl font-extrabold text-slate-800">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <SectionQuickLinks groupLabel="Employee 360°" excludeHref="/hrd/infrastructure" />

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Users size={16} /></div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">Buka Profil 360°</h3>
            <p className="text-xs text-slate-400">Klik karyawan untuk melihat profil terpadu lengkap dengan 11 kategori data</p>
          </div>
        </div>
        {empList.length === 0 ? (
          <EmptyState icon={Users} title="Belum ada data karyawan." className="border-none" />
        ) : (
          <div className="divide-y divide-slate-50">
            {empList.slice(0, 8).map(e => (
              <a key={e.id as string} href={`/hrd/infrastructure/employees/${e.id}`}
                className="px-6 py-3 flex items-center justify-between hover:bg-slate-50/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs border border-slate-200">
                    {((e.full_name as string) || "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{e.full_name as string}</p>
                    <p className="text-[11px] text-slate-400">{(e.position as string) || "—"} &bull; {(e.department as string) || "—"}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#CC0000]">Lihat Profil &rarr;</span>
              </a>
            ))}
          </div>
        )}
        {empList.length > 8 && (
          <div className="px-6 py-3 border-t border-slate-50">
            <a href="/hrd/infrastructure/employees" className="text-xs font-bold text-[#CC0000] hover:underline">
              Lihat semua {empList.length} karyawan →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
