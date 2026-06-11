import { supabaseAdmin } from "@/lib/supabase";
import { CheckCircle, ArrowRight, Users, Clock, FileText } from "lucide-react";

export default async function AlurPersetujuan() {
  const workflows = [
    {
      name: "Cuti",
      icon: Clock,
      desc: "Persetujuan pengajuan cuti karyawan",
      steps: ["Karyawan Mengajukan", "Atasan Langsung", "HRD", "Disetujui"],
      color: "bg-blue-50 text-blue-600",
    },
    {
      name: "Lembur",
      icon: Clock,
      desc: "Persetujuan pengajuan lembur",
      steps: ["Karyawan Mengajukan", "Atasan Langsung", "Manager", "Disetujui"],
      color: "bg-amber-50 text-amber-600",
    },
    {
      name: "Pelatihan",
      icon: FileText,
      desc: "Persetujuan permintaan pelatihan",
      steps: ["Karyawan Mengajukan", "Manager", "HRD", "Disetujui"],
      color: "bg-purple-50 text-purple-600",
    },
    {
      name: "Promosi",
      icon: Users,
      desc: "Persetujuan kenaikan jabatan",
      steps: ["Manager Mengajukan", "HRD Review", "Direktur", "Disetujui"],
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      name: "Pengunduran Diri",
      icon: Users,
      desc: "Proses persetujuan resign",
      steps: ["Karyawan Mengajukan", "Atasan Langsung", "HRD", "Exit Process"],
      color: "bg-red-50 text-red-600",
    },
  ];

  const { data: managers } = await supabaseAdmin
    .from("employees")
    .select("id, full_name, position")
    .or("position.ilike.%Manager%, position.ilike.%Direktur%, position.ilike.%Head%")
    .neq("status", "Resigned")
    .order("full_name")
    .limit(15);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Alur Persetujuan</h1>
        <p className="text-sm text-gray-500">Konfigurasi workflow persetujuan untuk berbagai proses HR.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {workflows.map((wf) => (
          <div key={wf.name} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer p-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Konfigurasi Workflow</h3>
            <p className="text-xs text-slate-400 mt-0.5">Atur langkah dan approver</p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Pilih Workflow</label>
              <select className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none">
                {workflows.map((wf) => (
                  <option key={wf.name} value={wf.name}>{wf.name} - {wf.desc}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Jumlah Langkah</label>
              <input type="number" min="1" max="10" defaultValue={3} className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">{step}</div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Approver Level {step}</label>
                    <select className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none">
                      <option value="">Pilih approver...</option>
                      {(managers || []).map((m: Record<string, unknown>) => (
                        <option key={m.id as string} value={m.id as string}>{m.full_name as string} - {m.position as string}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors">
              Simpan Konfigurasi
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Syarat & Kondisi</h3>
            <p className="text-xs text-slate-400 mt-0.5">Atur kondisi approval</p>
          </div>
          <div className="p-6 space-y-4">
            {[
              { label: "Minimal hari cuti untuk auto-approve", type: "number", val: "3" },
              { label: "Batas approval (hari kerja)", type: "number", val: "2" },
              { label: "Eskalasi jika tidak di-approve", type: "select", val: "Aktif" },
              { label: "Kirim notifikasi email", type: "checkbox", val: true },
              { label: "Require alasan penolakan", type: "checkbox", val: true },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-xs text-slate-700">{item.label}</span>
                {item.type === "checkbox" ? (
                  <input type="checkbox" className="accent-[#CC0000] w-4 h-4" defaultChecked={item.val as boolean} />
                ) : item.type === "number" ? (
                  <input type="number" defaultValue={item.val as string} className="w-16 text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-center text-gray-600" />
                ) : (
                  <select className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-600">
                    <option>Aktif</option>
                    <option>Nonaktif</option>
                  </select>
                )}
              </div>
            ))}
            <button className="w-full px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors">
              Simpan Kondisi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
