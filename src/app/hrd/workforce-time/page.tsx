"use client";

import { useState, useEffect } from "react";
import { Users, CalendarClock, Wrench, Clock3 } from "lucide-react";
import { getWorkforceTimeStats } from "@/app/actions/workforce-time";
import SectionQuickLinks from "@/components/hrd/SectionQuickLinks";

export default function WorkforceTimeDashboard() {
  const [stats, setStats] = useState({ hadirHariIni: 0, pendingCuti: 0, pendingKoreksi: 0, pendingLembur: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { getWorkforceTimeStats().then(s => { setStats(s); setLoading(false); }); }, []);

  if (loading) return <div className="p-6 lg:p-8 flex items-center justify-center h-64"><p className="text-sm text-slate-500">Memuat data...</p></div>;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Workforce Time Management</h1>
        <p className="text-sm text-gray-500">Kelola siapa bekerja, di mana, kapan, dan untuk proyek apa — bukan sekadar catat hadir/tidak. Seluruh referensi lokasi &amp; organisasi ditarik dari Desain Organisasi, bukan diketik ulang.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Hadir Hari Ini", value: stats.hadirHariIni, icon: Users, color: "bg-emerald-50 text-emerald-600" },
          { label: "Cuti/Izin Pending", value: stats.pendingCuti, icon: CalendarClock, color: "bg-amber-50 text-amber-600" },
          { label: "Koreksi Pending", value: stats.pendingKoreksi, icon: Wrench, color: "bg-blue-50 text-blue-600" },
          { label: "Lembur Pending", value: stats.pendingLembur, icon: Clock3, color: "bg-purple-50 text-purple-600" },
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

      <SectionQuickLinks groupLabel="Workforce Time Management" excludeHref="/hrd/workforce-time" />
    </div>
  );
}
