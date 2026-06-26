import { supabaseAdmin } from "@/lib/supabase";
import { DollarSign, Plus, TrendingUp, AlertCircle, CheckCircle2, Wallet, Briefcase, Users, GraduationCap, Building2 } from "lucide-react";

async function saveBudget(formData: FormData) {
  "use server";
  // Fitur akan segera tersedia
}

const SEED_BUDGET = [
  { id: 1, category: "Rekrutmen", allocated: 150000000, used: 85000000, icon: <Briefcase size={14} />, color: "blue" },
  { id: 2, category: "Pelatihan & Pengembangan", allocated: 300000000, used: 120000000, icon: <GraduationCap size={14} />, color: "emerald" },
  { id: 3, category: "Payroll & Gaji", allocated: 2500000000, used: 1250000000, icon: <Wallet size={14} />, color: "amber" },
  { id: 4, category: "Tunjangan & Benefit", allocated: 500000000, used: 320000000, icon: <DollarSign size={14} />, color: "purple" },
  { id: 5, category: "Operasional HR", allocated: 200000000, used: 95000000, icon: <Building2 size={14} />, color: "red" },
  { id: 6, category: "Sistem & Teknologi HR", allocated: 350000000, used: 210000000, icon: <Users size={14} />, color: "indigo" },
];

function formatRupiah(n: number) {
  if (n >= 1e9) return `Rp ${(n / 1e9).toFixed(1)}M`;
  if (n >= 1e6) return `Rp ${(n / 1e6).toFixed(0)}M`;
  return `Rp ${n.toLocaleString("id-ID")}`;
}

export default async function AnggaranSDM() {
  const { data: payrolls } = await supabaseAdmin.from("payroll").select("net_salary, status");
  const totalActualPayroll = (payrolls || []).reduce((s: number, p: Record<string, unknown>) => s + (Number(p.net_salary) || 0), 0);

  const totalAllocated = SEED_BUDGET.reduce((s, b) => s + b.allocated, 0);
  const totalUsed = SEED_BUDGET.reduce((s, b) => s + b.used, 0);
  const totalRemaining = totalAllocated - totalUsed;
  const overallPct = totalAllocated > 0 ? Math.round((totalUsed / totalAllocated) * 100) : 0;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Anggaran SDM</h1>
        <p className="text-sm text-gray-500">Perencanaan, alokasi, dan monitoring anggaran pengelolaan sumber daya manusia.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Anggaran", value: formatRupiah(totalAllocated), icon: <Wallet size={18} />, color: "blue" },
          { label: "Total Terpakai", value: formatRupiah(totalUsed), icon: <TrendingUp size={18} />, color: "emerald" },
          { label: "Sisa Anggaran", value: formatRupiah(totalRemaining), icon: <CheckCircle2 size={18} />, color: totalRemaining > 0 ? "amber" : "red" },
          { label: "Persentase Terpakai", value: `${overallPct}%`, icon: <DollarSign size={18} />, color: overallPct > 80 ? "red" : "purple" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${
                stat.color === "blue" ? "bg-blue-50 text-blue-600" :
                stat.color === "emerald" ? "bg-emerald-50 text-emerald-600" :
                stat.color === "amber" ? "bg-amber-50 text-amber-600" :
                stat.color === "red" ? "bg-red-50 text-red-600" :
                "bg-purple-50 text-purple-600"
              }`}>{stat.icon}</div>
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
                <h3 className="font-extrabold text-slate-800 text-sm">Tambah / Edit Anggaran</h3>
                <p className="text-xs text-slate-400 mt-0.5">Kelola alokasi per kategori</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <form action={saveBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Kategori</label>
                <select name="kategori" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30">
                  <option value="">Pilih Kategori</option>
                  <option>Rekrutmen</option>
                  <option>Pelatihan & Pengembangan</option>
                  <option>Payroll & Gaji</option>
                  <option>Tunjangan & Benefit</option>
                  <option>Operasional HR</option>
                  <option>Sistem & Teknologi HR</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Anggaran Dialokasikan (Rp)</label>
                <input type="number" name="anggaran_dialokasikan" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30" placeholder="Contoh: 150000000" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Sudah Terpakai (Rp)</label>
                <input type="number" name="sudah_terpakai" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30" placeholder="Contoh: 85000000" />
              </div>
              <button type="submit" className="w-full px-4 py-2.5 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center justify-center gap-2">
                <Plus size={14} /> Simpan Anggaran
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <DollarSign size={16} className="text-blue-600" />
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Tabel Anggaran per Kategori</h3>
                <p className="text-xs text-slate-400 mt-0.5">Alokasi, penggunaan, dan sisa anggaran</p>
              </div>
            </div>
          </div>

          <div className="hidden sm:block">
            <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <div className="col-span-4">Kategori</div>
              <div className="col-span-2 text-right">Alokasi</div>
              <div className="col-span-2 text-right">Terpakai</div>
              <div className="col-span-2 text-right">Sisa</div>
              <div className="col-span-2 text-right">% Pakai</div>
            </div>
          </div>

          <div className="divide-y divide-slate-50">
            {SEED_BUDGET.length === 0 ? (
              <div className="p-12 text-center">
                <Wallet size={40} className="mx-auto text-slate-300 mb-4" />
                <p className="text-sm text-slate-500">Belum ada data anggaran.</p>
                <p className="text-xs text-slate-400 mt-1">Tambahkan alokasi anggaran untuk setiap kategori.</p>
              </div>
            ) : (
              SEED_BUDGET.map((item) => {
                const remaining = item.allocated - item.used;
                const pct = item.allocated > 0 ? Math.round((item.used / item.allocated) * 100) : 0;
                const overBudget = item.used > item.allocated;
                return (
                  <div key={item.id} className="p-5 hover:bg-slate-50/30 transition-colors">
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-4 flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${
                          item.color === "blue" ? "bg-blue-50 text-blue-600" :
                          item.color === "emerald" ? "bg-emerald-50 text-emerald-600" :
                          item.color === "amber" ? "bg-amber-50 text-amber-600" :
                          item.color === "purple" ? "bg-purple-50 text-purple-600" :
                          item.color === "red" ? "bg-red-50 text-red-600" :
                          "bg-indigo-50 text-indigo-600"
                        }`}>{item.icon}</div>
                        <span className="text-xs font-bold text-slate-800">{item.category}</span>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="text-xs font-bold text-slate-700">{formatRupiah(item.allocated)}</span>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="text-xs font-bold text-slate-700">{formatRupiah(item.used)}</span>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className={`text-xs font-bold ${overBudget ? "text-red-600" : remaining < item.allocated * 0.1 ? "text-amber-600" : "text-emerald-600"}`}>
                          {formatRupiah(remaining)}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center gap-2 justify-end">
                          <div className="flex-1 max-w-[60px] h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${pct > 90 ? "bg-red-500" : pct > 70 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                          <span className={`text-[10px] font-bold w-8 text-right ${pct > 90 ? "text-red-600" : "text-slate-600"}`}>{pct}%</span>
                          {overBudget && <AlertCircle size={12} className="text-red-500" />}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Total Penggunaan Anggaran</span>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-700">{formatRupiah(totalUsed)}</span>
                <span className="text-[10px] text-slate-400">dari</span>
                <span className="text-xs font-bold text-slate-700">{formatRupiah(totalAllocated)}</span>
                <span className={`text-xs font-bold ${overallPct > 90 ? "text-red-600" : "text-emerald-600"}`}>({overallPct}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
