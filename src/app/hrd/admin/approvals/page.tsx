import { supabaseAdmin } from "@/lib/supabase";
import { CheckCircle, ArrowRight, Clock, FileText, Users } from "lucide-react";
import ApprovalsForm from "./ApprovalsForm";

export default async function AlurPersetujuan() {
  const workflowDefs = [
    { name: "Cuti", icon: Clock, desc: "Persetujuan pengajuan cuti karyawan", steps: ["Karyawan Mengajukan", "Atasan Langsung", "HRD", "Disetujui"], color: "bg-blue-50 text-blue-600" },
    { name: "Lembur", icon: Clock, desc: "Persetujuan pengajuan lembur", steps: ["Karyawan Mengajukan", "Atasan Langsung", "Manager", "Disetujui"], color: "bg-amber-50 text-amber-600" },
    { name: "Pelatihan", icon: FileText, desc: "Persetujuan permintaan pelatihan", steps: ["Karyawan Mengajukan", "Manager", "HRD", "Disetujui"], color: "bg-purple-50 text-purple-600" },
    { name: "Promosi", icon: Users, desc: "Persetujuan kenaikan jabatan", steps: ["Manager Mengajukan", "HRD Review", "Direktur", "Disetujui"], color: "bg-emerald-50 text-emerald-600" },
    { name: "Pengunduran Diri", icon: Users, desc: "Proses persetujuan resign", steps: ["Karyawan Mengajukan", "Atasan Langsung", "HRD", "Exit Process"], color: "bg-red-50 text-red-600" },
  ];

  const { data: managers } = await supabaseAdmin
    .from("karyawan")
    .select("id, full_name, position")
    .or("position.ilike.%Manager%, position.ilike.%Direktur%, position.ilike.%Head%")
    .neq("status", "Resigned")
    .order("full_name")
    .limit(15);

  const workflowNames = workflowDefs.map((w) => w.name);

  const today = new Date().toISOString().split("T")[0];
  const [
    { count: pendingCount },
    { count: approvedCount },
    { count: rejectedCount },
  ] = await Promise.all([
    supabaseAdmin.from("pengajuan_cuti").select("*", { count: "exact", head: true }).eq("status", "Menunggu"),
    supabaseAdmin.from("pengajuan_cuti").select("*", { count: "exact", head: true }).eq("status", "Disetujui").gte("updated_at", today),
    supabaseAdmin.from("pengajuan_cuti").select("*", { count: "exact", head: true }).eq("status", "Ditolak").gte("updated_at", today),
  ]);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Alur Persetujuan</h1>
        <p className="text-sm text-gray-500">Konfigurasi workflow persetujuan untuk berbagai proses HR.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {workflowDefs.map((wf) => (
          <div key={wf.name} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 ${wf.color} rounded-lg`}><wf.icon size={16} /></div>
              <div>
                <p className="text-xs font-extrabold text-slate-800">{wf.name}</p>
                <p className="text-[10px] text-slate-400">{wf.desc}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {wf.steps.map((step, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{step}</span>
                  {i < wf.steps.length - 1 && <ArrowRight size={10} className="text-slate-300" />}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <ApprovalsForm
        managers={(managers || []) as Array<{ id: string; full_name: string; position: string }>}
        workflows={workflowNames}
      />

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle size={18} /></div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">Statistik Approval</h3>
            <p className="text-xs text-slate-400">Ringkasan persetujuan hari ini</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Menunggu",  value: pendingCount  ?? 0, color: "text-amber-600" },
            { label: "Disetujui (Hari Ini)", value: approvedCount ?? 0, color: "text-emerald-600" },
            { label: "Ditolak (Hari Ini)",   value: rejectedCount ?? 0, color: "text-red-600" },
          ].map((s) => (
            <div key={s.label} className="text-center p-4 bg-slate-50 rounded-xl">
              <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-slate-500 mt-1 font-semibold">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
