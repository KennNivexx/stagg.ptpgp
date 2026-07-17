"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, Plus } from "lucide-react";
import { saveRewardBudget } from "@/app/actions/rewards";

function currentPeriod() {
  const now = new Date();
  return `${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
}

export default function RewardBudgetPanel({ departments }: { departments: string[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSave = async (fd: FormData) => {
    setBusy(true);
    const res = await saveRewardBudget(fd);
    setBusy(false);
    if ("error" in res) { setMsg(res.error); return; }
    setMsg("Pagu reward tersimpan.");
    setTimeout(() => setMsg(""), 3000);
    router.refresh();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <h3 className="font-extrabold text-slate-800 text-sm mb-1 flex items-center gap-2"><Wallet size={16} className="text-pgp-red" /> Reward Budget Control</h3>
      <p className="text-xs text-slate-400 mb-4">Tetapkan pagu reward per departemen per periode — jadi indikator saat approve bonus/insentif.</p>
      {msg && <p className="text-xs text-emerald-600 font-semibold mb-3">{msg}</p>}
      <form action={handleSave} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <select name="department" required className="border border-gray-200 p-2.5 rounded-xl text-xs bg-white">
          <option value="">Departemen...</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <input name="period" defaultValue={currentPeriod()} placeholder="MM/YYYY" required className="border border-gray-200 p-2.5 rounded-xl text-xs" />
        <input name="budget_amount" type="number" min="0" placeholder="Nominal Pagu (Rp)" required className="border border-gray-200 p-2.5 rounded-xl text-xs" />
        <button type="submit" disabled={busy} className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold disabled:opacity-50">
          <Plus size={13} /> Simpan
        </button>
      </form>
    </div>
  );
}
