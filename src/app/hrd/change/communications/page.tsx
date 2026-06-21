import { supabaseAdmin } from "@/lib/supabase";
import { MessageCircle } from "lucide-react";
import CommunicationsForm from "./CommunicationsForm";

export default async function RencanaKomunikasi() {
  const { data: employees } = await supabaseAdmin
    .from("employees")
    .select("id, full_name, department, position")
    .neq("status", "Resigned")
    .order("department")
    .order("full_name");

  const departments = [...new Set((employees || []).map((e: Record<string, unknown>) => e.department as string))].filter(Boolean) as string[];

  const channels = ["Email", "Rapat", "Intranet", "WhatsApp Group", "Townhall", "Memo Internal"];
  const frequencies = ["Harian", "Mingguan", "Dua Mingguan", "Bulanan", "Sekali Saja"];

  let comms: Array<Record<string, unknown>> = [];
  const { data, error } = await supabaseAdmin
    .from("change_communications")
    .select("*")
    .order("created_at", { ascending: false });
  if (!error || (error as unknown as Record<string, unknown>)?.code !== "42P01") {
    comms = data || [];
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Rencana Komunikasi</h1>
        <p className="text-sm text-gray-500">Kelola rencana komunikasi perubahan, audiens, pesan, dan kalender komunikasi.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Rencana", value: comms.length, color: "bg-blue-50 text-blue-600" },
          { label: "Email", value: comms.filter((c) => c.channel === "Email").length, color: "bg-emerald-50 text-emerald-600" },
          { label: "Rapat", value: comms.filter((c) => c.channel === "Rapat").length, color: "bg-amber-50 text-amber-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${s.color}`}><MessageCircle size={18} /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p>
                <p className="text-xl font-extrabold text-slate-800">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Daftar Rencana Komunikasi</h3>
          </div>
          {comms.length === 0 ? (
            <div className="p-12 text-center">
              <MessageCircle size={40} className="mx-auto text-slate-300 mb-4" />
              <p className="text-sm text-slate-500">Belum ada rencana komunikasi.</p>
              <p className="text-xs text-slate-400 mt-1">Gunakan formulir di samping untuk menambahkan rencana komunikasi.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {comms.map((c) => (
                <div key={c.id as string} className="p-6 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-slate-800 text-xs">{c.target as string || "Semua Karyawan"} · {c.channel as string}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{c.message as string}</p>
                    </div>
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold shrink-0 ml-4">{c.frequency as string}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <CommunicationsForm
          departments={departments}
          employees={(employees || []) as Array<{ id: string; full_name: string }>}
          channels={channels}
          frequencies={frequencies}
        />
      </div>
    </div>
  );
}
