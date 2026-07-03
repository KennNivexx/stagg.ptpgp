"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Users, Building2, TrendingUp, AlertCircle, RefreshCw } from "lucide-react";
import { syncAllHeadcounts, getHeadcountData } from "@/app/actions/headcount";
import EmptyState from "@/components/EmptyState";

interface DeptHC {
  id: string; name: string; current: number; approved: number;
}

export default function HeadcountClient({
  initialData,
}: {
  initialData: DeptHC[];
}) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const syncFromEmployees = async () => {
    setSyncing(true);
    try {
      await syncAllHeadcounts();
      const fresh = await getHeadcountData();
      setData(fresh);
      router.refresh();
      showToast("Headcount disinkronkan dari data karyawan + permintaan disetujui.", "success");
    } catch (_e) {
      showToast("Sinkronisasi gagal.", "error");
    }
    setSyncing(false);
  };

  const totalCurrent = data.reduce((s, d) => s + d.current, 0);
  const totalApproved = data.reduce((s, d) => s + d.approved, 0);
  const totalVariance = totalApproved - totalCurrent;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg border text-sm font-bold ${
          toast.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"
        }`}>
          {toast.msg}
        </div>
      )}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Headcount Planning</h1>
          <p className="text-sm text-gray-500">Headcount dihitung otomatis: karyawan existing + permintaan SDM yang disetujui Director. HRD tidak bisa mengubah manual.</p>
        </div>
        <button
          onClick={syncFromEmployees}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Menyinkronkan..." : "Sinkronkan dari Data Karyawan"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Karyawan Saat Ini", value: totalCurrent, icon: <Users size={18} />, color: "blue" },
          { label: "Headcount Disetujui", value: totalApproved, icon: <BarChart3 size={18} />, color: "emerald" },
          { label: "Kekosongan", value: totalVariance, icon: <TrendingUp size={18} />, color: totalVariance > 0 ? "amber" : "red" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${
                stat.color === "blue" ? "bg-blue-50 text-blue-600" :
                stat.color === "emerald" ? "bg-emerald-50 text-emerald-600" :
                stat.color === "amber" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
              }`}>{stat.icon}</div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{stat.label}</p>
                <p className="text-xl font-extrabold text-slate-800">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-blue-600" />
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Headcount per Departemen</h3>
              <p className="text-xs text-slate-400 mt-0.5">Headcount dihitung otomatis dari karyawan existing + permintaan disetujui</p>
            </div>
          </div>
        </div>

        <div className="hidden sm:grid grid-cols-12 gap-2 px-6 py-3 bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          <div className="col-span-4">Departemen</div>
          <div className="col-span-2 text-center">Saat Ini</div>
          <div className="col-span-2 text-center">Disetujui</div>
          <div className="col-span-2 text-center">Kekosongan</div>
          <div className="col-span-2 text-center">Progress</div>
        </div>

        <div className="divide-y divide-slate-50 max-h-[60vh] overflow-y-auto">
          {syncing ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CC0000] mx-auto mb-3" />
              <p className="text-sm text-slate-500">Menyinkronkan data headcount...</p>
            </div>
          ) : data.length === 0 ? (
            <EmptyState icon={Users} title="Belum ada data." />
          ) : (
            data.map((dept) => {
              const pct = dept.approved > 0 ? Math.round((dept.current / dept.approved) * 100) : 0;
              const isEmpty = dept.approved === 0;
              const isFull = !isEmpty && dept.current >= dept.approved;
              const isOver = !isEmpty && dept.current > dept.approved;

              return (
                <div key={dept.id} className="p-5 hover:bg-slate-50/30 transition-colors">
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4">
                      <p className="text-sm font-bold text-slate-800">{dept.name}</p>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className={`text-sm font-extrabold ${dept.current > 0 ? "text-slate-800" : "text-slate-300"}`}>{dept.current}</span>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="text-sm font-bold text-slate-600">{dept.approved}</span>
                    </div>
                    <div className="col-span-2 text-center">
                      {isEmpty ? (
                        <span className="text-[10px] font-bold text-slate-400">Tentukan kuota →</span>
                      ) : isOver ? (
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">Kelebihan {dept.current - dept.approved}</span>
                      ) : dept.approved > dept.current ? (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">Kosong {dept.approved - dept.current}</span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">Penuh</span>
                      )}
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          {isEmpty ? (
                            <div className="h-full bg-amber-200 w-full" />
                          ) : (
                            <div className={`h-full rounded-full ${isOver ? "bg-red-500" : isFull ? "bg-emerald-500" : "bg-blue-500"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                          )}
                        </div>
                        <span className={`text-[10px] font-bold w-8 text-right ${isEmpty ? "text-amber-500" : isOver ? "text-red-600" : "text-slate-600"}`}>
                          {isEmpty ? "—" : `${pct}%`}
                        </span>
                        {isOver && <AlertCircle size={12} className="text-red-500" />}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 text-[10px] text-slate-400">
          <span className="text-sky-600 font-bold">Auto</span> = headcount dihitung dari karyawan existing + permintaan SDM yang disetujui Director.
        </div>
      </div>
    </div>
  );
}
