"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { saveApprovalConfig } from "@/app/actions/admin";

type Manager = { id: string; full_name: string; position: string };

interface Props {
  managers: Manager[];
  workflows: string[];
}

function Msg({ m }: { m: { type: "success" | "error"; text: string } | null }) {
  if (!m) return null;
  return <div className={`p-3 rounded-xl text-xs font-medium ${m.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{m.text}</div>;
}

export default function ApprovalsForm({ managers, workflows }: Props) {
  const router = useRouter();
  const configRef = useRef<HTMLFormElement>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [msgConfig, setMsgConfig] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSaveConfig() {
    if (!configRef.current) return;
    setLoadingConfig(true); setMsgConfig(null);
    const result = await saveApprovalConfig(new FormData(configRef.current));
    setLoadingConfig(false);
    if ("error" in result) { setMsgConfig({ type: "error", text: result.error ?? "Terjadi kesalahan" }); return; }
    setMsgConfig({ type: "success", text: "Konfigurasi approval berhasil disimpan!" });
    configRef.current.reset();
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm">Konfigurasi Alur Approval</h3>
          <p className="text-xs text-slate-400 mt-0.5">Atur alur persetujuan untuk setiap workflow</p>
        </div>
        <form ref={configRef} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Workflow</label>
              <select name="workflow_name" className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:border-[#CC0000] outline-none bg-white">
                <option value="">Pilih workflow...</option>
                {workflows.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Approver Level 1</label>
              <select name="approver_level1" className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:border-[#CC0000] outline-none bg-white">
                <option value="">Pilih approver...</option>
                {managers.map((m) => <option key={m.id} value={m.id}>{m.full_name} - {m.position}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Approver Level 2 (Opsional)</label>
              <select name="approver_level2" className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:border-[#CC0000] outline-none bg-white">
                <option value="">Tidak ada</option>
                {managers.map((m) => <option key={m.id} value={m.id}>{m.full_name} - {m.position}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">SLA (hari)</label>
              <input name="sla_days" type="number" min="1" defaultValue={3} className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:border-[#CC0000] outline-none" />
            </div>
          </div>
          <Msg m={msgConfig} />
          <button type="button" onClick={handleSaveConfig} disabled={loadingConfig}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors disabled:opacity-60">
            <Save size={14} /> {loadingConfig ? "Menyimpan..." : "Simpan Konfigurasi"}
          </button>
        </form>
      </div>
    </div>
  );
}
